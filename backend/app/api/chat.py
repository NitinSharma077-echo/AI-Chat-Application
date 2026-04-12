from fastapi import APIRouter
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.ai_service import generate
from app.db.memory import update_history

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    update_history(req.session_id, "user", req.chat)
    reply = generate(
        session_id=req.session_id,
        user_message=req.chat,
        images=req.images,
        model=req.model,
        project_context=req.project_context,
    )
    update_history(req.session_id, "assistant", reply)
    return ChatResponse(reply=reply)
