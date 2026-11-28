import type { Citation } from "./api";

// One message in the thread. `role` decides which fields exist, so TypeScript
// only allows `citations` on assistant messages (a "discriminated union").
export type ChatMessage =
    | { id: string; role: "user"; content: string }
    | {
        id: string;
        role: "assistant";
        content: string;
        citations: Citation[];
    };