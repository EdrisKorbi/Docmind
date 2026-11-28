import type { DocumentRecord } from "../../../types/api";
import DocumentList from "../DocumentList";
import UploadZone from "../UploadZone";
import "./DocumentLibrary.css";

// Groups the upload zone and the list. It holds no state and calls no API:
// every value and action comes from App, which owns the hooks.
type DocumentLibraryProps = {
    documents: DocumentRecord[];
    isLoading: boolean;
    loadError: string | null;
    onRetry: () => Promise<void>;
    onUpload: (file: File) => Promise<unknown>;
    onDelete: (docId: string) => Promise<void>;
    onSummarize: (record: DocumentRecord) => Promise<void>;
};

export default function DocumentLibrary({
    documents,
    isLoading,
    loadError,
    onRetry,
    onUpload,
    onDelete,
    onSummarize,
}: DocumentLibraryProps) {
    return (
        <section className="document-library" aria-label="Documents">
            <UploadZone onUpload={onUpload} />
            {/* Only the list scrolls; the upload zone stays in view */}
            <div className="document-library__scroll">
                <DocumentList
                    documents={documents}
                    isLoading={isLoading}
                    loadError={loadError}
                    onRetry={onRetry}
                    onDelete={onDelete}
                    onSummarize={onSummarize}
                />
            </div>
        </section>
    );
}