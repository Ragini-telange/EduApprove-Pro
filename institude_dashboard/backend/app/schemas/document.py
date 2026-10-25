from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class DocumentBase(BaseModel):
    document_type: str
    document_name: str
    expiry_date: Optional[date] = None

class DocumentResponse(BaseModel):
    id: int
    institution_id: str
    document_type: str
    document_name: str
    file_path: str
    file_url: Optional[str] = None
    uploaded_at: datetime
    expiry_date: Optional[date] = None
    verification_status: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    file_size_kb: int
    mime_type: str
    created_at: datetime
    updated_at: datetime
    
    # Calculated dynamic fields
    expiry_status: str # "Valid", "Expiring Soon", "Critical", "Expired", "Permanent"
    days_remaining: Optional[int] = None

    class Config:
        from_attributes = True

class DocumentPassportItem(BaseModel):
    id: int
    document_type: str
    document_name: str
    verification_status: str
    expiry_date: Optional[date] = None
    expiry_status: str
    days_remaining: Optional[int] = None
    file_url: Optional[str] = None
