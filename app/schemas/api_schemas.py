from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

# Generic placeholder type so ApiResponse can wrap any payload type (or None)
T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard JSON response envelope returned by every DocMind endpoint."""

    success: bool
    data: T | None = None
    message: str


class DocumentRecord(BaseModel):
    """Public metadata for an uploaded document (intentionally excludes stored_path)."""

    doc_id: str
    filename: str
    chunk_count: int
    uploaded_at: str


class Citation(BaseModel):
    """Source chunk metadata returned alongside a grounded RAG answer."""

    doc_id: str
    filename: str
    page: int
    chunk_index: int
    preview: str


class AskRequest(BaseModel):
    """Validated request body for POST /api/ask (Tier 1)."""

    # Strip leading/trailing whitespace before min_length runs so "   " is rejected
    model_config = ConfigDict(str_strip_whitespace=True)

    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's question to answer from uploaded documents.",
    )


class AskData(BaseModel):
    """Payload returned inside ApiResponse.data for POST /api/ask."""

    answer: str
    citations: list[Citation]