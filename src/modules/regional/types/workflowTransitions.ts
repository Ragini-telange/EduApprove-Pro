import { ApplicationStatus, UserRole } from './index';

export interface TransitionRule {
  targetStatus: ApplicationStatus;
  allowedRoles: UserRole[];
  label: string;
  description: string;
  requiresRemarks: boolean;
  requiresDeficiencyValidation?: boolean;
  requiresEVCValidation?: boolean;
}

export const LEGAL_TRANSITIONS: Record<ApplicationStatus, TransitionRule[]> = {
  draft: [
    {
      targetStatus: 'submitted',
      allowedRoles: ['institution_admin', 'super_admin'],
      label: 'Submit Application',
      description: 'Submit institutional application for AICTE scrutiny.',
      requiresRemarks: false,
    },
    {
      targetStatus: 'withdrawn',
      allowedRoles: ['institution_admin', 'super_admin'],
      label: 'Withdraw Application',
      description: 'Withdraw draft application prior to scrutiny.',
      requiresRemarks: true,
    },
  ],
  submitted: [
    {
      targetStatus: 'under_scrutiny',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Commence Scrutiny',
      description: 'Regional Officer formally opens application and begins document scrutiny.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'withdrawn',
      allowedRoles: ['institution_admin', 'super_admin'],
      label: 'Withdraw Application',
      description: 'Formal request to withdraw submitted application.',
      requiresRemarks: true,
    },
  ],
  under_scrutiny: [
    {
      targetStatus: 'correction_required',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Request Corrections',
      description: 'Deficiencies recorded. Return application to institution with itemized correction list.',
      requiresRemarks: true,
      requiresDeficiencyValidation: true,
    },
    {
      targetStatus: 'pending_evc',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Recommend EVC Physical Visit',
      description: 'Documents verified; site or laboratory infrastructure requires physical Expert Visit Committee inspection.',
      requiresRemarks: true,
      requiresEVCValidation: true,
    },
    {
      targetStatus: 'under_next_stage',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Recommend for Bureau Decision',
      description: 'Scrutiny clear; handoff case to AICTE Senior Authority / Bureau for approval determination.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'rejected',
      allowedRoles: ['senior_authority', 'super_admin'],
      label: 'Reject Application',
      description: 'Authoritative statutory rejection following hearing or irreparable non-compliance.',
      requiresRemarks: true,
    },
  ],
  correction_required: [
    {
      targetStatus: 'resubmitted',
      allowedRoles: ['institution_admin', 'super_admin'],
      label: 'Resubmit with Corrections',
      description: 'Institution uploads revised documents and compliance responses.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'withdrawn',
      allowedRoles: ['institution_admin', 'super_admin'],
      label: 'Withdraw Application',
      description: 'Institution withdraws instead of rectifying deficiencies.',
      requiresRemarks: true,
    },
  ],
  resubmitted: [
    {
      targetStatus: 'under_re_scrutiny',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Commence Re-Scrutiny',
      description: 'Regional Officer begins re-scrutiny of rectified documents and institution undertakings.',
      requiresRemarks: true,
    },
  ],
  under_re_scrutiny: [
    {
      targetStatus: 'correction_required',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Request Second Correction',
      description: 'Deficiencies still unrectified; provide final correction window within regulatory norms.',
      requiresRemarks: true,
      requiresDeficiencyValidation: true,
    },
    {
      targetStatus: 'pending_evc',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Recommend EVC Inspection',
      description: 'Re-scrutiny completed; site verification required before approval.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'under_next_stage',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Recommend for Bureau Decision',
      description: 'Re-scrutiny fully compliant; hand off to Senior Authority.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'rejected',
      allowedRoles: ['senior_authority', 'super_admin'],
      label: 'Reject Application',
      description: 'Statutory rejection after failure of re-scrutiny.',
      requiresRemarks: true,
    },
  ],
  pending_evc: [
    {
      targetStatus: 'evc_scheduled',
      allowedRoles: ['regional_officer', 'senior_authority', 'super_admin'],
      label: 'Confirm EVC Schedule',
      description: 'Appoint expert committee and schedule visit date.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'under_next_stage',
      allowedRoles: ['regional_officer', 'senior_authority', 'super_admin'],
      label: 'Waive EVC (Policy Concession)',
      description: 'EVC exempted as per AICTE handbook relaxation norms.',
      requiresRemarks: true,
    },
  ],
  evc_scheduled: [
    {
      targetStatus: 'under_next_stage',
      allowedRoles: ['regional_officer', 'senior_authority', 'super_admin'],
      label: 'Submit EVC Report & Handoff',
      description: 'EVC report completed and submitted; handoff to Bureau.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'correction_required',
      allowedRoles: ['regional_officer', 'super_admin'],
      label: 'Issue Deficiency from EVC Findings',
      description: 'Expert committee noted specific rectifyable infrastructure deficiencies.',
      requiresRemarks: true,
      requiresDeficiencyValidation: true,
    },
  ],
  under_next_stage: [
    {
      targetStatus: 'completed',
      allowedRoles: ['senior_authority', 'super_admin'],
      label: 'Grant Approval (Issue Letter)',
      description: 'Senior Authority issues official AICTE Approval / Extension of Approval letter.',
      requiresRemarks: true,
    },
    {
      targetStatus: 'rejected',
      allowedRoles: ['senior_authority', 'super_admin'],
      label: 'Reject Application',
      description: 'Executive committee / Standing Hearing Committee rejects application.',
      requiresRemarks: true,
    },
  ],
  completed: [],
  rejected: [],
  withdrawn: [],
};

export function canTransitionStatus(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  userRole: UserRole
): { allowed: boolean; reason?: string } {
  const allowedRules = LEGAL_TRANSITIONS[currentStatus] || [];
  const rule = allowedRules.find((r) => r.targetStatus === targetStatus);

  if (!rule) {
    return {
      allowed: false,
      reason: `Direct transition from '${currentStatus}' to '${targetStatus}' is prohibited by AICTE workflow rules.`,
    };
  }

  if (!rule.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' is not authorised to execute transition to '${targetStatus}'. Authorized roles: ${rule.allowedRoles.join(', ')}.`,
    };
  }

  return { allowed: true };
}

export function getAvailableTransitions(
  currentStatus: ApplicationStatus,
  userRole: UserRole
): TransitionRule[] {
  const rules = LEGAL_TRANSITIONS[currentStatus] || [];
  return rules.filter((r) => r.allowedRoles.includes(userRole));
}

export function getStatusBadgeConfig(status: ApplicationStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Draft', bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderClass: 'border-slate-300' };
    case 'submitted':
      return { label: 'Submitted', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-300' };
    case 'under_scrutiny':
      return { label: 'Under Scrutiny', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700', borderClass: 'border-indigo-300' };
    case 'correction_required':
      return { label: 'Correction Required', bgClass: 'bg-amber-50', textClass: 'text-amber-800', borderClass: 'border-amber-300' };
    case 'resubmitted':
      return { label: 'Resubmitted', bgClass: 'bg-cyan-50', textClass: 'text-cyan-700', borderClass: 'border-cyan-300' };
    case 'under_re_scrutiny':
      return { label: 'Under Re-Scrutiny', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-300' };
    case 'pending_evc':
      return { label: 'Pending EVC', bgClass: 'bg-orange-50', textClass: 'text-orange-700', borderClass: 'border-orange-300' };
    case 'evc_scheduled':
      return { label: 'EVC Scheduled', bgClass: 'bg-teal-50', textClass: 'text-teal-700', borderClass: 'border-teal-300' };
    case 'under_next_stage':
      return { label: 'Under Bureau Review', bgClass: 'bg-sky-50', textClass: 'text-sky-800', borderClass: 'border-sky-300' };
    case 'completed':
      return { label: 'Approved / Completed', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-emerald-300' };
    case 'rejected':
      return { label: 'Rejected', bgClass: 'bg-rose-50', textClass: 'text-rose-700', borderClass: 'border-rose-300' };
    case 'withdrawn':
      return { label: 'Withdrawn', bgClass: 'bg-gray-100', textClass: 'text-gray-500', borderClass: 'border-gray-300' };
    default:
      return { label: status, bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderClass: 'border-slate-300' };
  }
}
