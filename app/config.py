import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve the project root directory (docmind/) regardless of where Python is invoked from
BASE_DIR = Path(__file__).resolve().parent.parent

# Load variables from docmind/.env into os.environ
load_dotenv(BASE_DIR / ".env")

# Local runtime storage paths (created on demand in later phases)
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma_db"
REGISTRY_PATH = DATA_DIR / "documents.json"

# Verified model identifiers from Phase 0 Step 3
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
GEMINI_MODEL = "gemini-3.5-flash-lite"

# Secret API key read from environment (empty string if missing)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


def require_gemini_api_key() -> str:
    """Return GEMINI_API_KEY or fail fast with a clear error if it is missing."""
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is missing. Add it to your .env file before running."
        )
    return GEMINI_API_KEY