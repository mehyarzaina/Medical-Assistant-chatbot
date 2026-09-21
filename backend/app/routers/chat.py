import uuid

from fastapi import APIRouter

from app.chat_service import handle_chat_message
from app.models import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    session_id = payload.session_id or str(uuid.uuid4())
    reply, doctors = await handle_chat_message(session_id, payload.message)
    return ChatResponse(session_id=session_id, reply=reply, doctors=doctors)