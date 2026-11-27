import logging

logger = logging.getLogger("docmind")


class DocMindError(Exception):
    """Base class for all custom DocMind domain exceptions."""


class FileTooLargeError(DocMindError):
    """Raised when an uploaded file exceeds config.MAX_UPLOAD_SIZE_BYTES."""

class DocumentNotFoundError(DocMindError):
    """Raised when a requested doc_id does not exist in documents.json."""


class LLMQuotaExceededError(DocMindError):
    """Raised when the hosted LLM rejects a request due to rate or quota limits."""


class LLMServiceError(DocMindError):
    """Raised when the hosted LLM is misconfigured (bad/missing key) or unavailable."""


def map_gemini_error(exc: Exception) -> DocMindError | None:
    """Translate known Gemini SDK/API failures into DocMind domain errors.

    Returns None for unrecognized exceptions so unexpected bugs are not masked.
    """
    # Read HTTP status code from the exception or its wrapped __cause__ (google.genai.errors.APIError)
    code = getattr(exc, "code", None) or getattr(exc.__cause__, "code", None)
    text = str(exc).upper()

    if code == 429 or "429" in text or "RESOURCE_EXHAUSTED" in text or "QUOTA" in text:
        logger.warning("Gemini rate limit hit: %s", exc)
        return LLMQuotaExceededError(
            "Gemini free-tier rate limit reached. Please wait a minute and try again."
        )

    if (
        code in (401, 403)
        or "API_KEY_INVALID" in text
        or "INVALID API KEY" in text
        or "PERMISSION_DENIED" in text
    ):
        logger.warning("Gemini API key/auth failure: %s", exc)
        return LLMServiceError(
            "Gemini API key is invalid or unauthorized. Check GEMINI_API_KEY in .env."
        )

    if (
        code in (404, 503)
        or "UNAVAILABLE" in text
        or "OVERLOADED" in text
        or "NOT_FOUND" in text
    ):
        logger.warning("Gemini model/service unavailable: %s", exc)
        return LLMServiceError(
            "The Gemini model is temporarily unavailable. Please try again shortly."
        )

    return None