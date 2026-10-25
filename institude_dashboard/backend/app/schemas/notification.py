from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    institution_id: str
    title: str
    message: str
    notification_type: str
    severity: str
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: datetime
    time_ago: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationCountResponse(BaseModel):
    total: int
    unread: int
