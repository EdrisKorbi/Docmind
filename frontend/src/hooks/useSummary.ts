import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "../api/apiError";
import { summarizeDocument } from "../api/docmindApi";
import type { DocumentRecord, SummaryData } from "../types/api";

export function useSummary() {
    // The document being summarized; null means the modal is closed
    const [summaryTarget, setSummaryTarget] = useState<DocumentRecord | null>(
        null,
    );
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [summary, setSummary] = useState<SummaryData | null>(null);

    // Counts requests, so a late reply from a closed modal can be ignored
    const requestIdRef = useRef(0);

    // Summaries already received, keyed by doc_id. A repeat click reads from
    // here instead of calling Gemini again. Lives until the page is reloaded.
    const cacheRef = useRef<Map<string, SummaryData>>(new Map());

    // Runs ONLY from a click on Summarize (1 Gemini call)
    const openSummary = useCallback(
        async (record: DocumentRecord) => {
            // Guard against a double click sending a second request
            if (isSummarizing) {
                return;
            }
            requestIdRef.current += 1;
            const requestId = requestIdRef.current;

            // Cache hit: show the saved summary, no request, no Gemini call
            const cached = cacheRef.current.get(record.doc_id);
            if (cached !== undefined) {
                setSummaryTarget(record);
                setSummary(cached);
                setSummaryError(null);
                return;
            }
            setSummaryTarget(record);
            setSummary(null);
            setSummaryError(null);
            setIsSummarizing(true);
            try {
                const result = await summarizeDocument(record.doc_id);
                // Saved even if the modal was closed meanwhile: the call is already spent
                cacheRef.current.set(record.doc_id, result);
                if (requestId === requestIdRef.current) {
                    setSummary(result);
                }
            } catch (error) {
                if (requestId === requestIdRef.current) {
                    setSummaryError(getErrorMessage(error));
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsSummarizing(false);
                }
            }
        },
        [isSummarizing],
    );

    const closeSummary = useCallback(() => {
        // Invalidates any request still in flight
        requestIdRef.current += 1;
        setSummaryTarget(null);
        setSummary(null);
        setSummaryError(null);
        setIsSummarizing(false);
    }, []);

    return {
        summaryTarget,
        isSummarizing,
        summaryError,
        summary,
        openSummary,
        closeSummary,
    };
}