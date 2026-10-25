from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    institution_id: str
    title: str
    description: str
    severity: str # "Critical", "High Priority", "Upcoming"
    category: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    is_dismissed: bool
    created_at: datetime

    class Config:
        from_attributes = True
