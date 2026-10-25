from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class EVCStatusResponse(BaseModel):
    is_applicable: bool
    id: Optional[int] = None
    application_id: Optional[int] = None
    application_number: Optional[str] = None
    visit_date: Optional[date] = None
    formatted_date: Optional[str] = None # e.g. "20 Nov 2026"
    visit_time: Optional[str] = None # e.g. "10:30 AM"
    visit_type: Optional[str] = None # "Committee Visit"
    status: Optional[str] = None # "Scheduled"
    committee_members_count: Optional[int] = 3
    preparation_status_pct: Optional[int] = 75 # "75% Complete"
    venue_or_mode: Optional[str] = None
    contact_person: Optional[str] = None
    remarks: Optional[str] = None
    days_until_visit: Optional[int] = None
