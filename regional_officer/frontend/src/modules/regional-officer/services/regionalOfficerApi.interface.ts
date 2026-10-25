import {
  Application,
  ApplicationDocument,
  ScrutinyChecklistItem,
  Deficiency,
  EVCVisit,
  ComplianceRequirement,
  LateSubmissionRequest,
  Notification,
  AuditEvent,
  ApplicationStatus,
  DocumentVerificationStatus,
  ChecklistComplianceStatus,
  UserRole,
  DeficiencyResolutionStatus,
  CorrectionNotice,
  OCREngineInfo,
  DocumentIntelligenceResult,
  AIScrutinySuggestion,
} from '../types';

export interface ApplicationFilterOptions {
  status?: ApplicationStatus;
  type?: string;
  search?: string;
  priority?: string;
  jurisdiction?: string;
  assignedOfficerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'deadline_asc' | 'deadline_desc' | 'submitted_desc' | 'app_number' | 'institution_asc';
  page?: number;
  pageSize?: number;
  officerJurisdictions?: string[];
}

export interface TransitionActionPayload {
  applicationId: string;
  targetStatus: ApplicationStatus;
  officerId: string;
  officerName: string;
  officerRole: UserRole;
  remarks: string;
  stageName: string;
}

export interface DocumentVerificationActionPayload {
  documentId: string;
  applicationId: string;
  status: DocumentVerificationStatus;
  observations: string;
  deficiencyReason?: string;
  deficiencyRemarks?: string;
  officerName: string;
}

export interface DeficiencyCreateActionPayload {
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
  officerName: string;
  isDraft?: boolean;
}

export interface IRegionalOfficerDataService {
  getProviderStatus(): {
    isMock: boolean;
    providerName: string;
    description: string;
  };

  // Applications
  getApplications(filters?: ApplicationFilterOptions): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | null>;
  executeWorkflowTransition(payload: TransitionActionPayload): Promise<{
    success: boolean;
    application: Application;
    error?: string;
  }>;

  // Documents & Scrutiny
  getDocuments(applicationId: string): Promise<ApplicationDocument[]>;
  verifyDocument(payload: DocumentVerificationActionPayload): Promise<{
    success: boolean;
    document: ApplicationDocument;
    error?: string;
  }>;

  // Checklists & Deficiencies
  getChecklist(applicationId: string): Promise<ScrutinyChecklistItem[]>;
  updateChecklistStatus(itemId: string, status: ChecklistComplianceStatus, officerNotes: string): Promise<{
    success: boolean;
    item: ScrutinyChecklistItem;
  }>;
  getDeficiencies(applicationId: string): Promise<Deficiency[]>;
  recordDeficiency(payload: DeficiencyCreateActionPayload): Promise<{
    success: boolean;
    deficiency: Deficiency;
  }>;
  saveDraftDeficiency(payload: DeficiencyCreateActionPayload): Promise<{
    success: boolean;
    deficiency: Deficiency;
  }>;
  deleteDeficiency(deficiencyId: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  submitCorrectionRequest(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string,
    rectificationDeadline: string
  ): Promise<{
    success: boolean;
    notice: CorrectionNotice;
    error?: string;
  }>;
  updateDeficiencyResolution(
    deficiencyId: string,
    resolutionStatus: DeficiencyResolutionStatus,
    resolutionRemarks: string,
    officerName: string
  ): Promise<{
    success: boolean;
    deficiency: Deficiency;
    error?: string;
  }>;

  // AI Scrutiny & Document Intelligence (Phase 7)
  getAISuggestions(applicationId: string): Promise<AIScrutinySuggestion[]>;
  getOcrEngineStatus(): Promise<OCREngineInfo>;
  analyzeDocumentWithAI(
    applicationId: string,
    documentId: string,
    officerName: string,
    officerRole: UserRole
  ): Promise<{ success: boolean; result: DocumentIntelligenceResult; error?: string }>;
  updateAISuggestionReview(
    suggestionId: string,
    payload: {
      status: 'confirmed' | 'dismissed' | 'edited';
      editedTitle?: string;
      editedSummary?: string;
      officerFeedback?: string;
      officerName: string;
    }
  ): Promise<{ success: boolean; suggestion: AIScrutinySuggestion; error?: string }>;
  convertFindingToDraftDeficiency(
    findingId: string,
    officerName: string,
    clauseReference?: string,
    severity?: 'minor' | 'major' | 'fatal',
    deadline?: string
  ): Promise<{ success: boolean; deficiency: Deficiency; error?: string }>;

  // EVC
  getEVCVisits(): Promise<EVCVisit[]>;
  scheduleEVCVisit(
    recordId: string,
    tentativeDate: string,
    confirmedDate: string,
    committeeMembers: any[],
    officerName: string,
    isUnannounced?: boolean,
    visitTerms?: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  recordEVCVisitCompletion(
    recordId: string,
    completionDate: string,
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  submitEVCReport(
    recordId: string,
    reportSummary: string,
    outcomeRecommendation: 'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended',
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  cancelEVCVisit(
    recordId: string,
    reason: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }>;

  // Compliance
  getComplianceRequirements(institutionId?: string): Promise<ComplianceRequirement[]>;
  updateComplianceStatus(
    itemId: string,
    status: any,
    remarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; item: ComplianceRequirement; error?: string }>;

  // Late Requests
  getLateRequests(): Promise<LateSubmissionRequest[]>;
  reviewLateRequest(
    requestId: string,
    status: any,
    reviewerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; request: LateSubmissionRequest; error?: string }>;

  // Notifications
  getNotifications(role: UserRole, officerId?: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<{ success: boolean }>;
  markAllNotificationsRead(role: UserRole, officerId?: string): Promise<{ success: boolean; count: number }>;

  // Audit Logs
  getAuditLogs(applicationId?: string): Promise<AuditEvent[]>;
}
