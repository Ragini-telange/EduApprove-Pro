import pytest
from models.domain import ApplicationStatus, UserRole
from models.workflows import validate_transition

def test_legal_scrutiny_commencement():
    allowed, msg = validate_transition(
        current_status=ApplicationStatus.SUBMITTED,
        target_status=ApplicationStatus.UNDER_SCRUTINY,
        role=UserRole.REGIONAL_OFFICER,
    )
    assert allowed is True
    assert msg == "Valid transition."

def test_illegal_arbitrary_transition():
    allowed, msg = validate_transition(
        current_status=ApplicationStatus.SUBMITTED,
        target_status=ApplicationStatus.COMPLETED,
        role=UserRole.REGIONAL_OFFICER,
    )
    assert allowed is False
    assert "Illegal transition" in msg

def test_unauthorized_role_transition():
    allowed, msg = validate_transition(
        current_status=ApplicationStatus.UNDER_SCRUTINY,
        target_status=ApplicationStatus.UNDER_NEXT_STAGE,
        role=UserRole.INSTITUTION_ADMIN,
    )
    assert allowed is False
    assert "not authorised" in msg

def test_rejection_requires_senior_authority():
    allowed_ro, _ = validate_transition(
        current_status=ApplicationStatus.UNDER_SCRUTINY,
        target_status=ApplicationStatus.REJECTED,
        role=UserRole.REGIONAL_OFFICER,
    )
    assert allowed_ro is False

    allowed_hq, msg_hq = validate_transition(
        current_status=ApplicationStatus.UNDER_SCRUTINY,
        target_status=ApplicationStatus.REJECTED,
        role=UserRole.SENIOR_AUTHORITY,
    )
    assert allowed_hq is True
