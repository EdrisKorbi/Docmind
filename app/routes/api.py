import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.api_schemas import (
    ApiResponse,
    AskData,
    AskRequest,
    DocumentRecord,
    SummaryData,
)
from app.services import document_service, rag_service

logger = logging.getLogger("docmind")

# Group all backend endpoints under /api and label them cleanly in Swagger UI (/docs)
router = APIRouter(prefix="/api", tags=["DocMind API"])


@router.post(
    "/documents/upload",
    status_code=201,
    response_model=ApiResponse[DocumentRecord],
)
def upload_document(
    file: UploadFile = File(...),
) -> ApiResponse[DocumentRecord]:
    """Upload, validate, chunk, embed locally, and persist a PDF, TXT, or MD file."""
    try:
        record = document_service.ingest_uploaded_file(file.file, file.filename)
    except document_service.FileTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        file.file.close()

    return ApiResponse(
        success=True,
        data=DocumentRecord.model_validate(record),
        message=f"Uploaded and indexed '{record['filename']}' ({record['chunk_count']} chunks).",
    )


@router.post("/ask", response_model=ApiResponse[AskData])
def ask_question(payload: AskRequest) -> ApiResponse[AskData]:
    """Retrieve relevant chunks locally and return a grounded Gemini answer with citations."""
    try:
        result = rag_service.ask_question(
            payload.question,
            doc_id=payload.doc_id,
            session_id=payload.session_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ApiResponse(
        success=True,
        data=AskData.model_validate(result),
        message="Answer generated successfully.",
    )


@router.get("/documents", response_model=ApiResponse[list[DocumentRecord]])
def list_documents() -> ApiResponse[list[DocumentRecord]]:
    """Return all uploaded documents with their chunk counts and timestamps."""
    records = document_service.list_documents()
    docs = [DocumentRecord.model_validate(record) for record in records]
    return ApiResponse(
        success=True,
        data=docs,
        message=f"Found {len(docs)} document(s).",
    )


@router.delete("/documents/{doc_id}", response_model=ApiResponse[DocumentRecord])
def delete_document(doc_id: str) -> ApiResponse[DocumentRecord]:
    """Delete a document and all of its vector chunks by doc_id."""
    deleted = document_service.delete_document(doc_id)
    return ApiResponse(
        success=True,
        data=DocumentRecord.model_validate(deleted),
        message=f"Deleted '{deleted['filename']}' and its {deleted['chunk_count']} chunk(s).",
    )


@router.delete("/sessions/{session_id}", response_model=ApiResponse[dict])
def clear_chat_session(session_id: str) -> ApiResponse[dict]:
    """Clear in-memory conversation history for a chat session."""
    existed = rag_service.session_store.clear_session(session_id)
    return ApiResponse(
        success=True,
        data={"session_id": session_id, "cleared": existed},
        message="Chat history cleared." if existed else "Session was already empty.",
    )


@router.post("/documents/{doc_id}/summarize", response_model=ApiResponse[SummaryData])
def summarize_document(doc_id: str) -> ApiResponse[SummaryData]:
    """Generate a structured summary of one uploaded document."""
    result = rag_service.summarize_document(doc_id)
    return ApiResponse(
        success=True,
        data=SummaryData.model_validate(result),
        message=f"Summary generated for '{result['filename']}'.",
    )
