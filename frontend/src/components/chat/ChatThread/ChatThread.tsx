import { useEffect, useRef } from "react";
import { WarningIcon } from "../../../icons";
import type { ChatMessage } from "../../../types/chat";
import MessageBubble from "../MessageBubble";
import "./ChatThread.css";

type ChatThreadProps = {
    messages: ChatMessage[];
    isSending: boolean;
    error: string | null;
};

export default function ChatThread({
    messages,
    isSending,
    error,
}: ChatThreadProps) {
    // An empty element at the very bottom of the thread, used as a scroll target
    const endRef = useRef<HTMLDivElement>(null);

    // Scroll to the newest content whenever the thread changes
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        endRef.current?.scrollIntoView({
            // Respect users who ask their OS for less motion
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "end",
        });
    }, [messages, isSending, error]);

    return (
        // role="log" tells screen readers this area receives new messages over
        // time, so they announce additions politely
        <div className="chat-thread" role="log" aria-label="Conversation">
            {messages.length === 0 ? (
                <div className="chat-thread__empty">
                    <p className="chat-thread__empty-title">Ask your documents</p>
                    <p>Answers come only from your uploads, with the sources listed.</p>
                </div>
            ) : (
                <ul className="chat-thread__list">
                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                    {isSending && (
                        <li className="chat-thread__pending">
                            <span className="chat-thread__dots" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </span>
                            <span>Searching your documents...</span>
                        </li>
                    )}
                </ul>
            )}

            {/* role="alert" makes screen readers announce the error when it appears */}
            {error !== null && (
                <p className="chat-thread__error" role="alert">
                    <WarningIcon />
                    <span>{error}</span>
                </p>
            )}

            <div ref={endRef} />
        </div>
    );
}