import type { ChatMessage } from "../../../types/chat";
import MarkdownText from "../../common/MarkdownText";
import CitationList from "../CitationList";
import "./MessageBubble.css";

type MessageBubbleProps = {
    message: ChatMessage;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
    // User messages: plain text only. We never render the user's own text as
    // Markdown, so what they typed is exactly what they see.
    if (message.role === "user") {
        return (
            <li className="message message--user">
                <span className="message__author">You</span>
                <p className="message__text">{message.content}</p>
            </li>
        );
    }

    // Past the check above, TypeScript knows this is an assistant message,
    // so `citations` is available
    return (
        <li className="message message--assistant">
            <span className="message__author">DocMind</span>
            <MarkdownText text={message.content} />
            <CitationList citations={message.citations} />
        </li>
    );
}