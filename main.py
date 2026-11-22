import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routes.api import router as api_router
from app.schemas.api_schemas import ApiResponse
import app.config as config
from app.errors import LLMQuotaExceededError, LLMServiceError

# Standard logger for recording full error tracebacks in the server terminal
logger = logging.getLogger("docmind")

app = FastAPI(
    title="DocMind API",
    description="Local RAG document Q&A backend powered by FastAPI, LangChain, Chroma, Hugging Face, and Gemini.",
    version="0.1.0",
)

# Allow the browser frontend on port 5173 to call this API on port 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Wrap HTTP errors (400, 404, 409, 413, 429, etc.) in the standard ApiResponse envelope."""
    payload = ApiResponse(
        success=False,
        data=None,
        message=str(exc.detail),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Wrap Pydantic/FastAPI 422 validation errors in a clean, user-friendly ApiResponse."""
    errors = exc.errors()
    if errors:
        first = errors[0]
        # Skip the leading "body" segment so the message points cleanly to the field name
        loc_parts = [str(part) for part in first.get("loc", ()) if part != "body"]
        field = ".".join(loc_parts)
        reason = first.get("msg", "Invalid input.")
        message = f"Invalid '{field}': {reason}" if field else reason
    else:
        message = "Invalid request data."

    payload = ApiResponse(
        success=False,
        data=None,
        message=message,
    )
    return JSONResponse(status_code=422, content=payload.model_dump())

@app.exception_handler(LLMQuotaExceededError)
async def llm_quota_exception_handler(
    request: Request, exc: LLMQuotaExceededError
) -> JSONResponse:
    """Map Gemini rate-limit/quota errors to HTTP 429 in the standard ApiResponse envelope."""
    payload = ApiResponse(
        success=False,
        data=None,
        message=str(exc),
    )
    return JSONResponse(status_code=429, content=payload.model_dump())


@app.exception_handler(LLMServiceError)
async def llm_service_exception_handler(
    request: Request, exc: LLMServiceError
) -> JSONResponse:
    """Map missing/invalid API key or model unavailability to HTTP 503."""
    payload = ApiResponse(
        success=False,
        data=None,
        message=str(exc),
    )
    return JSONResponse(status_code=503, content=payload.model_dump())

@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Log unexpected server errors in the terminal and return a safe 500 JSON message."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    payload = ApiResponse(
        success=False,
        data=None,
        message="An unexpected server error occurred. Please check the server logs.",
    )
    return JSONResponse(status_code=500, content=payload.model_dump())


# Mount all /api routes from app/routes/api.py
app.include_router(api_router)