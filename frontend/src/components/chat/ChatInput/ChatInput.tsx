import { useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { SendIcon } from "../../../icons";
import "./ChatInput.css";

// Mirrors the backend rule: AskRequest.question max_length is 2000
const MAX_QUESTION_LENGTH = 2000;

// The parent decides what "send" means (it will call useChat().send).
// It resolves to true on success, so we know whether to clear the box.
type ChatInputProps = {
    onSend: (question: string) => Promise<boolean>;
    isSending: boolean;
};

export default function ChatInput({ onSend, isSending }: ChatInputProps) {
    const [draft, setDraft] = useState("");

    // The backend strips whitespace and rejects blank questions, so we do too
    const question = draft.trim();
    const canSend = question !== "" && !isSending;

    async function submit() {
        if (!canSend) {
            return;
        }
        const didSend = await onSend(question);
        // On failure the text stays in the box, so the user can send it again
        if (didSend) {
            setDraft("");
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        // Without preventDefault the browser would reload the page
        event.preventDefault();
        void submit();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        // isComposing: Enter confirms a character in an input method (IME), not a send
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            void submit();
        }
    }

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setDraft(event.target.value);
    }

    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
                className="chat-input__field"
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents"
                aria-label="Your question"
                rows={1}
                maxLength={MAX_QUESTION_LENGTH}
                // readOnly (not disabled) keeps the text visible and the focus in place
                readOnly={isSending}
            />
            <button
                type="submit"
                className="chat-input__send"
                disabled={!canSend}
                aria-label="Send question"
                title="Send"
            >
                <SendIcon />
            </button>
        </form>
    );
}