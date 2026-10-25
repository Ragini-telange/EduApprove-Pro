import os
import time
import jwt
import pytest
from fastapi.testclient import TestClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from main import app
from models.domain import UserRole
from models.intelligence import (
    FindingReviewRequest,
    FindingReviewState,
    ConvertToDeficiencyRequest,
    DocumentFinding,
    FindingCategory,
)

client = TestClient(app)
TEST_SECRET = "test-secret-key-for-eduapprove-pro-audit-review-32char"

def generate_test_jwt(
    role: str,
    user_id: str = "test-usr-01",
    exp_offset: int = 3600,
    secret: str = TEST_SECRET,
    algorithm: str = "HS256",
    audience: str = "authenticated",
    issuer: str = None
):
    payload = {
        "sub": user_id,
        "email": f"{user_id}@aicte.gov.in",
        "aud": audience,
        "app_metadata": {
            "role": role,
            "jurisdiction_states": ["Maharashtra", "Goa"],
        },
        "exp": int(time.time()) + exp_offset,
    }
    if issuer:
        payload["iss"] = issuer
    return jwt.encode(payload, secret, algorithm=algorithm)

def generate_sample_finding() -> DocumentFinding:
    return DocumentFinding(
        id="find-sample-01",
        document_id="doc-01",
        document_name="land_title.pdf",
        finding_type=FindingCategory.DEFICIENCY_DRAFT,
        title="Sample Missing Notary Seal",
        explanation="Sample finding explanation for security verification test",
        suggested_follow_up="Check notary seal with registrar",
        confidence_score=0.92,
        is_machine_generated=True,
        review_state=FindingReviewState.PENDING_REVIEW,
        created_at="2026-10-22T10:00:00Z",
    )

# 1. Missing Bearer token in live mode fails closed
def test_missing_jwt_in_live_mode_rejected(monkeypatch):
    monkeypatch.setenv("EDUAPPROVE_DATA_MODE", "live")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)

    req = {
        "application_id": "app-001",
        "target_status": "under_scrutiny",
        "officer_id": "off-01",
        "officer_name": "Ragini",
        "officer_role": "regional_officer",
        "remarks": "Initiating scrutiny",
        "stage_name": "Scrutiny",
    }
    res = client.post("/api/applications/validate-transition", json=req)
    assert res.status_code == 401
    assert "Bearer token required" in res.json()["detail"]

# 2. Expired JWT is rejected with 401
def test_expired_jwt_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    expired_token = generate_test_jwt("regional_officer", exp_offset=-3600)

    req = {
        "application_id": "app-001",
        "target_status": "under_scrutiny",
        "officer_id": "off-01",
        "officer_name": "Ragini",
        "officer_role": "regional_officer",
        "remarks": "Initiating scrutiny",
        "stage_name": "Scrutiny",
    }
    res = client.post(
        "/api/applications/validate-transition",
        json=req,
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401
    assert "token has expired" in res.json()["detail"]

# 3. Tampered signature is rejected with 401
def test_tampered_jwt_signature_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    tampered_token = generate_test_jwt("regional_officer", secret="wrong-unauthorized-signing-secret")

    req = {
        "application_id": "app-001",
        "target_status": "under_scrutiny",
        "officer_id": "off-01",
        "officer_name": "Ragini",
        "officer_role": "regional_officer",
        "remarks": "Initiating scrutiny",
        "stage_name": "Scrutiny",
    }
    res = client.post(
        "/api/applications/validate-transition",
        json=req,
        headers={"Authorization": f"Bearer {tampered_token}"}
    )
    assert res.status_code == 401
    assert "Invalid authentication token" in res.json()["detail"]

# 4. Unsigned token ('alg': 'none') is strictly rejected with 401
def test_unsigned_token_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    payload = {
        "sub": "attacker-01",
        "aud": "authenticated",
        "app_metadata": {"role": "senior_authority"},
        "exp": int(time.time()) + 3600,
    }
    unsigned_token = jwt.encode(payload, key="", algorithm="none")

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "completed", "officer_id": "att", "officer_name": "Attacker", "officer_role": "senior_authority", "remarks": "bypassing", "stage_name": "Decision"},
        headers={"Authorization": f"Bearer {unsigned_token}"}
    )
    assert res.status_code == 401
    assert "Unsigned tokens" in res.json()["detail"]

# 5. Unexpected signing algorithm is rejected with 401
def test_unexpected_signing_algorithm_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv("SUPABASE_JWT_ALGORITHM", "HS256")

    # Generate token signed with HS384 when HS256 is expected
    hs384_token = generate_test_jwt("regional_officer", algorithm="HS384")

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "under_scrutiny", "officer_id": "off-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "scrutiny", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {hs384_token}"}
    )
    assert res.status_code == 401
    assert "Unexpected token signing algorithm" in res.json()["detail"]

# 6. Incorrect audience claim is rejected with 401
def test_incorrect_audience_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")

    wrong_aud_token = generate_test_jwt("regional_officer", audience="malicious_unintended_audience")

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "under_scrutiny", "officer_id": "off-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "scrutiny", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {wrong_aud_token}"}
    )
    assert res.status_code == 401
    assert "Invalid or missing token audience claim" in res.json()["detail"]

# 7. Incorrect issuer claim is rejected with 401
def test_incorrect_issuer_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv("SUPABASE_JWT_ISSUER", "https://official-project.supabase.co/auth/v1")

    wrong_iss_token = generate_test_jwt(
        "regional_officer",
        issuer="https://evil-unauthorized-issuer.com/auth/v1"
    )

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "under_scrutiny", "officer_id": "off-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "scrutiny", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {wrong_iss_token}"}
    )
    assert res.status_code == 401
    assert "Invalid or missing token issuer claim" in res.json()["detail"]

# 8. Valid issuer and audience are accepted with 200
def test_valid_issuer_and_audience_accepted(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    monkeypatch.setenv("SUPABASE_JWT_ISSUER", "https://official-project.supabase.co/auth/v1")

    valid_token = generate_test_jwt(
        "regional_officer",
        audience="authenticated",
        issuer="https://official-project.supabase.co/auth/v1"
    )

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "correction_required", "officer_id": "test-usr-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "Correction notice", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert res.status_code == 200
    assert res.json()["valid"] is True

# 9. Request-body role spoofing in transition is blocked with 403
def test_client_role_tampering_blocked(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    institution_token = generate_test_jwt("institution_admin")

    req = {
        "application_id": "app-001",
        "target_status": "rejected",
        "officer_id": "off-01",
        "officer_name": "Attacker",
        "officer_role": "senior_authority",
        "remarks": "Tampered rejection attempt",
        "stage_name": "Decision",
    }
    res = client.post(
        "/api/applications/validate-transition",
        json=req,
        headers={"Authorization": f"Bearer {institution_token}"}
    )
    assert res.status_code == 403
    assert "Authorization mismatch" in res.json()["detail"]

# 10. Request-body role spoofing in check-access is blocked with 403
def test_check_access_body_role_spoofing_blocked(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    officer_token = generate_test_jwt("regional_officer")

    req = {
        "application_id": "app-001",
        "document_id": "doc-01",
        "officer_id": "off-01",
        "officer_role": "super_admin", # Mismatched body role
        "officer_jurisdictions": ["Maharashtra"],
        "application_jurisdiction_state": "Maharashtra",
        "file_name": "deed.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 1024,
    }
    res = client.post(
        "/api/documents/check-access",
        json=req,
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 403
    assert "Client-supplied role does not match verified token" in res.json()["detail"]

# 11. Unauthorized role accessing document analysis is blocked with 403
def test_unauthorized_role_document_analysis_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    inst_token = generate_test_jwt("institution_admin")

    req = {
        "document_id": "doc-01",
        "document_name": "Land_Affidavit.pdf",
        "category": "Land & Building",
        "application_id": "app-01",
        "application_type": "new_institution",
        "institution_name": "PIATR Pune",
        "officer_name": "Sakshi",
        "officer_role": "institution_admin",
    }
    res = client.post(
        "/api/documents/analyze",
        json=req,
        headers={"Authorization": f"Bearer {inst_token}"}
    )
    assert res.status_code == 403
    assert "is not authorized" in res.json()["detail"]

# 12. Unauthorized role accessing document findings review is blocked with 403
def test_unauthorized_role_findings_review_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    inst_token = generate_test_jwt("institution_admin")

    payload = {
        "req": {
            "finding_id": "find-sample-01",
            "action": "confirmed",
            "officer_remarks": "Unauthorized review attempt",
            "officer_name": "Sakshi",
        },
        "finding": generate_sample_finding().model_dump()
    }
    res = client.post(
        "/api/documents/findings/review",
        json=payload,
        headers={"Authorization": f"Bearer {inst_token}"}
    )
    assert res.status_code == 403
    assert "is not authorized" in res.json()["detail"]

# 13. Unauthorized role accessing convert to deficiency is blocked with 403
def test_unauthorized_role_convert_to_deficiency_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    inst_token = generate_test_jwt("institution_admin")

    payload = {
        "req": {
            "finding_id": "find-sample-01",
            "application_id": "app-001",
            "document_id": "doc-01",
            "officer_name": "Sakshi",
            "severity": "major",
            "clause_reference": "Norm 4.1",
            "rectification_deadline": "2026-11-01",
        },
        "finding": generate_sample_finding().model_dump()
    }
    res = client.post(
        "/api/documents/findings/convert-to-deficiency",
        json=payload,
        headers={"Authorization": f"Bearer {inst_token}"}
    )
    assert res.status_code == 403
    assert "is not authorized" in res.json()["detail"]

# 14. Valid Regional Officer token permits authorized scrutiny transition (200)
def test_valid_regional_officer_token_authorized(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    officer_token = generate_test_jwt("regional_officer")

    req = {
        "application_id": "app-001",
        "target_status": "correction_required",
        "officer_id": "test-usr-01",
        "officer_name": "Ragini",
        "officer_role": "regional_officer",
        "remarks": "Correction notice issued",
        "stage_name": "Scrutiny",
    }
    res = client.post(
        "/api/applications/validate-transition",
        json=req,
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert res.json()["valid"] is True
    assert res.json()["verified_actor"] == "test-usr-01"

# 15. Valid Regional Officer token permits findings review (200)
def test_valid_officer_findings_review_accepted(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    officer_token = generate_test_jwt("regional_officer")

    payload = {
        "req": {
            "finding_id": "find-sample-01",
            "action": "confirmed",
            "officer_remarks": "Official confirmation by Regional Officer",
            "officer_name": "Ragini Telange",
        },
        "finding": generate_sample_finding().model_dump()
    }
    res = client.post(
        "/api/documents/findings/review",
        json=payload,
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert res.json()["review_state"] == "confirmed"

# 16. Valid Regional Officer token permits convert-to-deficiency (200)
def test_valid_officer_convert_to_deficiency_accepted(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    officer_token = generate_test_jwt("regional_officer")

    payload = {
        "req": {
            "finding_id": "find-sample-01",
            "application_id": "app-001",
            "document_id": "doc-01",
            "officer_name": "Ragini Telange",
            "severity": "major",
            "clause_reference": "AICTE APH Norm 4.1",
            "rectification_deadline": "2026-11-15",
        },
        "finding": generate_sample_finding().model_dump()
    }
    res = client.post(
        "/api/documents/findings/convert-to-deficiency",
        json=payload,
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert res.json()["severity"] == "major"
    assert res.json()["application_id"] == "app-001"

# 17. Asymmetric RS256 token verification using trusted public key (200)
def test_asymmetric_rs256_verification_with_public_key(monkeypatch):
    # Generate an ephemeral RSA key pair for testing
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode("utf-8")

    monkeypatch.setenv("SUPABASE_JWT_ALGORITHM", "RS256")
    monkeypatch.setenv("SUPABASE_PUBLIC_KEY", public_pem)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)

    rs256_token = generate_test_jwt(
        "regional_officer",
        secret=private_pem,
        algorithm="RS256"
    )

    req = {
        "application_id": "app-001",
        "target_status": "correction_required",
        "officer_id": "test-usr-01",
        "officer_name": "Ragini",
        "officer_role": "regional_officer",
        "remarks": "Asymmetric RS256 scrutiny transition",
        "stage_name": "Scrutiny",
    }
    res = client.post(
        "/api/applications/validate-transition",
        json=req,
        headers={"Authorization": f"Bearer {rs256_token}"}
    )
    assert res.status_code == 200
    assert res.json()["valid"] is True

# 18. Asymmetric RS256 token with invalid signature rejected with 401
def test_asymmetric_rs256_tampered_signature_rejected(monkeypatch):
    key1 = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    key2 = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    public_pem1 = key1.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")
    private_pem2 = key2.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode("utf-8")

    monkeypatch.setenv("SUPABASE_JWT_ALGORITHM", "RS256")
    monkeypatch.setenv("SUPABASE_PUBLIC_KEY", public_pem1)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)

    # Token signed with key2, but server expects key1
    tampered_rs256_token = generate_test_jwt(
        "regional_officer",
        secret=private_pem2,
        algorithm="RS256"
    )

    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "correction_required", "officer_id": "test-usr-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "scrutiny", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {tampered_rs256_token}"}
    )
    assert res.status_code == 401
    assert "Invalid authentication token signature" in res.json()["detail"]

# 19. Live mode fails closed when no JWT verification method is configured (500)
def test_live_mode_fails_closed_without_config(monkeypatch):
    monkeypatch.setenv("EDUAPPROVE_DATA_MODE", "live")
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.delenv("SUPABASE_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_JWKS_URL", raising=False)

    token = generate_test_jwt("regional_officer")
    res = client.post(
        "/api/applications/validate-transition",
        json={"application_id": "app-001", "target_status": "correction_required", "officer_id": "test-usr-01", "officer_name": "Ragini", "officer_role": "regional_officer", "remarks": "scrutiny", "stage_name": "Scrutiny"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 500
    assert "No Supabase JWT verification method configured" in res.json()["detail"]
