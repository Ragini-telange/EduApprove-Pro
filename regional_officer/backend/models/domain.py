from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    REGIONAL_OFFICER = "regional_officer"
    INSTITUTION_ADMIN = "institution_admin"
    SENIOR_AUTHORITY = "senior_authority"
    SUPER_ADMIN = "super_admin"

class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_SCRUTINY = "under_scrutiny"
    CORRECTION_REQUIRED = "correction_required"
    RESUBMITTED = "resubmitted"
    UNDER_RE_SCRUTINY = "under_re_scrutiny"
    PENDING_EVC = "pending_evc"
    EVC_SCHEDULED = "evc_scheduled"
    UNDER_NEXT_STAGE = "under_next_stage"
    COMPLETED = "completed"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class ApplicationType(str, Enum):
    NEW_INSTITUTION = "new_institution"
    EXTENSION_OF_APPROVAL = "extension_of_approval"
    INCREASE_IN_INTAKE = "increase_in_intake"
    CLOSURE_OF_COURSE = "closure_of_course"
    CHANGE_OF_SITE = "change_of_site"
    CONVERSION_OF_WOMEN_INST = "conversion_of_women_inst"

class DocumentVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    CORRECTION_REQUIRED = "correction_required"
    REJECTED = "rejected"

class Institution(BaseModel):
    id: str
    aicte_permanent_id: str
    name: str
    address: str
    city: str
    state: str
    pin_code: str
    regional_office: str
    institution_type: str
    contact_person: str
    contact_email: str
    contact_phone: str
    established_year: int

class Application(BaseModel):
    id: str
    application_number: str
    institution_id: str
    institution: Institution
    type: ApplicationType
    academic_year: str
    status: ApplicationStatus
    priority: str
    submitted_at: str
    updated_at: str
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    deadline_date: str
    deficiency_count: int = 0
    evc_required: bool = False
    re_scrutiny_count: int = 0

class TransitionRequest(BaseModel):
    application_id: str
    target_status: ApplicationStatus
    officer_id: str
    officer_name: str
    officer_role: UserRole
    remarks: str
    stage_name: str

class DeficiencyCreateRequest(BaseModel):
    application_id: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    category: str
    clause_reference: str
    severity: str
    deficiency_title: str
    detailed_reason: str
    remedial_action_required: str
    rectification_deadline: str
    officer_name: str
