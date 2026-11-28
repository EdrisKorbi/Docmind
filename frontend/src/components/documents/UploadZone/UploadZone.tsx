import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { getErrorMessage } from "../../../api/apiError";
import { UploadIcon } from "../../../icons";
import {
    ALLOWED_EXTENSIONS,
    FILE_INPUT_ACCEPT,
    MAX_UPLOAD_SIZE_MB,
    validateUploadFile,
} from "../../../utils/uploadValidation";
import "./UploadZone.css";

// The parent decides what "upload" means (it will call useDocuments().upload).
// Promise<unknown>: we only need to know when it finishes or fails.
type UploadZoneProps = {
    onUpload: (file: File) => Promise<unknown>;
};

export default function UploadZone({ onUpload }: UploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validates one file, uploads it, and reports any failure as text
    async function handleFile(file: File) {
        const validationError = validateUploadFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (uploadError) {
            setError(getErrorMessage(uploadError));
        } finally {
            // Runs on success AND failure, so the zone never stays locked
            setIsUploading(false);
        }
    }

    // Shared by the file picker and drag-and-drop
    function handleFiles(files: FileList | null) {
        if (isUploading || files === null || files.length === 0) {
            return;
        }
        if (files.length > 1) {
            setError("Upload one file at a time.");
            return;
        }
        const file = files.item(0);
        if (file !== null) {
            void handleFile(file);
        }
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        handleFiles(event.target.files);
        // Clear the input so choosing the same file again still triggers onChange
        event.target.value = "";
    }

    function handleDragOver(event: DragEvent<HTMLButtonElement>) {
        // Without preventDefault the browser would open the dropped file
        event.preventDefault();
        setIsDragging(true);
    }

    function handleDrop(event: DragEvent<HTMLButtonElement>) {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
    }

    function handleClick() {
        if (!isUploading) {
            inputRef.current?.click();
        }
    }

    const className = isDragging
        ? "upload-zone upload-zone--active"
        : "upload-zone";

    return (
        <div className="upload">
            <button
                type="button"
                className={className}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                // aria-disabled (not disabled): a disabled button would let the
                // browser open a file dropped on it
                aria-disabled={isUploading}
            >
                {isUploading ? (
                    <span className="upload-zone__spinner" aria-hidden="true" />
                ) : (
                    <UploadIcon />
                )}
                <span>
                    {isUploading
                        ? "Uploading and indexing..."
                        : "Drop a file here or click to browse"}
                </span>
                <span className="upload-zone__hint">
                    {ALLOWED_EXTENSIONS.join(" ")} up to {MAX_UPLOAD_SIZE_MB} MB
                </span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept={FILE_INPUT_ACCEPT}
                onChange={handleInputChange}
                hidden
            />

            {/* role="alert" makes screen readers announce the message when it appears */}
            {error !== null && (
                <p className="upload__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}