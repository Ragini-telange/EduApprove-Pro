from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class ComplianceRequirementResponse(BaseModel):
    id: int
    institution_id: str
    requirement_name: str
    category: str
    description: Optional[str] = None
    due_date: date
    status: str # "Pending", "Submitted", "Verified", "Rejected", "Overdue"
    submitted_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    remarks: Optional[str] = None
    days_remaining: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplianceSummaryResponse(BaseModel):
    total_requirements: int # e.g. 10
    completed_requirements: int # e.g. 8
    pending_requirements: int # e.g. 1
    overdue_requirements: int # e.g. 1
    progress_percentage: float # e.g. 80.0
