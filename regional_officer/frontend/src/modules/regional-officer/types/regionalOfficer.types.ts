// ============================================================================
// EDUAPPROVE PRO - REGIONAL OFFICER SHARED TYPES & CONTRACTS
// ============================================================================

export type UserRole = 'regional_officer' | 'institution_admin' | 'senior_authority' | 'super_admin';

export interface RegionalOfficerProfile {
  id: string;
  name: string;
  email: string;
  role: 'regional_officer';
  designation: string;
  regionalOffice: string; // e.g., "Western Regional Office (WRO - Pune)"
  jurisdictionStates: string[]; // e.g., ["Maharashtra", "Goa", "Gujarat"]
  badgeNumber: string;
  deskNumber: string;
  phone?: string;
}

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

export interface InstitutionSummary {
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
  applicationNumber: string;
  institutionId: string;
  institution: InstitutionSummary;
  type: ApplicationType;
  academicYear: string;
  status: ApplicationStatus;
  priority: PriorityLevel;
  submittedAt: string;
  updatedAt: string;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  deadlineDate: string;
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
  code: string;
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
  normReference: string;
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

export interface Deficiency {
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
  deficiencies: Deficiency[];
  statutoryInstructions: string;
}

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

export interface EVCVisit {
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

export type ComplianceStatus = 'pending' | 'submitted' | 'verified' | 'correction_required' | 'overdue';

export interface ComplianceRequirement {
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
  documentExpiryDate?: string;
  isRenewalDueSoon: boolean;
  escalationLevel: 'none' | 'warning' | 'critical_overdue';
  officerRemarks?: string;
}

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
  statutoryDisclaimer: string;
}

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

export interface Notification {
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
  action: string;
  timestamp: string;
  affectedRecord: string;
  previousState?: string;
  newState: string;
  remarks: string;
  ipAddress?: string;
  source?: AuditEventSource;
  origin?: AuditEventOrigin;
}

// ----------------------------------------------------------------------------
// PHASE 7: AI-ASSISTED DOCUMENT INTELLIGENCE
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
  evidenceQuote?: string;
  sourcePage?: number;
  pageReference?: string;
  confidenceScore: number;
  confidenceLabel?: string;
  suggestedAction: string;
  suggestedFollowUp?: string;
  status: 'pending_review' | 'confirmed_by_officer' | 'dismissed_by_officer';
  reviewState?: FindingReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  officerFeedback?: string;
  relevantChecklistCode?: string;
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

