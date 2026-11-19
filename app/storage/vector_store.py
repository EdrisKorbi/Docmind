from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from app import config

# Name of the Chroma collection (analogous to a SQL table or MongoDB collection)
COLLECTION_NAME = "docmind_chunks"

# Module-level cache so the embedding model and Chroma client initialize only once
_embeddings: HuggingFaceEmbeddings | None = None
_vector_store: Chroma | None = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Return a cached local Hugging Face embedding model instance."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def get_vector_store() -> Chroma:
    """Return a cached, disk-persisted Chroma vector store instance."""
    global _vector_store
    if _vector_store is None:
        # Ensure data/chroma_db/ exists on disk before Chroma initializes
        config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)

        _vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=get_embeddings(),
            persist_directory=str(config.CHROMA_DIR),
            collection_metadata={"hnsw:space": "cosine"},
        )
    return _vector_store