from fastapi import APIRouter, Depends
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.ai_service import generate
from app.db.memory import update_history
from app.api.auth import get_current_user

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    update_history(req.session_id, "user", req.chat, user_id=user_id)
    reply = generate(
        session_id=req.session_id,
        user_message=req.chat,
        images=req.images,
        model=req.model,
        project_context=req.project_context,
    )
    update_history(req.session_id, "assistant", reply, user_id=user_id)
    return ChatResponse(reply=reply)
