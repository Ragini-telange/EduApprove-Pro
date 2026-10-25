// ============================================================================
// AICTE SMARTASSIST — CANONICAL DATA MODEL
// Unifies database structures across Institution Admin, Regional Officer, and Senior Authority
// ============================================================================

export type CanonicalApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_scrutiny'
  | 'correction_required'
  | 'resubmitted'
  | 'under_re_scrutiny'
  | 'pending_evc'
  | 'evc_scheduled'
  | 'under_next_stage'
  | 'completed'
  | 'rejected'
  | 'withdrawn';

export type CanonicalPriorityLevel = 'normal' | 'urgent' | 'critical';

export interface CanonicalInstitution {
  id: string; // UUID in Supabase
  aictePermanentId: string; // e.g. "AICTE-INS-10245" or "1-4293811"
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  regionalOffice: string;
  institutionType: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  establishedYear: number;
}

export interface CanonicalApplication {
  id: string;
  applicationNumber: string;
  institutionId: string;
  institutionName: string;
  instituteCode: string;
  region: string;
  state: string;
  type: string;
  typeLabel: string;
  academicYear: string;
  status: CanonicalApplicationStatus;
  statusLabel: string;
  currentStage: string;
  priority: CanonicalPriorityLevel;
  submittedAt: string;
  updatedAt: string;
  deadlineDate: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  deficiencyCount: number;
  evcRequired: boolean;
  evcStatus: string;
  complianceStatus: string;
  daysInStage?: number;
  isEscalated?: boolean;
}

export interface CanonicalDocument {
  id: string;
  applicationId: string;
  name: string;
  category: string;
  code: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  version: number;
  storagePath: string;
  previewUrl?: string;
  status: 'pending' | 'verified' | 'rejected' | 'correction_required';
  observations?: string;
  deficiencyReason?: string;
  deficiencyRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedAt: string;
  isUpdatedInResubmission?: boolean;
}

export interface CanonicalComplianceRequirement {
  id: string;
  institutionId: string;
  applicationId?: string;
  title: string;
  clause: string;
  description: string;
  mandatoryDocumentRequired: boolean;
  dueDate: string;
  status: 'pending' | 'submitted' | 'verified' | 'overdue' | 'escalated';
  submittedDocumentName?: string;
  submittedDocumentUrl?: string;
  submittedAt?: string;
  documentExpiryDate?: string;
  isRenewalDueSoon: boolean;
  escalationLevel: 'none' | 'warning' | 'critical_overdue';
  officerRemarks?: string;
}

export interface CanonicalEVCVisit {
  id: string;
  applicationId: string;
  applicationNumber?: string;
  institutionName?: string;
  visitType: string;
  status: string;
  tentativeDate?: string;
  confirmedDate?: string;
  isUnannounced: boolean;
  leadOfficerId?: string;
  leadOfficerName: string;
  committeeMembers: Array<{ name: string; role: string; organization?: string }>;
  reportSummary?: string;
  outcomeRecommendation?: string;
  reportStorageUrl?: string;
}

export interface CanonicalNotification {
  id: string;
  recipientRole: string;
  recipientId?: string;
  title: string;
  message: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  applicationId?: string;
  applicationNumber?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface CanonicalAuditEntry {
  id: string;
  applicationId: string;
  applicationNumber: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  timestamp: string;
  affectedRecord: string;
  previousState?: string;
  newState: string;
  remarks: string;
}
