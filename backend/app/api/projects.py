from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.auth import get_current_user
from app.db import memory as db

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectBody(BaseModel):
    project_id:     str
    name:           str
    color:          str
    shared_context: str = ""


class UpdateProjectBody(BaseModel):
    name:           str | None = None
    color:          str | None = None
    shared_context: str | None = None
    collapsed:      bool | None = None


@router.get("")
def list_projects(user_id: str = Depends(get_current_user)):
    projects = db.get_user_projects(user_id)
    return [
        {
            "id":            p["project_id"],
            "name":          p["name"],
            "color":         p["color"],
            "sharedContext": p.get("shared_context", ""),
            "collapsed":     p.get("collapsed", False),
        }
        for p in projects
    ]


@router.post("")
def create_project(body: CreateProjectBody,
                   user_id: str = Depends(get_current_user)):
    db.create_project(
        body.project_id, user_id,
        body.name, body.color, body.shared_context,
    )
    return {
        "id":            body.project_id,
        "name":          body.name,
        "color":         body.color,
        "sharedContext": body.shared_context,
        "collapsed":     False,
    }


@router.put("/{project_id}")
def update_project(project_id: str, body: UpdateProjectBody,
                   user_id: str = Depends(get_current_user)):
    updates = {}
    if body.name           is not None: updates["name"]           = body.name
    if body.color          is not None: updates["color"]          = body.color
    if body.shared_context is not None: updates["shared_context"] = body.shared_context
    if body.collapsed      is not None: updates["collapsed"]      = body.collapsed
    if updates:
        db.update_project(project_id, user_id, **updates)
    return {"ok": True}


@router.delete("/{project_id}")
def delete_project(project_id: str, user_id: str = Depends(get_current_user)):
    db.delete_project(project_id, user_id)
    return {"ok": True}
