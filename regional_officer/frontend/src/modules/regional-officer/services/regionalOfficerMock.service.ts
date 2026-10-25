import {
  IRegionalOfficerDataService,
  ApplicationFilterOptions,
  TransitionActionPayload,
  DocumentVerificationActionPayload,
  DeficiencyCreateActionPayload,
} from './regionalOfficerApi.interface';
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
  UserRole,
  ChecklistComplianceStatus,
  OCREngineInfo,
  DocumentIntelligenceResult,
  AIScrutinySuggestion,
} from '../types';
import { getDataService } from '../../../services/dataServiceFactory';

export class RegionalOfficerMockService implements IRegionalOfficerDataService {
  private baseService = getDataService();

  getProviderStatus() {
    return {
      isMock: true,
      providerName: 'Synthetic Regional Officer Mock Repository',
      description: 'Development-only synthetic data conforming to AICTE Western Regional Office norms.',
    };
  }

  async getApplications(filters?: ApplicationFilterOptions): Promise<Application[]> {
    return this.baseService.getApplications(filters as any) as unknown as Promise<Application[]>;
  }

  async getApplicationById(id: string): Promise<Application | null> {
    return this.baseService.getApplicationById(id) as unknown as Promise<Application | null>;
  }

  async executeWorkflowTransition(payload: TransitionActionPayload) {
    return this.baseService.transitionApplicationStatus(payload as any) as any;
  }

  async getDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    return this.baseService.getDocumentsByApplicationId(applicationId) as unknown as Promise<ApplicationDocument[]>;
  }

  async verifyDocument(payload: DocumentVerificationActionPayload) {
    return this.baseService.updateDocumentScrutiny(payload as any) as any;
  }

  async getChecklist(applicationId: string): Promise<ScrutinyChecklistItem[]> {
    return this.baseService.getChecklistByApplicationId(applicationId) as unknown as Promise<ScrutinyChecklistItem[]>;
  }

  async updateChecklistStatus(itemId: string, status: ChecklistComplianceStatus, officerNotes: string) {
    return this.baseService.updateChecklistItem(itemId, status, officerNotes) as any;
  }

  async getDeficiencies(applicationId: string): Promise<Deficiency[]> {
    return this.baseService.getDeficienciesByApplicationId(applicationId) as unknown as Promise<Deficiency[]>;
  }

  async recordDeficiency(payload: DeficiencyCreateActionPayload) {
    return this.baseService.createDeficiency(payload as any) as any;
  }

  async saveDraftDeficiency(payload: DeficiencyCreateActionPayload) {
    return this.baseService.saveDraftDeficiency(payload as any) as any;
  }

  async deleteDeficiency(deficiencyId: string) {
    return this.baseService.deleteDeficiency(deficiencyId);
  }

  async submitCorrectionRequest(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string,
    rectificationDeadline: string
  ) {
    return this.baseService.submitCorrectionRequest(applicationId, officerId, officerName, remarks, rectificationDeadline) as any;
  }

  async updateDeficiencyResolution(
    deficiencyId: string,
    resolutionStatus: any,
    resolutionRemarks: string,
    officerName: string
  ) {
    return this.baseService.updateDeficiencyResolution(deficiencyId, resolutionStatus, resolutionRemarks, officerName) as any;
  }

  // Phase 7: AI-Assisted Document Intelligence
  async getAISuggestions(applicationId: string): Promise<AIScrutinySuggestion[]> {
    return this.baseService.getAISuggestionsByApplicationId(applicationId) as any;
  }

  async getOcrEngineStatus(): Promise<OCREngineInfo> {
    return this.baseService.getOcrEngineStatus() as any;
  }

  async analyzeDocumentWithAI(
    applicationId: string,
    documentId: string,
    officerName: string,
    officerRole: UserRole
  ): Promise<{ success: boolean; result: DocumentIntelligenceResult; error?: string }> {
    return this.baseService.analyzeDocumentWithAI(applicationId, documentId, officerName, officerRole) as any;
  }

  async updateAISuggestionReview(
    suggestionId: string,
    payload: {
      status: 'confirmed' | 'dismissed' | 'edited';
      editedTitle?: string;
      editedSummary?: string;
      officerFeedback?: string;
      officerName: string;
    }
  ): Promise<{ success: boolean; suggestion: AIScrutinySuggestion; error?: string }> {
    return this.baseService.updateAISuggestionReview(suggestionId, payload) as any;
  }

  async convertFindingToDraftDeficiency(
    findingId: string,
    officerName: string,
    clauseReference?: string,
    severity?: 'minor' | 'major' | 'fatal',
    deadline?: string
  ): Promise<{ success: boolean; deficiency: Deficiency; error?: string }> {
    return this.baseService.convertFindingToDraftDeficiency(findingId, officerName, clauseReference, severity, deadline) as any;
  }

  async getEVCVisits(): Promise<EVCVisit[]> {
    return this.baseService.getEVCRecords() as unknown as Promise<EVCVisit[]>;
  }

  async scheduleEVCVisit(
    recordId: string,
    tentativeDate: string,
    confirmedDate: string,
    committeeMembers: any[],
    officerName: string,
    isUnannounced?: boolean,
    visitTerms?: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }> {
    return this.baseService.scheduleEVC(
      recordId,
      tentativeDate,
      confirmedDate,
      committeeMembers,
      officerName,
      isUnannounced,
      visitTerms,
      officerRole
    ) as unknown as Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  }

  async recordEVCVisitCompletion(
    recordId: string,
    completionDate: string,
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }> {
    return this.baseService.recordEVCVisitCompletion(
      recordId,
      completionDate,
      officerRemarks,
      officerName,
      officerRole
    ) as unknown as Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  }

  async submitEVCReport(
    recordId: string,
    reportSummary: string,
    outcomeRecommendation: 'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended',
    officerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }> {
    return this.baseService.submitEVCReport(
      recordId,
      reportSummary,
      outcomeRecommendation,
      officerRemarks,
      officerName,
      officerRole
    ) as unknown as Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  }

  async cancelEVCVisit(
    recordId: string,
    reason: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; record: EVCVisit; error?: string }> {
    return this.baseService.cancelEVCVisit(
      recordId,
      reason,
      officerName,
      officerRole
    ) as unknown as Promise<{ success: boolean; record: EVCVisit; error?: string }>;
  }

  async getComplianceRequirements(institutionId?: string): Promise<ComplianceRequirement[]> {
    return this.baseService.getComplianceItems(institutionId) as unknown as Promise<ComplianceRequirement[]>;
  }

  async updateComplianceStatus(
    itemId: string,
    status: any,
    remarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; item: ComplianceRequirement; error?: string }> {
    return this.baseService.updateComplianceStatus(
      itemId,
      status,
      remarks,
      officerName,
      officerRole
    ) as unknown as Promise<{ success: boolean; item: ComplianceRequirement; error?: string }>;
  }

  async getLateRequests(): Promise<LateSubmissionRequest[]> {
    return this.baseService.getLateRequests() as unknown as Promise<LateSubmissionRequest[]>;
  }

  async reviewLateRequest(
    requestId: string,
    status: any,
    reviewerRemarks: string,
    officerName: string,
    officerRole?: UserRole
  ): Promise<{ success: boolean; request: LateSubmissionRequest; error?: string }> {
    return this.baseService.reviewLateRequest(
      requestId,
      status,
      reviewerRemarks,
      officerName,
      officerRole
    ) as unknown as Promise<{ success: boolean; request: LateSubmissionRequest; error?: string }>;
  }

  async getNotifications(role: UserRole, officerId?: string): Promise<Notification[]> {
    return this.baseService.getNotifications(role, officerId) as unknown as Promise<Notification[]>;
  }

  async markNotificationRead(notificationId: string) {
    return this.baseService.markNotificationAsRead(notificationId);
  }

  async markAllNotificationsRead(role: UserRole, officerId?: string): Promise<{ success: boolean; count: number }> {
    return this.baseService.markAllNotificationsAsRead(role, officerId);
  }

  async getAuditLogs(applicationId?: string): Promise<AuditEvent[]> {
    return this.baseService.getAuditLogs(applicationId) as unknown as Promise<AuditEvent[]>;
  }
}
