from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from models.domain import Application, ApplicationStatus, UserRole, TransitionRequest
from models.workflows import validate_transition
from models.intelligence import (
    OCREngineStatus,
    DocumentAccessCheckRequest,
    DocumentAnalysisRequest,
    DocumentAnalysisResponse,
    DocumentFinding,
    FindingReviewRequest,
    ConvertToDeficiencyRequest,
)
from services.document_intelligence import (
    get_ocr_engine_status,
    validate_document_access,
    analyze_document_content,
    review_finding,
    convert_finding_to_deficiency,
)

app = FastAPI(
    title="EduApprove Pro - AICTE Regulatory Backend",
    version="1.0.0",
    description="Statutory Scrutiny and Workflow Management Engine for AICTE Regional Officers",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import get_current_user, require_roles, AuthenticatedUser

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "EduApprove Pro Backend",
        "module": "Regional Officer Scrutiny API",
        "version": "1.0.0",
        "auth_security": "Supabase JWT Bearer Enforced"
    }

@app.post("/api/applications/validate-transition")
def check_transition(
    req: TransitionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Derive officer role strictly from verified token (or validate against payload)
    effective_role = current_user.role if not current_user.is_mock else req.officer_role
    if not current_user.is_mock and req.officer_role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Authorization mismatch: verified token role '{current_user.role.value}' does not match requested role '{req.officer_role.value}'."
        )

    is_valid, msg = validate_transition(
        current_status=ApplicationStatus.UNDER_SCRUTINY,
        target_status=req.target_status,
        role=effective_role,
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"valid": True, "message": msg, "verified_actor": current_user.user_id}

# Phase 7: Document Intelligence Endpoints (Secured with Server-Side RBAC)
@app.get("/api/documents/ocr-status", response_model=OCREngineStatus)
def check_ocr_status():
    """Returns the factual status of the host server's OCR / text extraction engine."""
    return get_ocr_engine_status()

@app.post("/api/documents/check-access")
def check_access(
    req: DocumentAccessCheckRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Enforces server-side access control, jurisdiction boundaries, file format, and size."""
    if not current_user.is_mock:
        # Validate that client-supplied claims do not forge identity
        if req.officer_role != current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Client-supplied role does not match verified token."
            )
        req.officer_role = current_user.role
        req.officer_id = current_user.user_id

    is_valid, msg = validate_document_access(req)
    if not is_valid:
        if "Role" in msg or "Jurisdiction" in msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"authorized": True, "message": msg, "verified_actor": current_user.user_id}

@app.post("/api/documents/analyze", response_model=DocumentAnalysisResponse)
def analyze_document(
    req: DocumentAnalysisRequest,
    current_user: AuthenticatedUser = Depends(require_roles([UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN]))
):
    """Executes statutory document inspection, comparison with APH checklist, and returns structured findings."""
    if not current_user.is_mock:
        req.officer_role = current_user.role
        req.officer_name = current_user.email or req.officer_name

    res = analyze_document_content(req)
    if not res.success and res.error and ("Jurisdiction" in res.error or "Role" in res.error):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=res.error)
    return res

@app.post("/api/documents/findings/review", response_model=DocumentFinding)
def review_document_finding(
    req: FindingReviewRequest,
    finding: DocumentFinding,
    current_user: AuthenticatedUser = Depends(require_roles([UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN]))
):
    """Records officer confirmation, edit, or dismissal for a machine-generated finding."""
    if not current_user.is_mock:
        req.officer_name = current_user.email or req.officer_name
    return review_finding(finding, req)

@app.post("/api/documents/findings/convert-to-deficiency")
def convert_to_deficiency(
    req: ConvertToDeficiencyRequest,
    finding: DocumentFinding,
    current_user: AuthenticatedUser = Depends(require_roles([UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN]))
):
    """Transforms a confirmed finding into an official Draft Deficiency model without changing status."""
    if not current_user.is_mock:
        req.officer_name = current_user.email or req.officer_name
    return convert_finding_to_deficiency(finding, req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

