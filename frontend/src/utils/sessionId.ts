// Key under which this tab remembers its chat session id
const STORAGE_KEY = "docmind-session-id";

// Returns this tab's session id, creating and saving one on first use.
// Backend limit: session_id max_length is 100; a UUID is 36 characters.
export function getSessionId(): string {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored !== null && stored !== "") {
            return stored;
        }
    } catch {
        // Storage can be blocked by browser settings; fall through and create one
    }

    const created = crypto.randomUUID();
    try {
        sessionStorage.setItem(STORAGE_KEY, created);
    } catch {
        // Not saved: the id still works for this page load, just not after a reload
    }
    return created;
}