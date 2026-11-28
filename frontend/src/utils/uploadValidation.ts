// Mirrors the backend rules (document_service.py + config.py).
// The backend is the real check; this gives instant feedback before uploading.
export const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"] as const;
export const MAX_UPLOAD_SIZE_MB = 10;

const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

// Value for <input type="file" accept="...">: filters the file picker dialog
export const FILE_INPUT_ACCEPT = ALLOWED_EXTENSIONS.join(",");

// Returns the lowercase extension with the dot (".pdf"), or "" if there is none
function getExtension(filename: string): string {
    const dotIndex = filename.lastIndexOf(".");
    return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

// Returns an error message for the user, or null when the file is acceptable
export function validateUploadFile(file: File): string | null {
    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.some((allowed) => allowed === extension)) {
        return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
    }
    if (file.size === 0) {
        return "The file is empty.";
    }
    // Same rule as the backend: only files OVER the limit are rejected
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return `The file exceeds the ${MAX_UPLOAD_SIZE_MB} MB upload limit.`;
    }
    return null;
}