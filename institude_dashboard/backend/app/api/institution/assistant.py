from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.assistant import ChatMessageRequest, ChatMessageResponse
from app.services.assistant_service import assistant_service
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=ChatMessageResponse)
def chat_with_assistant(
    payload: ChatMessageRequest,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    AI SmartAssist Chatbot interface.
    Answers questions regarding applications, expiring documents, compliance due dates,
    and EVC visits using live institutional database intelligence.
    """
    return assistant_service.process_query(db, institution_id, payload.message)
