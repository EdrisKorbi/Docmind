from langchain_google_genai import ChatGoogleGenerativeAI
from app import config


def main() -> None:
    # Ensure GEMINI_API_KEY is present before calling the remote API
    api_key = config.require_gemini_api_key()

    # Initialize the LangChain chat model wrapper for Gemini Developer API
    llm = ChatGoogleGenerativeAI(
        model=config.GEMINI_MODEL,
        api_key=api_key,
        temperature=0.0,
    )

    # Send one short test prompt over HTTPS to Google's Gemini API
    print(f"Calling Gemini model: {config.GEMINI_MODEL}")
    response = llm.invoke(
        "Reply in one short sentence confirming you are reachable from LangChain."
    )

    # Extract plain text cleanly (handles both string and block-based responses in langchain-core 1.x)
    print("Response:", response.text)


if __name__ == "__main__":
    main()