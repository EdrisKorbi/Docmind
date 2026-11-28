import type {
    AskData,
    AskRequest,
    DocumentRecord,
    SummaryData,
} from "../types/api";
import { request, requireData } from "./httpClient";

// One function per backend route. Components import ONLY from this file.

// GET /api/documents
export async function getDocuments(): Promise<DocumentRecord[]> {
    return requireData(await request<DocumentRecord[]>("/documents"));
}

// POST /api/documents/upload (multipart/form-data, field name "file")
export async function uploadDocument(file: File): Promise<DocumentRecord> {
    const formData = new FormData();
    formData.append("file", file);
    // Do NOT set Content-Type: the browser adds it with the multipart boundary
    return requireData(
        await request<DocumentRecord>("/documents/upload", {
            method: "POST",
            body: formData,
        }),
    );
}

// DELETE /api/documents/{doc_id} (data is null by design)
export async function deleteDocument(docId: string): Promise<void> {
    await request<null>(`/documents/${encodeURIComponent(docId)}`, {
        method: "DELETE",
    });
}

// POST /api/documents/{doc_id}/summarize (empty body; uses 1 Gemini call)
export async function summarizeDocument(docId: string): Promise<SummaryData> {
    return requireData(
        await request<SummaryData>(
            `/documents/${encodeURIComponent(docId)}/summarize`,
            { method: "POST" },
        ),
    );
}

// POST /api/ask (uses up to 2 Gemini calls)
export async function askQuestion(payload: AskRequest): Promise<AskData> {
    return requireData(
        await request<AskData>("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
    );
}

// DELETE /api/sessions/{session_id} (clears conversation memory)
export async function clearSession(sessionId: string): Promise<void> {
    await request<null>(`/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
    });
}