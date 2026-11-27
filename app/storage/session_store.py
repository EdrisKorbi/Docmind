from threading import Lock

MAX_HISTORY_TURNS = 6  # Keep last 6 user/assistant pairs (12 messages)

_sessions: dict[str, list[dict[str, str]]] = {}
_lock = Lock()


def get_history(session_id: str) -> list[dict[str, str]]:
    """Return a shallow copy of stored messages for session_id."""
    with _lock:
        return list(_sessions.get(session_id, []))


def append_turn(session_id: str, question: str, answer: str) -> None:
    """Append one user/assistant exchange and trim to MAX_HISTORY_TURNS."""
    with _lock:
        history = _sessions.setdefault(session_id, [])
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": answer})
        max_messages = MAX_HISTORY_TURNS * 2
        if len(history) > max_messages:
            del history[:-max_messages]


def clear_session(session_id: str) -> bool:
    """Delete stored history for session_id. Returns True if it existed."""
    with _lock:
        return _sessions.pop(session_id, None) is not None