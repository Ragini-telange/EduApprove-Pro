from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InstitutionBase(BaseModel):
    name: str
    code: Optional[str] = None
    category: str
    institution_type: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    state: str
    district: str
    pincode: str
    establishment_year: int
    approval_status: str
    current_academic_year: str

class InstitutionResponse(InstitutionBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
