from pathlib import Path

import app.config as config
import app.services.document_service as document_service
import app.services.rag_service as rag_service

SAMPLE_FILENAME = "sample_atlas_handbook.txt"
SAMPLE_CONTENT = """Atlas Rover X2 — Internal Technical Handbook

1. Hardware Overview
The Atlas Rover X2 is a compact autonomous warehouse robot released in 2026.
It operates on a 48-volt lithium-iron-phosphate battery pack that delivers 14 hours
of continuous runtime on a full charge.

2. Warranty and Support SLA
Every Atlas Rover X2 unit includes a 42-month standard hardware warranty covering
motors, lidar sensors, and onboard compute modules.
Priority enterprise support guarantees an initial engineering response within 3 hours.

3. Maintenance Schedule
Wheel encoders must be calibrated every 600 operating hours using diagnostic code 8841.
"""


def ensure_sample_file() -> Path:
    """Write a small non-sensitive test file inside data/ (git-ignored)."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    sample_path = config.DATA_DIR / SAMPLE_FILENAME
    if not sample_path.exists():
        sample_path.write_text(SAMPLE_CONTENT.strip(), encoding="utf-8")
    return sample_path


def print_result(label: str, question: str, result: dict) -> None:
    """Display a formatted Q&A result with its retrieved citations."""
    print(f"\n=== {label} ===")
    print(f"Q: {question}")
    print(f"A: {result['answer']}")
    print(f"Citations ({len(result['citations'])}):")
    for idx, cite in enumerate(result["citations"], start=1):
        print(
            f"  [{idx}] {cite['filename']} | page={cite['page']} "
            f"| chunk={cite['chunk_index']} | preview=\"{cite['preview']}\""
        )


def main() -> None:
    sample_path = ensure_sample_file()

    # Ingest once; on subsequent runs, reuse persisted Chroma vectors to prove persistence
    records = document_service.load_registry()
    already_indexed = any(
        r["filename"].lower() == SAMPLE_FILENAME.lower() for r in records
    )

    if already_indexed:
        print(f"'{SAMPLE_FILENAME}' is already indexed on disk — skipping ingestion.")
    else:
        record = document_service.ingest_document(sample_path, SAMPLE_FILENAME)
        print(
            f"Ingested '{record['filename']}' "
            f"(doc_id={record['doc_id']}, chunks={record['chunk_count']})"
        )

    # Test 1: In-scope factual question (must answer from retrieved chunks + attach citations)
    in_scope_q = "What is the warranty period and the diagnostic code for the Atlas Rover X2?"
    in_scope_res = rag_service.ask_question(in_scope_q)
    print_result("IN-SCOPE TEST", in_scope_q, in_scope_res)

    # Test 2: Out-of-scope question (must trigger strict fallback + return 0 citations)
    out_of_scope_q = "What is the CEO's favorite movie?"
    out_of_scope_res = rag_service.ask_question(out_of_scope_q)
    print_result("OUT-OF-SCOPE TEST", out_of_scope_q, out_of_scope_res)


if __name__ == "__main__":
    main()