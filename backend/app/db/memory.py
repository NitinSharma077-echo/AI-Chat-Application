from datetime import datetime, timezone
from pymongo import MongoClient, DESCENDING, ASCENDING
from pymongo.errors import ConnectionFailure
from app.core.config import MONGODB_URI, DB_NAME

_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
_db     = _client[DB_NAME]

_users_col    = _db["users"]
_sessions_col = _db["sessions"]
_projects_col = _db["projects"]

# Indexes (idempotent — safe to run on every startup)
_users_col.create_index("email", unique=True)
_sessions_col.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])
_projects_col.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])


def ping() -> bool:
    try:
        _client.admin.command("ping")
        return True
    except Exception:
        return False


def close():
    _client.close()


# ══════════════════════════════════════════════════════════════════
#  USERS
# ══════════════════════════════════════════════════════════════════

def create_user(email: str, username: str, password_hash: str) -> dict:
    from uuid import uuid4
    user_id = str(uuid4())
    doc = {
        "_id":           user_id,
        "email":         email.lower().strip(),
        "username":      username.strip(),
        "password_hash": password_hash,
        "created_at":    datetime.now(timezone.utc),
    }
    _users_col.insert_one(doc)
    return {"id": user_id, "email": doc["email"], "username": doc["username"]}


def get_user_by_email(email: str) -> dict | None:
    return _users_col.find_one({"email": email.lower().strip()})


def get_user_by_id(user_id: str) -> dict | None:
    return _users_col.find_one({"_id": user_id})


# ══════════════════════════════════════════════════════════════════
#  SESSIONS
# ══════════════════════════════════════════════════════════════════

def get_user_sessions(user_id: str) -> list:
    cursor = _sessions_col.find(
        {"user_id": user_id},
        {"messages": 0},  # omit messages for the list view
    ).sort("updated_at", DESCENDING)
    return list(cursor)


def create_session(session_id: str, user_id: str,
                   title: str = "New Chat",
                   project_id: str | None = None) -> dict:
    now = datetime.now(timezone.utc)
    _sessions_col.update_one(
        {"session_id": session_id},
        {"$setOnInsert": {
            "session_id": session_id,
            "user_id":    user_id,
            "title":      title,
            "project_id": project_id,
            "messages":   [],
            "created_at": now,
            "updated_at": now,
        }},
        upsert=True,
    )
    return {"session_id": session_id, "title": title, "project_id": project_id}


def rename_session(session_id: str, user_id: str, title: str) -> bool:
    result = _sessions_col.update_one(
        {"session_id": session_id, "user_id": user_id},
        {"$set": {"title": title, "updated_at": datetime.now(timezone.utc)}},
    )
    return result.matched_count > 0


def delete_session(session_id: str, user_id: str) -> bool:
    result = _sessions_col.delete_one({"session_id": session_id, "user_id": user_id})
    return result.deleted_count > 0


def get_messages(session_id: str, user_id: str) -> list:
    doc = _sessions_col.find_one(
        {"session_id": session_id, "user_id": user_id},
        {"messages": 1},
    )
    return doc["messages"] if doc else []


# ══════════════════════════════════════════════════════════════════
#  CHAT HISTORY  (called by ai_service)
# ══════════════════════════════════════════════════════════════════

def get_history(session_id: str) -> list:
    doc = _sessions_col.find_one({"session_id": session_id}, {"messages": 1})
    return doc["messages"] if doc else []


def update_history(session_id: str, role: str, content: str,
                   user_id: str | None = None) -> None:
    now = datetime.now(timezone.utc)
    _sessions_col.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": {"role": role, "content": content}},
            "$set":  {"updated_at": now},
            "$setOnInsert": {
                "user_id":    user_id,
                "title":      "New Chat",
                "project_id": None,
                "created_at": now,
            },
        },
        upsert=True,
    )


# ══════════════════════════════════════════════════════════════════
#  PROJECTS
# ══════════════════════════════════════════════════════════════════

def get_user_projects(user_id: str) -> list:
    return list(_projects_col.find(
        {"user_id": user_id},
        {"_id": 0},
    ).sort("created_at", ASCENDING))


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
    _projects_col.insert_one(doc)
    doc.pop("_id", None)
    return doc


def update_project(project_id: str, user_id: str, **kwargs) -> bool:
    kwargs["updated_at"] = datetime.now(timezone.utc)
    result = _projects_col.update_one(
        {"project_id": project_id, "user_id": user_id},
        {"$set": kwargs},
    )
    return result.matched_count > 0


def delete_project(project_id: str, user_id: str) -> bool:
    _projects_col.delete_one({"project_id": project_id, "user_id": user_id})
    _sessions_col.delete_many({"project_id": project_id, "user_id": user_id})
    return True
