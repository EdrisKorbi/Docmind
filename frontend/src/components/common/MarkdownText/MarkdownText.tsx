import ReactMarkdown from "react-markdown";
import "./MarkdownText.css";

// Renders LLM text (bold, bullet lists, inline code) as formatted content.
type MarkdownTextProps = {
    text: string;
};

export default function MarkdownText({ text }: MarkdownTextProps) {
    return (
        // react-markdown has no className prop, so the wrapper carries our styles
        <div className="markdown-text">
            {/* Model output is untrusted: links and images are never rendered.
          unwrapDisallowed keeps their text instead of deleting it. */}
            <ReactMarkdown disallowedElements={["a", "img"]} unwrapDisallowed>
                {text}
            </ReactMarkdown>
        </div>
    );
}