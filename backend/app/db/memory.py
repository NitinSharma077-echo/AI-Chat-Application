from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
from app.core.config import MONGODB_URI, DB_NAME

# ── Client (thread-safe, reused across requests) ──────────────────
_client   = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
_db       = _client[DB_NAME]
_users    = _db["users"]
_sessions = _db["chat_sessions"]
_projects = _db["projects"]

# ── Indexes ───────────────────────────────────────────────────────
_users.create_index([("email", ASCENDING)],      unique=True, background=True)
_sessions.create_index([("session_id", ASCENDING)], unique=True, background=True)
_sessions.create_index([("user_id", ASCENDING)], background=True)
_projects.create_index([("project_id", ASCENDING)], unique=True, background=True)
_projects.create_index([("user_id", ASCENDING)], background=True)


# ══════════════════════════════════════════════════════════════════
#  USERS
# ══════════════════════════════════════════════════════════════════

def create_user(email: str, username: str, password_hash: str) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "email":         email.lower().strip(),
        "username":      username.strip(),
        "password_hash": password_hash,
        "created_at":    now,
    }
    result = _users.insert_one(doc)
    return {"id": str(result.inserted_id), "email": doc["email"], "username": doc["username"]}


def get_user_by_email(email: str) -> dict | None:
    return _users.find_one({"email": email.lower().strip()})


def get_user_by_id(user_id: str) -> dict | None:
    try:
        return _users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════
#  SESSIONS (metadata + messages in one document)
# ══════════════════════════════════════════════════════════════════

def get_user_sessions(user_id: str) -> list:
    """Return session metadata (no messages) sorted by last update."""
    docs = _sessions.find(
        {"user_id": user_id},
        {"_id": 0, "session_id": 1, "title": 1, "project_id": 1,
         "created_at": 1, "updated_at": 1},
    ).sort("updated_at", DESCENDING)
    return list(docs)


def create_session(session_id: str, user_id: str,
                   title: str = "New Chat",
                   project_id: str | None = None) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "session_id": session_id,
        "user_id":    user_id,
        "title":      title,
        "project_id": project_id,
        "messages":   [],
        "created_at": now,
        "updated_at": now,
    }
    _sessions.update_one(
        {"session_id": session_id},
        {"$setOnInsert": doc},
        upsert=True,
    )
    return {"session_id": session_id, "title": title, "project_id": project_id}


def rename_session(session_id: str, user_id: str, title: str) -> bool:
    result = _sessions.update_one(
        {"session_id": session_id, "user_id": user_id},
        {"$set": {"title": title, "updated_at": datetime.now(timezone.utc)}},
    )
    return result.modified_count > 0


def delete_session(session_id: str, user_id: str) -> bool:
    result = _sessions.delete_one({"session_id": session_id, "user_id": user_id})
    return result.deleted_count > 0


def get_messages(session_id: str, user_id: str) -> list:
    doc = _sessions.find_one(
        {"session_id": session_id, "user_id": user_id},
        {"_id": 0, "messages": 1},
    )
    return doc["messages"] if doc else []


# ══════════════════════════════════════════════════════════════════
#  CHAT HISTORY  (called by ai_service)
# ══════════════════════════════════════════════════════════════════

def get_history(session_id: str) -> list:
    doc = _sessions.find_one({"session_id": session_id}, {"messages": 1})
    return doc["messages"] if doc else []


def update_history(session_id: str, role: str, content: str,
                   user_id: str | None = None) -> None:
    """Append a message. Creates the session document if it doesn't exist yet."""
    now = datetime.now(timezone.utc)
    set_on_insert = {
        "created_at": now,
        "session_id": session_id,
        "title":      "New Chat",
        "project_id": None,
    }
    if user_id:
        set_on_insert["user_id"] = user_id

    _sessions.update_one(
        {"session_id": session_id},
        {
            "$push":        {"messages": {"role": role, "content": content}},
            "$set":         {"updated_at": now},
            "$setOnInsert": set_on_insert,
        },
        upsert=True,
    )


# ══════════════════════════════════════════════════════════════════
#  PROJECTS
# ══════════════════════════════════════════════════════════════════

def get_user_projects(user_id: str) -> list:
    docs = _projects.find(
        {"user_id": user_id},
        {"_id": 0},
    ).sort("created_at", ASCENDING)
    return list(docs)


def create_project(project_id: str, user_id: str,
                   name: str, color: str,
                   shared_context: str = "") -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "project_id":     project_id,
        "user_id":        user_id,
        "name":           name,
        "color":          color,
        "shared_context": shared_context,
        "collapsed":      False,
        "created_at":     now,
        "updated_at":     now,
    }
    _projects.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


def update_project(project_id: str, user_id: str, **kwargs) -> bool:
    kwargs["updated_at"] = datetime.now(timezone.utc)
    result = _projects.update_one(
        {"project_id": project_id, "user_id": user_id},
        {"$set": kwargs},
    )
    return result.modified_count > 0


def delete_project(project_id: str, user_id: str) -> bool:
    _projects.delete_one({"project_id": project_id, "user_id": user_id})
    # Cascade: delete all sessions that belonged to this project
    _sessions.delete_many({"project_id": project_id, "user_id": user_id})
    return True


# ══════════════════════════════════════════════════════════════════
#  HEALTH
# ══════════════════════════════════════════════════════════════════

def ping() -> bool:
    try:
        _client.admin.command("ping")
        return True
    except ConnectionFailure:
        return False
