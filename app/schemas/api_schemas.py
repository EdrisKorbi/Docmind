from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    """Validated request body for POST /api/ask."""

    # Strip leading/trailing whitespace before min_length runs so "   " is rejected
    model_config = ConfigDict(str_strip_whitespace=True)

    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's question to answer from uploaded documents.",
    )
    doc_id: str | None = Field(
        default=None,
        description="Optional document ID to restrict retrieval to a single file.",
    )

    session_id: str | None = Field(
        default=None,
        max_length=100,
        description="Optional chat session ID to enable multi-turn follow-up memory.",
    )

    @field_validator("doc_id", "session_id", mode="before")
    @classmethod
    def normalize_optional_ids(cls, value: str | None) -> str | None:
        """Convert blank or whitespace-only optional IDs to None."""
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value

class SummaryData(BaseModel):
    """Response payload for POST /api/documents/{doc_id}/summarize."""

    doc_id: str
    filename: str
    summary: str
    chunks_used: int
    total_chunks: int

class AskData(BaseModel):
    """Payload returned inside ApiResponse.data for POST /api/ask."""

    answer: str
    citations: list[Citation]