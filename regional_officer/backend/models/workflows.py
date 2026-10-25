from typing import Dict, List, Tuple
from .domain import ApplicationStatus, UserRole

# Strict legal transitions matching regulatory specifications
LEGAL_TRANSITIONS: Dict[ApplicationStatus, Dict[ApplicationStatus, List[UserRole]]] = {
    ApplicationStatus.DRAFT: {
        ApplicationStatus.SUBMITTED: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
        ApplicationStatus.WITHDRAWN: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.SUBMITTED: {
        ApplicationStatus.UNDER_SCRUTINY: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.WITHDRAWN: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.UNDER_SCRUTINY: {
        ApplicationStatus.CORRECTION_REQUIRED: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.PENDING_EVC: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.UNDER_NEXT_STAGE: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.REJECTED: [UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.CORRECTION_REQUIRED: {
        ApplicationStatus.RESUBMITTED: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
        ApplicationStatus.WITHDRAWN: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.RESUBMITTED: {
        ApplicationStatus.UNDER_RE_SCRUTINY: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.UNDER_RE_SCRUTINY: {
        ApplicationStatus.CORRECTION_REQUIRED: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.PENDING_EVC: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.UNDER_NEXT_STAGE: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
        ApplicationStatus.REJECTED: [UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.PENDING_EVC: {
        ApplicationStatus.EVC_SCHEDULED: [UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
        ApplicationStatus.UNDER_NEXT_STAGE: [UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.EVC_SCHEDULED: {
        ApplicationStatus.UNDER_NEXT_STAGE: [UserRole.REGIONAL_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
        ApplicationStatus.CORRECTION_REQUIRED: [UserRole.REGIONAL_OFFICER, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.UNDER_NEXT_STAGE: {
        ApplicationStatus.COMPLETED: [UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
        ApplicationStatus.REJECTED: [UserRole.SENIOR_AUTHORITY, UserRole.SUPER_ADMIN],
    },
    ApplicationStatus.COMPLETED: {},
    ApplicationStatus.REJECTED: {},
    ApplicationStatus.WITHDRAWN: {},
}

def validate_transition(
    current_status: ApplicationStatus,
    target_status: ApplicationStatus,
    role: UserRole
) -> Tuple[bool, str]:
    if current_status not in LEGAL_TRANSITIONS:
        return False, f"Unknown current status: {current_status}"

    allowed_targets = LEGAL_TRANSITIONS[current_status]
    if target_status not in allowed_targets:
        return False, f"Illegal transition from '{current_status.value}' to '{target_status.value}' prohibited by AICTE norms."

    allowed_roles = allowed_targets[target_status]
    if role not in allowed_roles:
        allowed_str = ", ".join([r.value for r in allowed_roles])
        return False, f"Role '{role.value}' is not authorised to execute transition to '{target_status.value}'. Required roles: {allowed_str}."

    return True, "Valid transition."
