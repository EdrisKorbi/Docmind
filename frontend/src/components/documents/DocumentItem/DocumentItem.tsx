import { useState } from "react";
import { getErrorMessage } from "../../../api/apiError";
import { FileIcon, SummarizeIcon, TrashIcon } from "../../../icons";
import type { DocumentRecord } from "../../../types/api";
import "./DocumentItem.css";

// The parent decides what "delete" means (it will call useDocuments().remove).
// The row only handles the confirmation step and the feedback.
type DocumentItemProps = {
    record: DocumentRecord;
    onDelete: (docId: string) => Promise<void>;
    onSummarize: (record: DocumentRecord) => Promise<void>;
};

export default function DocumentItem({
    record,
    onDelete,
    onSummarize,
}: DocumentItemProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirmDelete() {
        setIsDeleting(true);
        setError(null);
        try {
            await onDelete(record.doc_id);
            // On success the parent removes this row, so there is no state to reset
        } catch (deleteError) {
            setError(getErrorMessage(deleteError));
            setIsDeleting(false);
            setIsConfirming(false);
        }
    }

    const chunkLabel = `${record.chunk_count} ${record.chunk_count === 1 ? "chunk" : "chunks"
        }`;

    return (
        <li className="document-item">
            <div className="document-item__row">
                <FileIcon />
                <div className="document-item__info">
                    <span className="document-item__name" title={record.filename}>
                        {record.filename}
                    </span>
                    <span className="document-item__meta">{chunkLabel}</span>
                </div>

                {isConfirming ? (
                    <div className="document-item__confirm">
                        <button
                            type="button"
                            className="document-item__button document-item__button--danger"
                            onClick={() => void handleConfirmDelete()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                        <button
                            type="button"
                            className="document-item__button"
                            onClick={() => setIsConfirming(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="document-item__actions">
                        <button
                            type="button"
                            className="document-item__icon-button"
                            onClick={() => void onSummarize(record)}
                            aria-label={`Summarize ${record.filename}`}
                            title="Summarize"
                        >
                            <SummarizeIcon />
                        </button>
                        <button
                            type="button"
                            className="document-item__icon-button"
                            onClick={() => setIsConfirming(true)}
                            aria-label={`Delete ${record.filename}`}
                            title="Delete"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>

            {/* role="alert" makes screen readers announce the message when it appears */}
            {error !== null && (
                <p className="document-item__error" role="alert">
                    {error}
                </p>
            )}
        </li>
    );
}