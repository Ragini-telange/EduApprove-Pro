// ============================================================================
// EDUAPPROVE PRO - SHARED DOMAIN CONTRACTS & TYPES
// AICTE Regulatory Approval Platform
// ============================================================================

export type UserRole = 'regional_officer' | 'institution_admin' | 'senior_authority' | 'super_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  regionalOffice: string; // e.g. "Western Regional Office (WRO - Pune)"
  jurisdictionStates: string[]; // e.g. ["Maharashtra", "Goa"]
  badgeNumber?: string;
  avatarUrl?: string;
}

// ----------------------------------------------------------------------------
// APPLICATION STATUS VOCABULARY (STRICT WORKFLOW - NO ARBITRARY TRANSITIONS)
// ----------------------------------------------------------------------------
export type ApplicationStatus =
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

export type ApplicationType =
  | 'new_institution'
  | 'extension_of_approval'
  | 'increase_in_intake'
  | 'closure_of_course'
  | 'change_of_site'
  | 'conversion_of_women_inst';

export type PriorityLevel = 'normal' | 'urgent' | 'critical';

export interface Institution {
  id: string;
  aictePermanentId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  regionalOffice: string;
  institutionType: 'Govt' | 'Govt-Aided' | 'Private-Unaided' | 'University-Dept';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  establishedYear: number;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. "AICTE/WRO/2026-27/08492"
  institutionId: string;
  institution: Institution;
  type: ApplicationType;
  academicYear: string; // e.g. "2026-2027"
  status: ApplicationStatus;
  priority: PriorityLevel;
  submittedAt: string;
  updatedAt: string;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  deadlineDate: string; // Statutory scrutiny deadline
  deficiencyCount: number;
  evcRequired: boolean;
  evcVisitId?: string | null;
  reScrutinyCount: number;
  remarksHistory: ScrutinyRemark[];
}

export interface ScrutinyRemark {
  id: string;
  officerId: string;
  officerName: string;
  timestamp: string;
  statusFrom: ApplicationStatus;
  statusTo: ApplicationStatus;
  stage: string;
  remarks: string;
}

// ----------------------------------------------------------------------------
// DOCUMENT SCRUTINY & CHECKLIST MODELS
// ----------------------------------------------------------------------------
export type DocumentVerificationStatus = 'pending' | 'verified' | 'correction_required' | 'rejected';

export interface DocumentVersionHistory {
  version: number;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy?: string;
  storagePath: string;
  status: DocumentVerificationStatus;
  observations?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  diffSummary?: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  name: string;
  category: 'Land & Building' | 'Faculty & HR' | 'Financial & Society' | 'Affiliation & Approvals' | 'Safety & Compliance';
  code: string; // e.g. "DOC-LND-01"
  fileName: string;
  fileSize: string;
  fileType: string;
  version: number;
  uploadedAt: string;
  storagePath: string;
  previewUrl?: string;
  status: DocumentVerificationStatus;
  observations?: string;
  deficiencyReason?: string;
  deficiencyRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  ocrExtractedText?: string;
  aiScrutinySummary?: string;
  // Phase 4 Extensions
  issueDate?: string;
  expiryDate?: string;
  isUpdatedInResubmission?: boolean;
  previousVersionRemarks?: string;
  versions?: DocumentVersionHistory[];
}

export type ChecklistComplianceStatus = 'pending' | 'compliant' | 'non_compliant' | 'not_applicable';

export interface ScrutinyChecklistItem {
  id: string;
  applicationId: string;
  category: string;
  code: string;
  title: string;
  requirementText: string;
  normReference: string; // e.g. "AICTE APH 2026-27 Clause 4.2"
  status: ChecklistComplianceStatus;
  officerNotes?: string;
  associatedDocCodes: string[];
  aiSuggestedStatus?: ChecklistComplianceStatus;
  aiSuggestedReason?: string;
  aiConfidence?: number;
  // Phase 4 Extensions
  applicationType?: ApplicationType;
  supportingEvidence?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  previousReviewStatus?: ChecklistComplianceStatus;
  previousReviewRemarks?: string;
}

export type DeficiencyResolutionStatus = 'resolved' | 'still_outstanding' | 'requires_further_review';

export interface ScrutinyDeficiency {
  id: string;
  applicationId: string;
  documentId?: string;
  documentName?: string;
  checklistItemId?: string;
  category: string;
  clauseReference: string;
  severity: 'minor' | 'major' | 'fatal';
  deficiencyTitle: string;
  detailedReason: string;
  remedialActionRequired: string;
  rectificationDeadline: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionRemarks?: string;
  createdAt: string;
  // Phase 4 Extensions
  status?: 'draft' | 'issued' | 'resolved' | 'outstanding' | 'further_review';
  resolutionStatus?: DeficiencyResolutionStatus;
  isDraft?: boolean;
  reScrutinyCycle?: number;
}

export interface CorrectionNotice {
  noticeNumber: string;
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  issuedAt: string;
  rectificationDeadline: string;
  issuedByOfficer: string;
  regionalOffice: string;
  deficiencies: ScrutinyDeficiency[];
  statutoryInstructions: string;
}

// ----------------------------------------------------------------------------
// AI-ASSISTED SCRUTINY (ASSISTIVE ONLY - NOT AUTONOMOUS)
// ----------------------------------------------------------------------------
export type AISuggestionType =
  | 'missing_field'
  | 'metadata_mismatch'
  | 'unreadable_scan'
  | 'norm_non_compliance'
  | 'deficiency_draft';

export type FindingReviewStatus = 'pending_review' | 'confirmed' | 'edited' | 'dismissed';

export interface AIScrutinySuggestion {
  id: string;
  applicationId: string;
  documentId?: string;
  documentName?: string;
  type: AISuggestionType;
  title: string;
  summary: string;
  evidenceQuote?: string; // Text extracted from document supporting this observation
  sourcePage?: number;
  pageReference?: string; // e.g. "Page 2, Schedule A"
  confidenceScore: number; // 0.0 to 1.0
  confidenceLabel?: string; // e.g. "High Confidence (88%)" or "Uncertain / Low Quality (42%)"
  suggestedAction: string;
  suggestedFollowUp?: string;
  status: 'pending_review' | 'confirmed_by_officer' | 'dismissed_by_officer';
  reviewState?: FindingReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  officerFeedback?: string;
  // Phase 7 Extensions
  relevantChecklistCode?: string; // e.g. "CHK-NEW-01"
  relevantChecklistTitle?: string;
  supportingExtractedText?: string;
  isMachineGenerated: boolean;
  editedTitle?: string;
  editedSummary?: string;
}

export interface OCREngineInfo {
  isAvailable: boolean;
  engineName: string;
  installedBinary?: string | null;
  statusCode: 'available' | 'unavailable';
  message: string;
  setupInstructions: string;
}

export interface DocumentIntelligenceResult {
  documentId: string;
  documentName: string;
  engineStatus: OCREngineInfo;
  analysisTimestamp: string;
  extractedTextSnippet?: string;
  findings: AIScrutinySuggestion[];
  isSimulatedSandbox: boolean;
}


// ----------------------------------------------------------------------------
// EVC (EXPERT VISIT COMMITTEE) TRACKING
// ----------------------------------------------------------------------------
export type EVCStatus =
  | 'not_required'
  | 'required'
  | 'pending_scheduling'
  | 'scheduled'
  | 'evc_scheduled'
  | 'visit_completed'
  | 'completed'
  | 'report_submitted'
  | 'cancelled';

export interface EVCExpert {
  id: string;
  name: string;
  designation: string;
  institution: string;
  specialization: string;
  role: 'Chairman' | 'Member' | 'Architect' | 'Regional Officer Representative';
}

export interface EVCRecord {
  id: string;
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  visitType: 'Regular Verification' | 'Surprise / Unannounced Visit' | 'Deficiency Re-inspection';
  status: EVCStatus;
  tentativeDate?: string;
  confirmedDate?: string;
  isUnannounced: boolean;
  leadOfficerId: string;
  leadOfficerName: string;
  committeeMembers: EVCExpert[];
  visitTerms: string;
  reportSubmittedAt?: string;
  reportSummary?: string;
  outcomeRecommendation?: 'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended';
  reportStorageUrl?: string;
  discloseToInstitution: boolean;
}

// ----------------------------------------------------------------------------
// COMPLIANCE MONITORING & UNDERTAKINGS
// ----------------------------------------------------------------------------
export type ComplianceStatus = 'pending' | 'submitted' | 'verified' | 'correction_required' | 'overdue';

export interface ComplianceItem {
  id: string;
  institutionId: string;
  institutionName: string;
  applicationId?: string;
  title: string;
  clause: string;
  description: string;
  mandatoryDocumentRequired: boolean;
  dueDate: string;
  status: ComplianceStatus;
  submittedDocumentName?: string;
  submittedDocumentUrl?: string;
  submittedAt?: string;
  documentExpiryDate?: string; // E.g. Building Stability Certificate or Fire NOC expiry
  isRenewalDueSoon: boolean;
  escalationLevel: 'none' | 'warning' | 'critical_overdue';
  officerRemarks?: string;
}

// ----------------------------------------------------------------------------
// LATE SUBMISSION & RE-APPLICATION REQUESTS
// ----------------------------------------------------------------------------
export type LateRequestStatus = 'pending_review' | 'accepted_for_processing' | 'not_accepted' | 'more_info_required';

export interface LateSubmissionRequest {
  id: string;
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  requestType: 'Late Submission Permission' | 'Condonation of Scrutiny Delay' | 'Emergency Re-application';
  reasonCategory: 'Natural Calamity' | 'Technical Gateway Failure' | 'Administrative Exigency' | 'Judicial Order';
  detailedReason: string;
  supportingDocName?: string;
  supportingDocUrl?: string;
  requestedAt: string;
  status: LateRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
  statutoryDisclaimer: string; // "Accepting for processing does not grant an official exemption or waiver to AICTE Approval Process Handbook norms."
}

// ----------------------------------------------------------------------------
// IN-APP NOTIFICATIONS & ALERTS
// ----------------------------------------------------------------------------
export type NotificationCategory =
  | 'deadline'
  | 'overdue'
  | 'assignment'
  | 'resubmission'
  | 'evc_report'
  | 'compliance'
  | 'document_expiry'
  | 'late_request'
  | 'escalation';

export type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';

export interface AppNotification {
  id: string;
  recipientRole: UserRole;
  recipientId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: AlertSeverity;
  applicationId?: string;
  applicationNumber?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ----------------------------------------------------------------------------
// ESCALATION MANAGEMENT & WATCHLIST (PHASE 6)
// ----------------------------------------------------------------------------
export type EscalationTriggerType =
  | 'overdue_deadline'
  | 'long_running_scrutiny'
  | 'repeated_correction_cycles'
  | 'missing_evc_report'
  | 'compliance_delay';

export interface EscalationItem {
  id: string;
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  triggerType: EscalationTriggerType;
  title: string;
  description: string;
  basisExplanation: string;
  severity: 'warning' | 'urgent' | 'critical';
  thresholdDaysApplied: number;
  elapsedDays: number;
  deadlineDate?: string;
  actionUrl: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  officerNotes?: string;
}

// ----------------------------------------------------------------------------
// IMMUTABLE AUDIT TRAIL
// ----------------------------------------------------------------------------
export type AuditEventSource =
  | 'REGIONAL_OFFICER_PORTAL'
  | 'SYSTEM_ENGINE'
  | 'INSTITUTION_PORTAL'
  | 'EVC_COMMITTEE'
  | 'BUREAU_API';

export type AuditEventOrigin = 'official_regulatory' | 'simulated_demo';

export interface AuditEvent {
  id: string;
  applicationId: string;
  applicationNumber: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string; // e.g. "DOCUMENT_SCRUTINY_DECISION", "STATUS_TRANSITION", "CORRECTION_REQUESTED"
  timestamp: string;
  affectedRecord: string;
  previousState?: string;
  newState: string;
  remarks: string;
  ipAddress?: string;
  source?: AuditEventSource;
  origin?: AuditEventOrigin;
}
