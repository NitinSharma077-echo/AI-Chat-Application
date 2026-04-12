from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    chat: str
    session_id: str
    model: Optional[str] = None           # override MODEL_NAME from .env
    images: Optional[list[str]] = None    # base64-encoded images (for vision models)
    project_context: Optional[str] = None # shared system prompt from the project folder

class ChatResponse(BaseModel):
    reply: str
