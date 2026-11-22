import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.api_schemas import ApiResponse, AskData, AskRequest, DocumentRecord
from app.services import document_service, rag_service

logger = logging.getLogger("docmind")

# Group all backend endpoints under /api and label them cleanly in Swagger UI (/docs)
router = APIRouter(prefix="/api", tags=["DocMind API"])


@router.get("/ping", response_model=ApiResponse[dict[str, str]])
def ping() -> ApiResponse[dict[str, str]]:
    """Lightweight connectivity check to verify FastAPI routing and the JSON envelope."""
    return ApiResponse(
        success=True,
        data={"status": "ok"},
        message="DocMind API is running.",
    )

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
        result = rag_service.ask_question(payload.question)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ApiResponse(
        success=True,
        data=AskData.model_validate(result),
        message="Answer generated successfully.",
    )