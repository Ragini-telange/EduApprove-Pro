from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from models.domain import UserRole, ApplicationStatus

class FindingReviewState(str, Enum):
    PENDING_REVIEW = "pending_review"
    CONFIRMED = "confirmed"
    EDITED = "edited"
    DISMISSED = "dismissed"

class FindingCategory(str, Enum):
    MISSING_FIELD = "missing_field"
    METADATA_MISMATCH = "metadata_mismatch"
    UNREADABLE_SCAN = "unreadable_scan"
    NORM_NON_COMPLIANCE = "norm_non_compliance"
    DEFICIENCY_DRAFT = "deficiency_draft"

class OCREngineStatus(BaseModel):
    is_available: bool
    engine_name: str
    installed_binary: Optional[str] = None
    status_code: str  # "available" | "unavailable"
    message: str
    setup_instructions: str

class DocumentAccessCheckRequest(BaseModel):
    application_id: str
    document_id: str
    officer_id: str
    officer_role: UserRole
    officer_jurisdictions: List[str]
    application_jurisdiction_state: str
    file_name: str
    file_type: str
    file_size_bytes: int

class DocumentFinding(BaseModel):
    id: str
    document_id: str
    document_name: str
    finding_type: FindingCategory
    title: str
    explanation: str
    relevant_checklist_code: Optional[str] = None
    relevant_checklist_title: Optional[str] = None
    supporting_extracted_text: Optional[str] = None
    page_reference: Optional[str] = None  # Only provided when extraction supplies it
    confidence_score: Optional[float] = None  # 0.0 to 1.0, None if unsupplied
    confidence_label: Optional[str] = None  # "High (89%)", "Uncertain / Low Quality (42%)"
    suggested_follow_up: str
    review_state: FindingReviewState = FindingReviewState.PENDING_REVIEW
    is_machine_generated: bool = True
    edited_title: Optional[str] = None
    edited_explanation: Optional[str] = None
    officer_remarks: Optional[str] = None
    created_at: str

class DocumentAnalysisRequest(BaseModel):
    application_id: str
    document_id: str
    officer_id: str
    officer_role: UserRole
    officer_jurisdictions: List[str]
    application_jurisdiction_state: str
    file_name: str
    file_type: str
    file_size_bytes: int
    document_content_base64: Optional[str] = None
    simulated_text: Optional[str] = None

class DocumentAnalysisResponse(BaseModel):
    success: bool
    document_id: str
    engine_status: OCREngineStatus
    extracted_text_snippet: Optional[str] = None
    findings: List[DocumentFinding] = []
    error: Optional[str] = None
    is_simulated: bool = False

class FindingReviewRequest(BaseModel):
    finding_id: str
    action: FindingReviewState
    edited_title: Optional[str] = None
    edited_explanation: Optional[str] = None
    officer_remarks: Optional[str] = None
    officer_name: str

class ConvertToDeficiencyRequest(BaseModel):
    finding_id: str
    application_id: str
    document_id: str
    officer_name: str
    severity: str = "major"
    clause_reference: str
    rectification_deadline: str
