import pytest
from fastapi.testclient import TestClient
from main import app
from models.domain import UserRole, ApplicationStatus
from models.intelligence import (
    FindingCategory,
    FindingReviewState,
    DocumentAccessCheckRequest,
    DocumentAnalysisRequest,
    FindingReviewRequest,
    ConvertToDeficiencyRequest,
)
from services.document_intelligence import (
    get_ocr_engine_status,
    validate_document_access,
    analyze_document_content,
    review_finding,
    convert_finding_to_deficiency,
    prevent_ai_from_changing_status,
)

client = TestClient(app)

# 1. OCR Engine Status check (truthful reporting)
def test_ocr_engine_status_truthful():
    status = get_ocr_engine_status()
    # It must return a valid status object without throwing
    assert status.status_code in ["available", "unavailable"]
    assert any(term in status.setup_instructions.lower() for term in ["instructions", "operational", "install", "setup"])
    
    # Via API endpoint
    response = client.get("/api/documents/ocr-status")
    assert response.status_code == 200
    data = response.json()
    assert "is_available" in data
    assert "setup_instructions" in data

# 2. Unsupported document types
def test_unsupported_document_type():
    req = DocumentAccessCheckRequest(
        application_id="app-001",
        document_id="doc-bad-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra", "Goa"],
        application_jurisdiction_state="Maharashtra",
        file_name="malicious_payload.exe",
        file_type="application/x-msdownload",
        file_size_bytes=1024,
    )
    is_valid, msg = validate_document_access(req)
    assert is_valid is False
    assert "Unsupported document type" in msg

    # Via API endpoint
    res = client.post("/api/documents/check-access", json=req.model_dump())
    assert res.status_code == 400
    assert "Unsupported document type" in res.json()["detail"]

# 3. File size limit validation
def test_document_size_limit_exceeded():
    req = DocumentAccessCheckRequest(
        application_id="app-001",
        document_id="doc-huge-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra", "Goa"],
        application_jurisdiction_state="Maharashtra",
        file_name="massive_scan.pdf",
        file_type="application/pdf",
        file_size_bytes=35 * 1024 * 1024, # 35 MB > 25 MB
    )
    is_valid, msg = validate_document_access(req)
    assert is_valid is False
    assert "exceeds maximum statutory limit" in msg

# 4. Unauthorized document access (Jurisdiction mismatch)
def test_unauthorized_jurisdiction_access():
    req = DocumentAccessCheckRequest(
        application_id="app-002",
        document_id="doc-002",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra", "Goa"],
        application_jurisdiction_state="Karnataka", # Outside jurisdiction
        file_name="title_deed.pdf",
        file_type="application/pdf",
        file_size_bytes=2048,
    )
    is_valid, msg = validate_document_access(req)
    assert is_valid is False
    assert "Jurisdiction violation" in msg

    res = client.post("/api/documents/check-access", json=req.model_dump())
    assert res.status_code == 403

# 5. Unauthorized role (Institution Admin cannot perform officer scrutiny intelligence)
def test_unauthorized_role_access():
    req = DocumentAccessCheckRequest(
        application_id="app-001",
        document_id="doc-001",
        officer_id="inst-admin-5",
        officer_role=UserRole.INSTITUTION_ADMIN,
        officer_jurisdictions=["Maharashtra"],
        application_jurisdiction_state="Maharashtra",
        file_name="title_deed.pdf",
        file_type="application/pdf",
        file_size_bytes=2048,
    )
    is_valid, msg = validate_document_access(req)
    assert is_valid is False
    assert "not authorized" in msg

# 6. Empty or unreadable documents
def test_empty_or_unreadable_document_finding():
    req = DocumentAnalysisRequest(
        application_id="app-001",
        document_id="doc-blurry-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra", "Goa"],
        application_jurisdiction_state="Maharashtra",
        file_name="scanned_page.pdf",
        file_type="application/pdf",
        file_size_bytes=50000,
        simulated_text="   ", # Whitespace only
    )
    res = analyze_document_content(req)
    assert res.success is True
    assert len(res.findings) == 1
    finding = res.findings[0]
    assert finding.finding_type == FindingCategory.UNREADABLE_SCAN
    assert "Unreadable" in finding.title
    assert finding.confidence_score is not None
    assert finding.confidence_score < 0.60
    assert "Uncertain" in (finding.confidence_label or "")

# 7. Successful analysis and structured findings generation
def test_successful_document_analysis_findings():
    req = DocumentAnalysisRequest(
        application_id="app-001",
        document_id="doc-land-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra", "Goa"],
        application_jurisdiction_state="Maharashtra",
        file_name="land_title_deed.pdf",
        file_type="application/pdf",
        file_size_bytes=102400,
        simulated_text=(
            "Registered indenture of lease made between Pune Metropolitan Development Authority and Modern Institute. "
            "The premises consist of 5.0 acres of institutional zoned land. Issued on 14-Aug-2024, valid for 12 months. "
            "Solemnly affirmed before me on this day by notary public."
        ),
    )
    res = analyze_document_content(req)
    assert res.success is True
    assert len(res.findings) >= 2 # Expecting missing khata, expiry mismatch, or notary seal notice
    
    # Check that machine generated flag is present
    for f in res.findings:
        assert f.is_machine_generated is True
        assert f.review_state == FindingReviewState.PENDING_REVIEW
        assert f.relevant_checklist_code is not None

# 8. Confirming, editing, and dismissing findings
def test_review_finding_lifecycle():
    # Setup initial finding
    req = DocumentAnalysisRequest(
        application_id="app-001",
        document_id="doc-land-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra"],
        application_jurisdiction_state="Maharashtra",
        file_name="land_title_deed.pdf",
        file_type="application/pdf",
        file_size_bytes=102400,
        simulated_text="Lease agreement between PMDA and Society for 5.0 acres without parcel identifiers.",
    )
    res = analyze_document_content(req)
    finding = res.findings[0]

    # A. Confirm finding
    confirm_req = FindingReviewRequest(
        finding_id=finding.id,
        action=FindingReviewState.CONFIRMED,
        officer_remarks="Verified missing khata number in Schedule of Property.",
        officer_name="Ragini Telange",
    )
    reviewed = review_finding(finding, confirm_req)
    assert reviewed.review_state == FindingReviewState.CONFIRMED
    assert "Ragini Telange" in (reviewed.officer_remarks or "")

    # B. Edit finding
    edit_req = FindingReviewRequest(
        finding_id=finding.id,
        action=FindingReviewState.EDITED,
        edited_title="Omission of Survey No. 42/1 in Land Title Schedule A",
        edited_explanation="Specific parcel 42/1 is omitted from the registered schedule.",
        officer_remarks="Refined after cross-referencing GIS portal.",
        officer_name="Ragini Telange",
    )
    edited = review_finding(reviewed, edit_req)
    assert edited.review_state == FindingReviewState.EDITED
    assert edited.edited_title == "Omission of Survey No. 42/1 in Land Title Schedule A"

    # C. Dismiss finding
    dismiss_req = FindingReviewRequest(
        finding_id=finding.id,
        action=FindingReviewState.DISMISSED,
        officer_remarks="Found khata reference on supplementary Annexure 3.",
        officer_name="Ragini Telange",
    )
    dismissed = review_finding(edited, dismiss_req)
    assert dismissed.review_state == FindingReviewState.DISMISSED

# 9. Converting finding into a draft deficiency without jumping workflow status
def test_convert_finding_to_draft_deficiency():
    req = DocumentAnalysisRequest(
        application_id="app-wro-001",
        document_id="doc-fire-01",
        officer_id="off-101",
        officer_role=UserRole.REGIONAL_OFFICER,
        officer_jurisdictions=["Maharashtra"],
        application_jurisdiction_state="Maharashtra",
        file_name="fire_safety_noc.pdf",
        file_type="application/pdf",
        file_size_bytes=80000,
        simulated_text="Certificate issued on 14-Aug-2024, valid for 12 months with validity...",
    )
    res = analyze_document_content(req)
    finding = res.findings[0]

    def_req = ConvertToDeficiencyRequest(
        finding_id=finding.id,
        application_id="app-wro-001",
        document_id="doc-fire-01",
        officer_name="Ragini Telange",
        severity="major",
        clause_reference="AICTE APH 2026-27 Norm 4.4",
        rectification_deadline="2026-11-10",
    )
    deficiency = convert_finding_to_deficiency(finding, def_req)
    assert deficiency.application_id == "app-wro-001"
    assert deficiency.document_id == "doc-fire-01"
    assert deficiency.severity == "major"
    assert deficiency.clause_reference == "AICTE APH 2026-27 Norm 4.4"
    assert deficiency.rectification_deadline == "2026-11-10"
    assert deficiency.officer_name == "Ragini Telange"
    assert len(deficiency.remedial_action_required) > 0

# 10. Explicit safeguard: AI findings CANNOT directly approve, reject, or transition application status
def test_ai_status_mutation_prevented():
    with pytest.raises(PermissionError) as exc_info:
        prevent_ai_from_changing_status(
            current_status=ApplicationStatus.UNDER_SCRUTINY,
            target_status=ApplicationStatus.COMPLETED,
        )
    assert "assistive only and cannot alter application status" in str(exc_info.value)
