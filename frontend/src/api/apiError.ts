// One error type for every API failure, so the UI only needs to catch ApiError.
// status = HTTP status code, or 0 when there was no HTTP error status
// (server unreachable, or a successful reply with no data).
export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// Turns anything thrown by an API call into text that is safe to show the user.
// `catch` variables are `unknown` in strict TypeScript, so we must check the type.
export function getErrorMessage(error: unknown): string {
    // Our own errors already carry a user-ready message from the backend envelope
    if (error instanceof ApiError) {
        return error.message;
    }
    // Anything else is a bug, so hide the technical text from the user
    return "Something went wrong. Please try again.";
}