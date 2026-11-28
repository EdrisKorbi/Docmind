import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/apiError";
import {
    deleteDocument,
    getDocuments,
    uploadDocument,
} from "../api/docmindApi";
import type { DocumentRecord } from "../types/api";

export function useDocuments() {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    // True while the list is loading (starts true: the first load runs on mount)
    const [isLoading, setIsLoading] = useState(true);
    // Message for a failed LIST load only; upload/delete errors go to the caller
    const [loadError, setLoadError] = useState<string | null>(null);

    // Fetches the list from the backend (GET /api/documents, no Gemini call)
    const reload = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            setDocuments(await getDocuments());
        } catch (error) {
            setLoadError(getErrorMessage(error));
        } finally {
            // Runs on success AND failure, so the loading state never gets stuck
            setIsLoading(false);
        }
    }, []);

    // Load the list once when the hook first mounts
    useEffect(() => {
        void reload();
    }, [reload]);

    // Uploads one file, then adds the returned record to the list.
    // Errors are NOT caught here: the component shows them to the user.
    const upload = useCallback(async (file: File) => {
        const record = await uploadDocument(file);
        setDocuments((previous) => [...previous, record]);
        return record;
    }, []);

    // Deletes on the backend first, then removes it from the list.
    // If the backend fails, the list stays unchanged and the error propagates.
    const remove = useCallback(async (docId: string) => {
        await deleteDocument(docId);
        setDocuments((previous) =>
            previous.filter((document) => document.doc_id !== docId),
        );
    }, []);

    return { documents, isLoading, loadError, reload, upload, remove };
}