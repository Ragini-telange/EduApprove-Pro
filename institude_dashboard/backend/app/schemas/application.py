from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ApplicationBase(BaseModel):
    application_type: str
    academic_year: Optional[str] = "2026-2027"
    remarks: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    institution_id: str
    application_type: str
    academic_year: str
    status: str
    current_stage: str
    submitted_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None
    correction_deadline: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplicationRecentItem(BaseModel):
    id: int
    application_number: str
    application_type: str
    submitted_date: Optional[str] = None
    current_stage: str
    status: str

    class Config:
        from_attributes = True
