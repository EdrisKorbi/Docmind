import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/apiError";
import { askQuestion, clearSession } from "../api/docmindApi";
import type { ChatMessage } from "../types/chat";
import { getSessionId } from "../utils/sessionId";

// The thread is saved per tab, so a reload keeps what the user sees in sync
// with the backend's memory for the same session_id
const MESSAGES_KEY = "docmind-chat-messages";

// Runtime check for data read back from storage (it could be edited or stale)
function isChatMessage(value: unknown): value is ChatMessage {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.content !== "string") {
        return false;
    }
    if (candidate.role === "user") {
        return true;
    }
    return candidate.role === "assistant" && Array.isArray(candidate.citations);
}

function loadMessages(): ChatMessage[] {
    try {
        const raw = sessionStorage.getItem(MESSAGES_KEY);
        if (raw === null) {
            return [];
        }
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        const items: unknown[] = parsed;
        return items.filter(isChatMessage);
    } catch {
        // Blocked storage or invalid JSON: start with an empty thread
        return [];
    }
}

function saveMessages(messages: ChatMessage[]): void {
    try {
        if (messages.length === 0) {
            sessionStorage.removeItem(MESSAGES_KEY);
        } else {
            sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        }
    } catch {
        // Ignore: the chat still works, it just won't survive a reload
    }
}

export function useChat() {
    // Passing the function (not its result) runs each initializer once
    const [sessionId] = useState(getSessionId);
    const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
    const [isSending, setIsSending] = useState(false);
    // One message for the last failed send OR failed clear; null means no error
    const [error, setError] = useState<string | null>(null);

    // Keep the saved thread in step with the screen
    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    // Runs ONLY when a component calls it (up to 2 Gemini calls).
    // Returns true on success, so the caller knows whether to clear its input.
    const send = useCallback(
        async (question: string, docId: string | null): Promise<boolean> => {
            if (isSending) {
                return false;
            }
            const userMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: question,
            };
            // Show the question immediately, before the answer arrives
            setMessages((previous) => [...previous, userMessage]);
            setError(null);
            setIsSending(true);
            try {
                const data = await askQuestion({
                    question,
                    session_id: sessionId,
                    doc_id: docId,
                });
                setMessages((previous) => [
                    ...previous,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: data.answer,
                        citations: data.citations,
                    },
                ]);
                return true;
            } catch (sendError) {
                // The backend saves a turn only after a successful answer, so remove
                // the question to keep the screen and the backend memory identical
                setMessages((previous) =>
                    previous.filter((message) => message.id !== userMessage.id),
                );
                setError(getErrorMessage(sendError));
                return false;
            } finally {
                setIsSending(false);
            }
        },
        [isSending, sessionId],
    );

    // Clears the backend memory first, then the screen (0 Gemini calls).
    // If the backend fails, the thread stays, so both sides still match.
    const clear = useCallback(async () => {
        if (isSending) {
            return;
        }
        setError(null);
        try {
            await clearSession(sessionId);
            setMessages([]);
        } catch (clearError) {
            setError(getErrorMessage(clearError));
        }
    }, [isSending, sessionId]);

    return { messages, isSending, error, send, clear };
}