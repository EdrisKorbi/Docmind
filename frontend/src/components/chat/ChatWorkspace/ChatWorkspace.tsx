import { useState } from "react";
import { useChat } from "../../../hooks/useChat";
import { ResetIcon } from "../../../icons";
import type { DocumentRecord } from "../../../types/api";
import ChatInput from "../ChatInput";
import ChatThread from "../ChatThread";
import ScopeSelector from "../ScopeSelector";
import "./ChatWorkspace.css";

type ChatWorkspaceProps = {
    documents: DocumentRecord[];
};

export default function ChatWorkspace({ documents }: ChatWorkspaceProps) {
    // Called once here; the three children below receive plain props
    const { messages, isSending, error, send, clear } = useChat();

    // What the user picked: a doc_id, or null for "All documents"
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    // What we actually send: the pick only counts while that document still exists.
    // Derived on every render, so a deleted document needs no reset logic.
    const activeDocId = documents.some((record) => record.doc_id === selectedDocId)
        ? selectedDocId
        : null;

    // Adds the scope to the question; this is the only call site of send()
    function handleSend(question: string): Promise<boolean> {
        return send(question, activeDocId);
    }

    // Nothing to clear, or a reply is loading
    const canClear = messages.length > 0 && !isSending;

    return (
        <section className="chat-workspace" aria-label="Chat">
            <header className="chat-workspace__header">
                <ScopeSelector
                    documents={documents}
                    value={activeDocId}
                    onChange={setSelectedDocId}
                />
                <button
                    type="button"
                    className="chat-workspace__clear"
                    onClick={() => void clear()}
                    disabled={!canClear}
                    aria-label="Clear chat"
                    title="Clear chat"
                >
                    <ResetIcon />
                </button>
            </header>

            <ChatThread messages={messages} isSending={isSending} error={error} />
            <ChatInput onSend={handleSend} isSending={isSending} />
        </section>
    );
}