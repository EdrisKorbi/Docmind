from langchain_huggingface import HuggingFaceEmbeddings
from app import config


def main() -> None:
    # Load the local Sentence Transformers model (downloads once to ~/.cache/huggingface/hub)
    print(f"Loading local embedding model: {config.EMBEDDING_MODEL}")
    embeddings = HuggingFaceEmbeddings(
        model_name=config.EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    # Embed a single sentence locally into a dense float vector
    sample_text = "DocMind indexes local documents without calling external APIs."
    vector = embeddings.embed_query(sample_text)

    # Inspect vector dimensionality and a short slice of raw values
    print(f"Vector dimensions: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")


if __name__ == "__main__":
    main()