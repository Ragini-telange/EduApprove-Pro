export type DeadlineType = 'upcoming' | 'due_today' | 'overdue' | 'completed' | 'on_hold';

export interface DeadlineIndicatorResult {
  type: DeadlineType;
  label: string;
  daysDiff: number;
  badgeClass: string;
  accessibleText: string;
}

export interface DocumentExpiryResult {
  hasExpiry: boolean;
  isExpired: boolean;
  isApproachingExpiry: boolean;
  daysRemaining: number | null;
  label: string;
  badgeClass: string;
  accessibleText: string;
}

const EVALUATION_DATE = '2026-10-22'; // Regulatory reference date for deterministic testing

export function calculateDeadlineDaysRemaining(deadlineDateStr: string): {
  daysRemaining: number;
  isOverdue: boolean;
  severity: 'normal' | 'warning' | 'critical';
  label: string;
  accessibleText: string;
} {
  const deadline = new Date(deadlineDateStr).getTime();
  const today = new Date(EVALUATION_DATE).getTime();
  const diffTime = deadline - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      daysRemaining,
      isOverdue: true,
      severity: 'critical',
      label: `${overdueDays}d Overdue`,
      accessibleText: `Deadline Status: Overdue by ${overdueDays} calendar days. Immediate statutory escalation required.`,
    };
  }

  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      isOverdue: false,
      severity: 'critical',
      label: 'Due Today',
      accessibleText: 'Deadline Status: Due today by end of regulatory day.',
    };
  }

  if (daysRemaining <= 3) {
    return {
      daysRemaining,
      isOverdue: false,
      severity: 'critical',
      label: `${daysRemaining}d Left (Urgent)`,
      accessibleText: `Deadline Status: Critical urgency. ${daysRemaining} days remaining before statutory expiry.`,
    };
  }

  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      isOverdue: false,
      severity: 'warning',
      label: `${daysRemaining}d Left`,
      accessibleText: `Deadline Status: Approaching deadline. ${daysRemaining} days remaining.`,
    };
  }

  return {
    daysRemaining,
    isOverdue: false,
    severity: 'normal',
    label: `${daysRemaining}d Left`,
    accessibleText: `Deadline Status: Normal window. ${daysRemaining} days remaining.`,
  };
}

export function getDeadlineIndicator(
  deadlineDateStr: string,
  isCompleted: boolean = false,
  isOnHold: boolean = false
): DeadlineIndicatorResult {
  if (isCompleted) {
    return {
      type: 'completed',
      label: 'Completed',
      daysDiff: 0,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      accessibleText: 'Task status: Completed and verified.',
    };
  }

  if (isOnHold) {
    return {
      type: 'on_hold',
      label: 'On Hold (Legal/Hearing)',
      daysDiff: 0,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      accessibleText: 'Task status: On hold pending judicial or standing hearing determination.',
    };
  }

  const deadline = new Date(deadlineDateStr).getTime();
  const today = new Date(EVALUATION_DATE).getTime();
  const diffTime = deadline - today;
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      type: 'overdue',
      label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
      daysDiff,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      accessibleText: `Deadline status: Overdue by ${overdueDays} calendar day${overdueDays === 1 ? '' : 's'}.`,
    };
  }

  if (daysDiff === 0) {
    return {
      type: 'due_today',
      label: 'Due Today',
      daysDiff: 0,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
      accessibleText: 'Deadline status: Due today. Final submission window expires midnight.',
    };
  }

  return {
    type: 'upcoming',
    label: `Upcoming (${daysDiff}d remaining)`,
    daysDiff,
    badgeClass: daysDiff <= 7 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-blue-50 text-blue-800 border-blue-200',
    accessibleText: `Deadline status: Upcoming with ${daysDiff} days remaining.`,
  };
}

export function calculateDocumentExpiry(
  expiryDateStr?: string | null,
  thresholdDays: number = 30
): DocumentExpiryResult {
  // CRITICAL: Do NOT infer an expiry date when the source record lacks one!
  if (!expiryDateStr || expiryDateStr.trim() === '') {
    return {
      hasExpiry: false,
      isExpired: false,
      isApproachingExpiry: false,
      daysRemaining: null,
      label: 'No Statutory Expiry Date',
      badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
      accessibleText: 'Document Validity: No specific certificate expiry date recorded or applicable.',
    };
  }

  const expiry = new Date(expiryDateStr).getTime();
  const today = new Date(EVALUATION_DATE).getTime();
  const diffTime = expiry - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      hasExpiry: true,
      isExpired: true,
      isApproachingExpiry: false,
      daysRemaining,
      label: `Expired (${overdueDays}d ago on ${expiryDateStr})`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      accessibleText: `Certificate Expiry: Validity expired ${overdueDays} days ago on ${expiryDateStr}. Renewal submission mandatory.`,
    };
  }

  if (daysRemaining <= thresholdDays) {
    return {
      hasExpiry: true,
      isExpired: false,
      isApproachingExpiry: true,
      daysRemaining,
      label: `Expires in ${daysRemaining}d (${expiryDateStr})`,
      badgeClass: daysRemaining <= 7
        ? 'bg-rose-50 text-rose-800 border-rose-200 font-semibold'
        : 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      accessibleText: `Certificate Expiry: Approaching validity limit. ${daysRemaining} days remaining until expiry on ${expiryDateStr}.`,
    };
  }

  return {
    hasExpiry: true,
    isExpired: false,
    isApproachingExpiry: false,
    daysRemaining,
    label: `Valid until ${expiryDateStr} (${daysRemaining}d)`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accessibleText: `Certificate Expiry: Valid. Expires on ${expiryDateStr} (${daysRemaining} calendar days remaining).`,
  };
}
