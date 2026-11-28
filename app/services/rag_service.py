from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import logging

import app.config as config
import app.storage.vector_store as vector_store
from app.errors import LLMServiceError, map_gemini_error
from app.services import document_service
from app.storage import session_store

logger = logging.getLogger("docmind")

DEFAULT_TOP_K = 4
DEFAULT_TEMPERATURE = 0.0
FALLBACK_ANSWER = "I couldn't find that in your documents."

SYSTEM_PROMPT = """You are DocMind, a strict document question-answering assistant.
Answer the user's question using ONLY the provided document excerpts below.
Rules:
- Do not use outside knowledge or guess missing facts.
- If the provided excerpts do not contain the answer, reply with exactly:
  I couldn't find that in your documents.
- Reply in the same language as the user's question.
- Keep the answer clear, accurate, and concise.

Document excerpts:
{context}"""

QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ]
)


def get_llm(temperature: float = DEFAULT_TEMPERATURE) -> ChatGoogleGenerativeAI:
    """Create a Gemini chat client, validating GEMINI_API_KEY only on LLM paths."""
    try:
        api_key = config.require_gemini_api_key()
    except ValueError as exc:
        raise LLMServiceError(str(exc)) from exc

    return ChatGoogleGenerativeAI(
        model=config.GEMINI_MODEL,
        api_key=api_key,
        temperature=temperature,
    )


def _invoke_llm(messages: list, temperature: float = DEFAULT_TEMPERATURE) -> str:
    """Send formatted messages to Gemini and map known SDK errors to domain exceptions."""
    llm = get_llm(temperature=temperature)
    try:
        response = llm.invoke(messages)
    except Exception as exc:
        mapped = map_gemini_error(exc)
        if mapped is not None:
            raise mapped from exc
        raise
    return response.text.strip()


def format_context(chunks: list[Document]) -> str:
    """Format retrieved chunks with source labels for injection into the system prompt."""
    blocks: list[str] = []
    for idx, chunk in enumerate(chunks, start=1):
        filename = chunk.metadata.get("filename", "unknown")
        page = chunk.metadata.get("page", 0)
        page_label = f"page {page}" if page > 0 else "text file"
        blocks.append(
            f"[{idx}] Source: {filename} ({page_label})\n{chunk.page_content}"
        )
    return "\n\n---\n\n".join(blocks)


def build_citations(chunks: list[Document], preview_chars: int = 200) -> list[dict]:
    """Convert retrieved Document chunks into JSON-serializable citation objects."""
    citations: list[dict] = []
    for chunk in chunks:
        # Collapse line breaks/extra spaces so UI previews stay clean
        clean_text = " ".join(chunk.page_content.split())
        preview = (
            clean_text[:preview_chars] + "..."
            if len(clean_text) > preview_chars
            else clean_text
        )
        citations.append(
            {
                "doc_id": chunk.metadata.get("doc_id", ""),
                "filename": chunk.metadata.get("filename", "unknown"),
                "page": chunk.metadata.get("page", 0),
                "chunk_index": chunk.metadata.get("chunk_index", 0),
                "preview": preview,
            }
        )
    return citations


REWRITE_SYSTEM_PROMPT = (
    "Given the chat history and a follow-up user question, rewrite the follow-up "
    "into a clear, standalone search query. Resolve pronouns (it, its, they, that, etc.) "
    "using the chat history. Return ONLY the rewritten question, with no explanation "
    "or extra text. If the question is already standalone, return it unchanged."
)


def _rewrite_question(question: str, history: list[dict[str, str]]) -> str:
    """Rewrite a follow-up question into a standalone query using recent chat history."""
    if not history:
        return question

    formatted_history = "\n".join(
        f"{msg['role'].capitalize()}: {msg['content']}" for msg in history
    )
    messages = [
        ("system", REWRITE_SYSTEM_PROMPT),
        (
            "human",
            f"Chat History:\n{formatted_history}\n\nFollow-up Question: {question}",
        ),
    ]
    rewritten = _invoke_llm(messages, temperature=0.0)
    return rewritten or question


def ask_question(
    question: str,
    top_k: int = DEFAULT_TOP_K,
    temperature: float = DEFAULT_TEMPERATURE,
    doc_id: str | None = None,
    min_relevance_score: float | None = None,
    session_id: str | None = None,
) -> dict:
    """Retrieve top-k chunks locally, optionally rewrite follow-ups, and generate a grounded Gemini answer."""
    cleaned_question = question.strip()
    if not cleaned_question:
        raise ValueError("Question cannot be empty.")

    target_doc = document_service.get_document(doc_id) if doc_id is not None else None

    # 1. Rewrite follow-up questions using prior session turns (0 calls if history is empty)
    history = session_store.get_history(session_id) if session_id else []
    retrieval_query = _rewrite_question(cleaned_question, history)
    if retrieval_query != cleaned_question:
        logger.info("Rewrote follow-up '%s' -> '%s'", cleaned_question, retrieval_query)

    vs = vector_store.get_vector_store()

    total_chunks = vs._collection.count()
    if total_chunks == 0:
        if session_id:
            session_store.append_turn(session_id, cleaned_question, FALLBACK_ANSWER)
        return {"answer": FALLBACK_ANSWER, "citations": []}

    available_chunks = (
        min(total_chunks, target_doc["chunk_count"])
        if target_doc is not None
        else total_chunks
    )
    if available_chunks == 0:
        if session_id:
            session_store.append_turn(session_id, cleaned_question, FALLBACK_ANSWER)
        return {
            "answer": FALLBACK_ANSWER,
            "citations": [],
        }

    threshold = (
        config.MIN_RELEVANCE_SCORE
        if min_relevance_score is None
        else min_relevance_score
    )
    search_filter = {"doc_id": doc_id} if doc_id is not None else None

    # 2. Search Chroma with the standalone rewritten query
    scored_chunks = vs.similarity_search_with_relevance_scores(
        retrieval_query,
        k=min(top_k, available_chunks),
        filter=search_filter,
    )

    top_score = scored_chunks[0][1] if scored_chunks else 0.0
    chunks = [doc for doc, score in scored_chunks if score >= threshold]

    if not chunks:
        logger.info(
            "Skipping Gemini call: top score %.3f below threshold %.3f",
            top_score,
            threshold,
        )
        if session_id:
            session_store.append_turn(session_id, cleaned_question, FALLBACK_ANSWER)
        return {
            "answer": FALLBACK_ANSWER,
            "citations": [],
        }

    logger.info(
        "Retrieved %d/%d relevant chunk(s) (top score: %.3f, threshold: %.3f)",
        len(chunks),
        len(scored_chunks),
        top_score,
        threshold,
    )

    # 3. Generate grounded answer using the standalone query
    context = format_context(chunks)
    messages = QA_PROMPT.format_messages(
        context=context,
        question=retrieval_query,
    )

    answer = _invoke_llm(messages, temperature=temperature)

    # Do not attach misleading citations if Gemini triggered the fallback
    is_fallback = FALLBACK_ANSWER.lower() in answer.lower()
    citations = [] if is_fallback else build_citations(chunks)

    # 4. Save the user's original question + final answer to session history
    if session_id:
        session_store.append_turn(session_id, cleaned_question, answer)

    return {
        "answer": answer,
        "citations": citations,
    }


MAX_SUMMARY_CHUNKS = 20

SUMMARY_SYSTEM_PROMPT = (
    "You are DocMind, a precise document assistant. Summarize ONLY the provided "
    "document excerpts into a clear, well-structured overview with concise bullet points "
    "for key facts, numbers, and rules. Do not invent or assume outside information."
)


def summarize_document(
    doc_id: str,
    temperature: float = DEFAULT_TEMPERATURE,
) -> dict:
    """Generate a structured summary of a single uploaded document by doc_id."""
    record = document_service.get_document(doc_id)
    chunks = document_service.get_document_chunks(doc_id, max_chunks=MAX_SUMMARY_CHUNKS)

    if not chunks:
        return {
            "doc_id": record["doc_id"],
            "filename": record["filename"],
            "summary": FALLBACK_ANSWER,
            "chunks_used": 0,
            "total_chunks": record["chunk_count"],
        }

    joined_text = "\n\n---\n\n".join(
        f"[Excerpt {i + 1}]\n{text}" for i, text in enumerate(chunks)
    )
    messages = [
        ("system", SUMMARY_SYSTEM_PROMPT),
        (
            "human",
            f"Document: {record['filename']}\n\nExcerpts:\n{joined_text}\n\n"
            "Provide a clear, concise summary of this document.",
        ),
    ]

    summary = _invoke_llm(messages, temperature=temperature)
    logger.info(
        "Generated summary for '%s' using %d/%d chunk(s)",
        record["filename"],
        len(chunks),
        record["chunk_count"],
    )

    return {
        "doc_id": record["doc_id"],
        "filename": record["filename"],
        "summary": summary,
        "chunks_used": len(chunks),
        "total_chunks": record["chunk_count"],
    }
