import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { CloseIcon, WarningIcon } from "../../../icons";
import MarkdownText from "../../common/MarkdownText";

import type { SummaryData } from "../../../types/api";
import "./SummaryModal.css";

// Display-only: the parent owns the request and passes the result down.
// The parent renders this component only while the modal should be open.
type SummaryModalProps = {
    filename: string;
    isLoading: boolean;
    error: string | null;
    summary: SummaryData | null;
    onClose: () => void;
};

export default function SummaryModal({
    filename,
    isLoading,
    error,
    summary,
    onClose,
}: SummaryModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Open as a modal when this component first appears
    useEffect(() => {
        const dialog = dialogRef.current;
        // The guard keeps React StrictMode (effects run twice in dev) from reopening it
        if (dialog !== null && !dialog.open) {
            dialog.showModal();
            // Focus the dialog itself so no button shows a focus ring on open
            dialog.focus();
        }
    }, []);

    // The dialog has no padding, so a click whose target is the dialog itself
    // landed on the dimmed backdrop, not on the content
    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="summary-modal"
            aria-labelledby="summary-modal-title"
            // -1 = focusable by code (dialog.focus() above) but not a Tab stop
            tabIndex={-1}
            // Fires when the browser closes the dialog itself (Escape key)
            onClose={onClose}
            onClick={handleDialogClick}
        >
            <div className="summary-modal__content">
                <header className="summary-modal__header">
                    <div className="summary-modal__titles">
                        <h2 id="summary-modal-title" className="summary-modal__title">
                            Summary
                        </h2>
                        <span className="summary-modal__filename" title={filename}>
                            {filename}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="summary-modal__close"
                        onClick={onClose}
                        aria-label="Close summary"
                        title="Close"
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div className="summary-modal__body">
                    {isLoading && (
                        <div className="summary-modal__state" aria-live="polite">
                            <span className="summary-modal__spinner" aria-hidden="true" />
                            <p>Generating summary...</p>
                        </div>
                    )}

                    {error !== null && (
                        <div className="summary-modal__state summary-modal__state--error" role="alert">
                            <WarningIcon />
                            <p>{error}</p>
                        </div>
                    )}

                    {summary !== null && (
                        <>
                            <MarkdownText text={summary.summary} />
                            <p className="summary-modal__meta">
                                Based on {summary.chunks_used} of {summary.total_chunks}{" "}
                                {summary.total_chunks === 1 ? "chunk" : "chunks"}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </dialog>
    );
}