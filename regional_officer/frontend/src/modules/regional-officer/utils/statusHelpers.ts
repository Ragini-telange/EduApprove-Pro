import { ApplicationStatus } from '../types';

export function formatApplicationStatus(status: ApplicationStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'submitted': return 'Submitted (Pending Scrutiny)';
    case 'under_scrutiny': return 'Under Scrutiny';
    case 'correction_required': return 'Correction Required';
    case 'resubmitted': return 'Resubmitted (Pending Re-Scrutiny)';
    case 'under_re_scrutiny': return 'Under Re-Scrutiny';
    case 'pending_evc': return 'Pending EVC Inspection';
    case 'evc_scheduled': return 'EVC Scheduled';
    case 'under_next_stage': return 'Under Bureau Review';
    case 'completed': return 'Approved / Completed';
    case 'rejected': return 'Rejected';
    case 'withdrawn': return 'Withdrawn';
    default: return status;
  }
}

export function getStatusColorClass(status: ApplicationStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'submitted':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'under_scrutiny':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'correction_required':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'resubmitted':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    case 'under_re_scrutiny':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'pending_evc':
    case 'evc_scheduled':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    case 'completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
