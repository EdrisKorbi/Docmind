import type { ApiResponse } from "../types/api";
import { ApiError } from "./apiError";

// Read once from frontend/.env.development (typed in vite-env.d.ts)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Runtime check that a parsed JSON body really has the { success, data, message } shape
function isApiResponse(value: unknown): value is ApiResponse<unknown> {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.success === "boolean" &&
        typeof candidate.message === "string" &&
        "data" in candidate
    );
}

// Parses the reply body as JSON, or returns null if it is empty or not JSON
async function readJsonBody(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        // Expected for empty bodies and non-JSON replies (e.g. a proxy error page)
        return null;
    }
}

// Sends one HTTP request and returns the validated envelope.
// Throws ApiError on: network failure, non-JSON reply, HTTP error, or success:false.
export async function request<T>(
    path: string,
    init?: RequestInit,
): Promise<ApiResponse<T>> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, init);
    } catch {
        throw new ApiError(
            "Cannot reach the DocMind server. Check that the backend is running.",
            0,
        );
    }

    const body = await readJsonBody(response);

    if (!isApiResponse(body)) {
        throw new ApiError(
            `Unexpected response from the server (HTTP ${response.status}).`,
            response.status,
        );
    }

    // Your backend wraps errors in the same envelope, so body.message is user-ready
    if (!response.ok || !body.success) {
        throw new ApiError(body.message, response.status);
    }

    // Shape was validated above; T is the caller's promise about `data`
    return body as ApiResponse<T>;
}

// For endpoints that must return data: turns `T | null` into `T`
export function requireData<T>(response: ApiResponse<T>): T {
    if (response.data === null) {
        throw new ApiError("The server returned no data.", 0);
    }
    return response.data;
}