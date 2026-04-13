from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import JWTError
from app.db import memory as db
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer()


# ── Schemas ───────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    username: str
    email:    str
    password: str


class LoginBody(BaseModel):
    email:    str
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


# ── Dependency: extract + validate JWT ───────────────────────────

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Routes ────────────────────────────────────────────────────────

@router.post("/register")
def register(body: RegisterBody):
    if len(body.username.strip()) < 2:
        raise HTTPException(status_code=422, detail="Username must be at least 2 characters")
    if "@" not in body.email or "." not in body.email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Invalid email address")
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    if db.get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = db.create_user(body.email, body.username, hash_password(body.password))
    user_id = user["id"]

    return {
        "access_token":  create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "user": {
            "id":       user_id,
            "username": user["username"],
            "email":    user["email"],
        },
    }


@router.post("/login")
def login(body: LoginBody):
    user = db.get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])

    return {
        "access_token":  create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "user": {
            "id":       user_id,
            "username": user["username"],
            "email":    user["email"],
        },
    }


@router.post("/refresh")
def refresh(body: RefreshBody):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"access_token": create_access_token(payload["sub"])}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.get("/me")
def me(user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":       user_id,
        "username": user["username"],
        "email":    user["email"],
    }
