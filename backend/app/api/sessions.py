from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.api.auth import get_current_user
from app.db import memory as db

router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionBody(BaseModel):
    session_id: str
    title:      str = "New Chat"
    project_id: str | None = None


class RenameSessionBody(BaseModel):
    title: str


@router.get("")
def list_sessions(user_id: str = Depends(get_current_user)):
    sessions = db.get_user_sessions(user_id)
    return [
        {
            "id":         s["session_id"],
            "title":      s["title"],
            "projectId":  s.get("project_id"),
            "updated_at": s["updated_at"].isoformat() if s.get("updated_at") else None,
        }
        for s in sessions
    ]


@router.post("")
def create_session(body: CreateSessionBody,
                   user_id: str = Depends(get_current_user)):
    db.create_session(body.session_id, user_id, body.title, body.project_id)
    return {"id": body.session_id, "title": body.title, "projectId": body.project_id}


@router.get("/{session_id}/messages")
def get_messages(session_id: str, user_id: str = Depends(get_current_user)):
    msgs = db.get_messages(session_id, user_id)
    return msgs


@router.put("/{session_id}")
def rename_session(session_id: str, body: RenameSessionBody,
                   user_id: str = Depends(get_current_user)):
    db.rename_session(session_id, user_id, body.title)
    return {"ok": True}


@router.delete("/{session_id}")
def delete_session(session_id: str, user_id: str = Depends(get_current_user)):
    db.delete_session(session_id, user_id)
    return {"ok": True}
