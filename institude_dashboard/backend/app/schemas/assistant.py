from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question to AI SmartAssist")

class RelatedItem(BaseModel):
    id: Optional[str] = None
    title: str
    type: str # "application", "document", "compliance", "evc", "policy"
    link: Optional[str] = None

class ChatMessageResponse(BaseModel):
    answer: str
    related_items: List[RelatedItem] = []
    timestamp: str
    suggestions: List[str] = []
