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
    // Bumped by Retry to run the load effect again
    const [reloadKey, setReloadKey] = useState(0);

    // Loads the list (GET /api/documents, no Gemini call) on mount and on Retry
    useEffect(() => {
        // `reloadKey` is only a trigger; reading it makes the effect depend on it
        void reloadKey;
        // Set by the cleanup below, so a reply that arrives late is ignored
        let ignore = false;

        async function fetchList() {
            try {
                const list = await getDocuments();
                if (!ignore) {
                    setDocuments(list);
                }
            } catch (error) {
                if (!ignore) {
                    setLoadError(getErrorMessage(error));
                }
            } finally {
                // Runs on success AND failure, so the loading state never gets stuck
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void fetchList();
        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    // Used by the Retry button: show the loading state, then re-run the effect
    const reload = useCallback(() => {
        setIsLoading(true);
        setLoadError(null);
        setReloadKey((previous) => previous + 1);
    }, []);

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