from datetime import datetime, timezone
import json
from pathlib import Path
import uuid

import re
from typing import BinaryIO

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app import config
from app.errors import FileTooLargeError
from app.storage import vector_store

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
DEFAULT_CHUNK_SIZE = 800
DEFAULT_CHUNK_OVERLAP = 120


def load_registry() -> list[dict]:
    """Read the document registry from data/documents.json (returns [] if missing)."""
    if not config.REGISTRY_PATH.exists():
        return []
    raw = config.REGISTRY_PATH.read_text(encoding="utf-8").strip()
    return json.loads(raw) if raw else []


def save_registry(records: list[dict]) -> None:
    """Persist the document registry list to data/documents.json."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    config.REGISTRY_PATH.write_text(
        json.dumps(records, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def load_file_documents(file_path: Path, filename: str) -> list[Document]:
    """Extract text from PDF, TXT, or MD into LangChain Document objects."""
    ext = file_path.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: .pdf, .txt, .md")

    docs: list[Document] = []

    if ext == ".pdf":
        reader = PdfReader(str(file_path))
        for page_num, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                docs.append(
                    Document(
                        page_content=text,
                        metadata={"filename": filename, "page": page_num},
                    )
                )
    else:
        text = file_path.read_text(encoding="utf-8", errors="replace").strip()
        if text:
            docs.append(
                Document(
                    page_content=text,
                    metadata={"filename": filename, "page": 0},
                )
            )

    if not docs:
        raise ValueError("No readable text found in the uploaded file.")

    return docs


def split_into_chunks(
    docs: list[Document],
    doc_id: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Document]:
    """Split Documents into overlapping chunks and stamp doc_id + chunk_index metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunks = splitter.split_documents(docs)

    for idx, chunk in enumerate(chunks):
        chunk.metadata["doc_id"] = doc_id
        chunk.metadata["chunk_index"] = idx

    return chunks


def ingest_document(
    file_path: Path,
    original_filename: str | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> dict:
    """Validate, parse, chunk, embed into Chroma, and record a document in documents.json."""
    filename = original_filename or file_path.name
    records = load_registry()

    if any(r["filename"].lower() == filename.lower() for r in records):
        raise FileExistsError(
            f"A document named '{filename}' already exists. Delete it first."
        )

    doc_id = str(uuid.uuid4())
    raw_docs = load_file_documents(file_path, filename)
    chunks = split_into_chunks(raw_docs, doc_id, chunk_size, chunk_overlap)

    vs = vector_store.get_vector_store()
    vs.add_documents(chunks)

    record = {
        "doc_id": doc_id,
        "filename": filename,
        "stored_path": str(file_path),
        "chunk_count": len(chunks),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    records.append(record)
    save_registry(records)
    return record

UPLOAD_READ_CHUNK_SIZE = 64 * 1024  # Read uploads in 64 KB chunks
UNSAFE_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_filename(raw_filename: str | None) -> str:
    """Strip directory paths and OS-unsafe characters from a client-supplied filename."""
    if not raw_filename:
        return ""
    # Normalize Windows backslashes so Path(...).name strips paths on any OS
    base_name = Path(raw_filename.replace("\\", "/")).name.strip()
    # Replace Windows-forbidden and control characters, then trim edge dots/spaces
    return UNSAFE_FILENAME_CHARS.sub("_", base_name).strip(". ")


def ingest_uploaded_file(file_obj: BinaryIO, raw_filename: str | None) -> dict:
    """Validate, stream-save to data/uploads/, and ingest an uploaded file safely."""
    safe_name = sanitize_filename(raw_filename)
    if not safe_name:
        raise ValueError("Uploaded file must have a valid filename.")

    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: .pdf, .txt, .md")

    # Reject duplicate display names before writing anything to disk
    records = load_registry()
    if any(r["filename"].lower() == safe_name.lower() for r in records):
        raise FileExistsError(
            f"A document named '{safe_name}' already exists. Delete it first."
        )

    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    # Use a server-generated filename on disk to eliminate path/encoding collisions
    saved_path = config.UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"

    total_bytes = 0
    too_large = False

    with saved_path.open("wb") as out_file:
        while chunk := file_obj.read(UPLOAD_READ_CHUNK_SIZE):
            total_bytes += len(chunk)
            if total_bytes > config.MAX_UPLOAD_SIZE_BYTES:
                too_large = True
                break
            out_file.write(chunk)

    # Delete outside the 'with' block so the file handle is closed (required on Windows)
    if too_large:
        saved_path.unlink(missing_ok=True)
        raise FileTooLargeError(
            f"File exceeds the {config.MAX_UPLOAD_SIZE_MB} MB upload limit."
        )

    if total_bytes == 0:
        saved_path.unlink(missing_ok=True)
        raise ValueError("Uploaded file is empty.")

    try:
        return ingest_document(saved_path, original_filename=safe_name)
    except Exception:
        # Remove orphan file if parsing, chunking, or vector storage fails
        saved_path.unlink(missing_ok=True)
        raise