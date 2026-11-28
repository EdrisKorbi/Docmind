import { FileIcon, WarningIcon } from "../../../icons";
import type { DocumentRecord } from "../../../types/api";
import DocumentItem from "../DocumentItem";
import "./DocumentList.css";

// Pure display component: all data and actions come from the parent
type DocumentListProps = {
    documents: DocumentRecord[];
    isLoading: boolean;
    loadError: string | null;
    onRetry: () => void;
    onDelete: (docId: string) => Promise<void>;
    onSummarize: (record: DocumentRecord) => Promise<void>;
};

// How many placeholder rows the loading skeleton shows
const SKELETON_ROWS = 3;

export default function DocumentList({
    documents,
    isLoading,
    loadError,
    onRetry,
    onDelete,
    onSummarize,
}: DocumentListProps) {
    // 1. First load: gray placeholder rows instead of a blank area
    if (isLoading && documents.length === 0) {
        return (
            <ul className="document-list" aria-busy="true" aria-label="Loading documents">
                {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    // The skeleton rows never reorder, so the index is a safe key here
                    <li key={index} className="document-list__skeleton" />
                ))}
            </ul>
        );
    }

    // 2. The list could not be loaded: show the reason and a way to retry
    if (loadError !== null) {
        return (
            <div className="document-list__state" role="alert">
                <WarningIcon />
                <p>{loadError}</p>
                <button
                    type="button"
                    className="document-list__retry"
                    onClick={onRetry}
                >
                    Retry
                </button>
            </div>
        );
    }

    // 3. Loaded, but nothing uploaded yet
    if (documents.length === 0) {
        return (
            <div className="document-list__state">
                <FileIcon />
                <p>No documents yet. Upload a file to get started.</p>
            </div>
        );
    }

    // 4. Normal case: one row per document
    return (
        <ul className="document-list">
            {documents.map((record) => (
                <DocumentItem
                    key={record.doc_id}
                    record={record}
                    onDelete={onDelete}
                    onSummarize={onSummarize}
                />))}
        </ul>
    );
}