import {
  Application,
  ApplicationDocument,
  ScrutinyChecklistItem,
  ScrutinyDeficiency,
  AIScrutinySuggestion,
  EVCRecord,
  ComplianceItem,
  LateSubmissionRequest,
  AppNotification,
  AuditEvent,
  ApplicationStatus,
  DocumentVerificationStatus,
  ChecklistComplianceStatus,
  UserRole,
  DeficiencyResolutionStatus,
  CorrectionNotice,
  OCREngineInfo,
  DocumentIntelligenceResult,
} from '../types';

export interface ApplicationFilterParams {
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

export interface TransitionPayload {
  applicationId: string;
  targetStatus: ApplicationStatus;
  officerId: string;
  officerName: string;
  officerRole: UserRole;
  remarks: string;
  stageName: string;
}

export interface DocumentVerificationPayload {
  documentId: string;
  applicationId: string;
  status: DocumentVerificationStatus;
  observations: string;
  deficiencyReason?: string;
  deficiencyRemarks?: string;
  officerName: string;
}

export interface DeficiencyCreatePayload {
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

export interface EduApproveDataService {
  // Service Health & Metadata
  getServiceStatus(): { isLiveSupabase: boolean; connectionStatus: 'online' | 'offline' | 'mock_fallback'; message: string };

  // Applications
  getApplications(filters?: ApplicationFilterParams): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | null>;
  transitionApplicationStatus(payload: TransitionPayload): Promise<{ success: boolean; application: Application; error?: string }>;
  reassignApplication(applicationId: string, officerId: string, officerName: string, requestingOfficerRole: UserRole): Promise<{ success: boolean; error?: string }>;

  // Documents
  getDocumentsByApplicationId(applicationId: string): Promise<ApplicationDocument[]>;
  updateDocumentScrutiny(payload: DocumentVerificationPayload): Promise<{ success: boolean; document: ApplicationDocument; error?: string }>;

  // Scrutiny & Checklists
  getChecklistByApplicationId(applicationId: string): Promise<ScrutinyChecklistItem[]>;
  updateChecklistItem(itemId: string, status: ChecklistComplianceStatus, officerNotes: string): Promise<{ success: boolean; item: ScrutinyChecklistItem }>;
  getDeficienciesByApplicationId(applicationId: string): Promise<ScrutinyDeficiency[]>;
  createDeficiency(payload: DeficiencyCreatePayload): Promise<{ success: boolean; deficiency: ScrutinyDeficiency }>;
  saveDraftDeficiency(payload: DeficiencyCreatePayload): Promise<{ success: boolean; deficiency: ScrutinyDeficiency }>;
  deleteDeficiency(deficiencyId: string): Promise<{ success: boolean; error?: string }>;
  submitCorrectionRequest(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string,
    rectificationDeadline: string
  ): Promise<{ success: boolean; notice: CorrectionNotice; error?: string }>;
  updateDeficiencyResolution(
    deficiencyId: string,
    resolutionStatus: DeficiencyResolutionStatus,
    resolutionRemarks: string,
    officerName: string
  ): Promise<{ success: boolean; deficiency: ScrutinyDeficiency; error?: string }>;

  // AI Scrutiny & Document Intelligence (Phase 7)
  getAISuggestionsByApplicationId(applicationId: string): Promise<AIScrutinySuggestion[]>;
  reviewAISuggestion(suggestionId: string, decision: 'confirmed_by_officer' | 'dismissed_by_officer', feedback?: string, officerName?: string): Promise<{ success: boolean; suggestion: AIScrutinySuggestion }>;
  getOcrEngineStatus(): Promise<OCREngineInfo>;
  analyzeDocumentWithAI(applicationId: string, documentId: string, officerName: string, officerRole: UserRole): Promise<{ success: boolean; result: DocumentIntelligenceResult; error?: string }>;
  updateAISuggestionReview(suggestionId: string, payload: { status: 'confirmed' | 'dismissed' | 'edited'; editedTitle?: string; editedSummary?: string; officerFeedback?: string; officerName: string }): Promise<{ success: boolean; suggestion: AIScrutinySuggestion; error?: string }>;
  convertFindingToDraftDeficiency(findingId: string, officerName: string, clauseReference?: string, severity?: 'minor' | 'major' | 'fatal', deadline?: string): Promise<{ success: boolean; deficiency: ScrutinyDeficiency; error?: string }>;


  // EVC
  getEVCRecords(): Promise<EVCRecord[]>;
  getEVCRecordById(id: string): Promise<EVCRecord | null>;
  scheduleEVC(
    recordId: string,
    tentativeDate: string,
    confirmedDate: string,
    committeeMembers: any[],
    officerName: string,
    isUnannounced?: boolean,
    visitTerms?: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }>;
  recordEVCVisitCompletion(
    recordId: string,
    completionDate: string,
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }>;
  submitEVCReport(
    recordId: string,
    reportSummary: string,
    outcomeRecommendation: 'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended',
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }>;
  cancelEVCVisit(
    recordId: string,
    reason: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }>;

  // Compliance
  getComplianceItems(institutionId?: string): Promise<ComplianceItem[]>;
  updateComplianceStatus(
    itemId: string,
    status: any,
    remarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; item: ComplianceItem; error?: string }>;

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
  getNotifications(role: UserRole, officerId?: string): Promise<AppNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<{ success: boolean }>;
  markAllNotificationsAsRead(role: UserRole, officerId?: string): Promise<{ success: boolean; count: number }>;

  // Audit Logs
  getAuditLogs(applicationId?: string): Promise<AuditEvent[]>;
}
