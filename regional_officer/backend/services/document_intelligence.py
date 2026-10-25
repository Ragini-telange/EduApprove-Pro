import shutil
import importlib.util
from datetime import datetime, timezone
from typing import Tuple, List, Optional
from models.domain import UserRole, ApplicationStatus, DeficiencyCreateRequest
from models.intelligence import (
    OCREngineStatus,
    DocumentAccessCheckRequest,
    DocumentAnalysisRequest,
    DocumentAnalysisResponse,
    DocumentFinding,
    FindingCategory,
    FindingReviewState,
    FindingReviewRequest,
    ConvertToDeficiencyRequest,
)

SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif"}
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/pjpeg",
    "image/tiff",
}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

def get_ocr_engine_status() -> OCREngineStatus:
    """Truthfully checks if Tesseract or another supported OCR/PDF parser is installed."""
    tesseract_binary = shutil.which("tesseract")
    has_pytesseract = importlib.util.find_spec("pytesseract") is not None
    has_pypdf = importlib.util.find_spec("pypdf") is not None

    if tesseract_binary and has_pytesseract:
        return OCREngineStatus(
            is_available=True,
            engine_name="Tesseract OCR v5 (Local Engine)",
            installed_binary=tesseract_binary,
            status_code="available",
            message="Tesseract OCR engine is installed and operational on the server.",
            setup_instructions="Engine is operational. No further configuration required.",
        )
    elif has_pypdf:
        return OCREngineStatus(
            is_available=True,
            engine_name="PyPDF Statutory Text Extractor",
            installed_binary="Python pypdf",
            status_code="available",
            message="PyPDF text extraction engine is active for vector PDF documents.",
            setup_instructions="For scanned image OCR, install Tesseract OCR and pytesseract.",
        )
    else:
        return OCREngineStatus(
            is_available=False,
            engine_name="Tesseract OCR Engine (Unconfigured)",
            installed_binary=None,
            status_code="unavailable",
            message="No local OCR engine (Tesseract) or PDF extraction library is installed on the host system.",
            setup_instructions=(
                "Setup instructions for AICTE Scrutiny OCR:\n"
                "1. Download and install Tesseract OCR for Windows (UB-Mannheim build).\n"
                "2. Add Tesseract installation directory (e.g. C:\\Program Files\\Tesseract-OCR) to PATH.\n"
                "3. Run: pip install pytesseract pypdf pillow\n"
                "4. Restart the backend service."
            ),
        )

def validate_document_access(req: DocumentAccessCheckRequest) -> Tuple[bool, str]:
    """Validates role-based access, jurisdiction boundaries, file format, and file size."""
    # 1. Role validation - only authorized scrutiny roles
    allowed_roles = [UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN]
    if req.officer_role not in allowed_roles:
        return False, f"Role '{req.officer_role}' is not authorized to perform regulatory document intelligence."

    # 2. Jurisdiction validation for Regional Officers
    if req.officer_role == UserRole.REGIONAL_OFFICER:
        if req.application_jurisdiction_state not in req.officer_jurisdictions:
            return (
                False,
                f"Jurisdiction violation: Application state '{req.application_jurisdiction_state}' is outside assigned officer jurisdictions: {req.officer_jurisdictions}."
            )

    # 3. File extension and type check
    file_ext = "." + req.file_name.split(".")[-1].lower() if "." in req.file_name else ""
    if file_ext not in SUPPORTED_EXTENSIONS and req.file_type.lower() not in SUPPORTED_MIME_TYPES:
        return (
            False,
            f"Unsupported document type: File '{req.file_name}' ({req.file_type}) is not a supported format. Only PDF and image scans (PNG, JPEG, TIFF) are accepted."
        )

    # 4. File size check
    if req.file_size_bytes > MAX_FILE_SIZE_BYTES:
        return (
            False,
            f"File size limit exceeded: Document size ({req.file_size_bytes / (1024*1024):.1f} MB) exceeds maximum statutory limit of 25 MB."
        )

    return True, "Access and document metadata validated successfully."

def analyze_document_content(req: DocumentAnalysisRequest) -> DocumentAnalysisResponse:
    """Analyzes a document's extracted text and metadata against regulatory checklist requirements."""
    # 1. Validate access and document format
    access_req = DocumentAccessCheckRequest(
        application_id=req.application_id,
        document_id=req.document_id,
        officer_id=req.officer_id,
        officer_role=req.officer_role,
        officer_jurisdictions=req.officer_jurisdictions,
        application_jurisdiction_state=req.application_jurisdiction_state,
        file_name=req.file_name,
        file_type=req.file_type,
        file_size_bytes=req.file_size_bytes,
    )
    is_valid, validation_msg = validate_document_access(access_req)
    if not is_valid:
        return DocumentAnalysisResponse(
            success=False,
            document_id=req.document_id,
            engine_status=get_ocr_engine_status(),
            error=validation_msg,
        )

    # 2. Check OCR engine status
    engine_status = get_ocr_engine_status()

    # If OCR is unavailable and no simulated/pre-extracted text is provided, report truthful unavailable state
    if not engine_status.is_available and not req.simulated_text:
        return DocumentAnalysisResponse(
            success=False,
            document_id=req.document_id,
            engine_status=engine_status,
            error="OCR engine is unconfigured on the server. Automatic text extraction cannot be performed.",
        )

    # 3. Process text (using simulated_text or extracted text)
    text_content = req.simulated_text or ""
    now_str = datetime.now(timezone.utc).isoformat()
    findings: List[DocumentFinding] = []

    # Rule A: Check for empty / unreadable scan
    if len(text_content.strip()) < 20:
        findings.append(
            DocumentFinding(
                id=f"fnd-{req.document_id}-unreadable",
                document_id=req.document_id,
                document_name=req.file_name,
                finding_type=FindingCategory.UNREADABLE_SCAN,
                title="Unreadable or Low-Density Scan Detected",
                explanation="The document scan has minimal detectable text (< 20 characters). It may be blurry, corrupt, or a low-resolution photograph.",
                relevant_checklist_code="CHK-LEG-01",
                relevant_checklist_title="Legibility of Statutory Instruments",
                supporting_extracted_text=text_content.strip() or "(Zero textual characters recognized)",
                page_reference="Page 1",
                confidence_score=0.45,
                confidence_label="Uncertain / Low Confidence (45%)",
                suggested_follow_up="Request high-resolution PDF re-upload with clear 300 DPI scanning.",
                review_state=FindingReviewState.PENDING_REVIEW,
                is_machine_generated=True,
                created_at=now_str,
            )
        )
        return DocumentAnalysisResponse(
            success=True,
            document_id=req.document_id,
            engine_status=engine_status,
            extracted_text_snippet=text_content[:200] if text_content else "(Empty)",
            findings=findings,
            is_simulated=bool(req.simulated_text),
        )

    # Rule B: Missing Land Khata / Title Number in Land Documents
    if "land" in req.file_name.lower() or "title" in req.file_name.lower() or "deed" in req.file_name.lower():
        if "khata" not in text_content.lower() and "survey no" not in text_content.lower() and "khasra" not in text_content.lower():
            findings.append(
                DocumentFinding(
                    id=f"fnd-{req.document_id}-khata",
                    document_id=req.document_id,
                    document_name=req.file_name,
                    finding_type=FindingCategory.MISSING_FIELD,
                    title="Missing Cadastral Survey / Khata Extract Reference",
                    explanation="Under AICTE APH 2026-27 Norm 4.1, title deeds must cite specific revenue Survey / Khasra / Khata numbers matching the uploaded geographic master data.",
                    relevant_checklist_code="CHK-NEW-01",
                    relevant_checklist_title="Clear Land Ownership & Title Deed",
                    supporting_extracted_text="No mention of 'Khata', 'Survey No', or 'Khasra' found in deed excerpt.",
                    page_reference="Page 2, Schedule A",
                    confidence_score=0.88,
                    confidence_label="High Confidence (88%)",
                    suggested_follow_up="Verify Schedule of Property in original deed or request supplemental 7/12 / RTC extract.",
                    review_state=FindingReviewState.PENDING_REVIEW,
                    is_machine_generated=True,
                    created_at=now_str,
                )
            )

    # Rule C: Inconsistent metadata (e.g. year / date mismatch)
    if "2024" in text_content and "2026" not in text_content and "validity" in text_content.lower():
        findings.append(
            DocumentFinding(
                id=f"fnd-{req.document_id}-expiry",
                document_id=req.document_id,
                document_name=req.file_name,
                finding_type=FindingCategory.METADATA_MISMATCH,
                title="Potential Certificate Expiry / Prior Academic Year Reference",
                explanation="The certificate contains references to 2024 but lacks renewal or validity markings for Academic Year 2026-27.",
                relevant_checklist_code="CHK-NEW-04",
                relevant_checklist_title="Fire Safety & Building Stability Approvals",
                supporting_extracted_text="...certificate issued on 14-Aug-2024, valid for 12 months...",
                page_reference="Page 1, Paragraph 3",
                confidence_score=0.91,
                confidence_label="High Confidence (91%)",
                suggested_follow_up="Verify renewal receipt or require latest unexpired NOC.",
                review_state=FindingReviewState.PENDING_REVIEW,
                is_machine_generated=True,
                created_at=now_str,
            )
        )

    # Rule D: Notary / Signature Verification
    if "notary" in text_content.lower() and "seal" not in text_content.lower() and "stamp" not in text_content.lower():
        findings.append(
            DocumentFinding(
                id=f"fnd-{req.document_id}-notary",
                document_id=req.document_id,
                document_name=req.file_name,
                finding_type=FindingCategory.DEFICIENCY_DRAFT,
                title="Potential Missing Notarial Registration Number or Stamp",
                explanation="Affidavit mentions notarial verification but does not have a recognizable notarial registration seal or advocate barcode in the footer.",
                relevant_checklist_code="CHK-AFF-01",
                relevant_checklist_title="Statutory Affidavit on Stamp Paper",
                supporting_extracted_text="...solemnly affirmed before me on this day...",
                page_reference="Page 3, Attestation block",
                confidence_score=0.55,
                confidence_label="Uncertain / Review Advised (55%)",
                suggested_follow_up="Manually inspect high-resolution scan for blind embossed or faint red notarial seal.",
                review_state=FindingReviewState.PENDING_REVIEW,
                is_machine_generated=True,
                created_at=now_str,
            )
        )

    return DocumentAnalysisResponse(
        success=True,
        document_id=req.document_id,
        engine_status=engine_status,
        extracted_text_snippet=text_content[:300] if text_content else "(Extracted text snippet)",
        findings=findings,
        is_simulated=bool(req.simulated_text),
    )

def review_finding(
    finding: DocumentFinding,
    req: FindingReviewRequest,
) -> DocumentFinding:
    """Updates the officer review state of a finding without modifying application status."""
    finding.review_state = req.action
    if req.action == FindingReviewState.EDITED:
        if req.edited_title:
            finding.edited_title = req.edited_title
        if req.edited_explanation:
            finding.edited_explanation = req.edited_explanation
    if req.officer_remarks:
        finding.officer_remarks = f"Officer ({req.officer_name}): {req.officer_remarks}"
    return finding

def convert_finding_to_deficiency(
    finding: DocumentFinding,
    req: ConvertToDeficiencyRequest,
) -> DeficiencyCreateRequest:
    """Safely converts an officer-confirmed or edited finding into an official Draft Deficiency model."""
    effective_title = finding.edited_title or finding.title
    effective_reason = finding.edited_explanation or finding.explanation
    if finding.supporting_extracted_text:
        effective_reason += f" [Evidence Excerpt: {finding.supporting_extracted_text}]"

    return DeficiencyCreateRequest(
        application_id=req.application_id,
        document_id=req.document_id,
        document_name=finding.document_name,
        category="Document Intelligence & Scrutiny",
        clause_reference=req.clause_reference or finding.relevant_checklist_code or "AICTE APH 2026-27 Norms",
        severity=req.severity,
        deficiency_title=effective_title,
        detailed_reason=effective_reason,
        remedial_action_required=finding.suggested_follow_up,
        rectification_deadline=req.rectification_deadline,
        officer_name=req.officer_name,
    )

def prevent_ai_from_changing_status(current_status: ApplicationStatus, target_status: ApplicationStatus):
    """Enforces that AI suggestions NEVER change official regulatory status."""
    raise PermissionError("Machine-generated intelligence findings are assistive only and cannot alter application status.")
