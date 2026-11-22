from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

import app.config as config
import app.storage.vector_store as vector_store
from app.errors import LLMServiceError, map_gemini_error

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
        blocks.append(f"[{idx}] Source: {filename} ({page_label})\n{chunk.page_content}")
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


def ask_question(
    question: str,
    top_k: int = DEFAULT_TOP_K,
    temperature: float = DEFAULT_TEMPERATURE,
) -> dict:
    """Run Tier 1 RAG: retrieve top-k chunks locally, then generate a grounded Gemini answer."""
    cleaned_question = question.strip()
    if not cleaned_question:
        raise ValueError("Question cannot be empty.")

    vs = vector_store.get_vector_store()
    total_chunks = vs._collection.count()
    if total_chunks == 0:
        return {"answer": FALLBACK_ANSWER, "citations": []}

    # Clamp k to available chunks so Chroma doesn't warn on small documents
    chunks = vs.similarity_search(cleaned_question, k=min(top_k, total_chunks))
    if not chunks:
        return {"answer": FALLBACK_ANSWER, "citations": []}

    context = format_context(chunks)
    messages = QA_PROMPT.format_messages(
        context=context,
        question=cleaned_question,
    )

    answer = _invoke_llm(messages, temperature=temperature)

    # Do not attach misleading citations if Gemini triggered the fallback
    is_fallback = FALLBACK_ANSWER.lower() in answer.lower()
    citations = [] if is_fallback else build_citations(chunks)

    return {
        "answer": answer,
        "citations": citations,
    }