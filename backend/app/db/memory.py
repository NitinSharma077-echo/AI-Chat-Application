from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure
from app.core.config import MONGODB_URI, DB_NAME

# ── Client (thread-safe, reused across requests) ──────────
_client     = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
_db         = _client[DB_NAME]
_sessions   = _db["chat_sessions"]

# ── Index: fast lookup by session_id ─────────────────────
_sessions.create_index([("session_id", ASCENDING)], unique=True, background=True)


def get_history(session_id: str) -> list:
    """Return the message list for a session, or [] if not found."""
    doc = _sessions.find_one({"session_id": session_id}, {"history": 1})
    return doc["history"] if doc else []


def update_history(session_id: str, role: str, content: str) -> None:
    """Append a message to the session, creating the document if needed."""
    now = datetime.now(timezone.utc)
    _sessions.update_one(
        {"session_id": session_id},
        {
            "$push": {
                "history": {"role": role, "content": content}
            },
            "$set":         {"updated_at": now},
            "$setOnInsert": {"created_at": now, "session_id": session_id},
        },
        upsert=True,
    )


def delete_session(session_id: str) -> None:
    """Remove all history for a session."""
    _sessions.delete_one({"session_id": session_id})


def ping() -> bool:
    """Return True if MongoDB is reachable."""
    try:
        _client.admin.command("ping")
        return True
    except ConnectionFailure:
        return False
