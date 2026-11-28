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