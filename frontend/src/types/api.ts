// Envelope returned by EVERY backend route: { success, data, message }
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    message: string;
}

// GET /api/documents (array) and POST /api/documents/upload (single item)
export interface DocumentRecord {
    doc_id: string;
    filename: string;
    chunk_count: number;
    uploaded_at: string;
}

// POST /api/documents/{doc_id}/summarize
export interface SummaryData {
    doc_id: string;
    filename: string;
    summary: string;
    chunks_used: number;
    total_chunks: number;
}

// One source chunk used to build an answer
export interface Citation {
    doc_id: string;
    filename: string;
    page: number;
    chunk_index: number;
    preview: string;
}

// POST /api/ask request body
export interface AskRequest {
    question: string;
    session_id?: string | null;
    doc_id?: string | null;
}

// POST /api/ask response data
export interface AskData {
    answer: string;
    citations: Citation[];
}