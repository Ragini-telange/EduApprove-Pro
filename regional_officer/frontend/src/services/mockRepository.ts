import {
  EduApproveDataService,
  ApplicationFilterParams,
  TransitionPayload,
  DocumentVerificationPayload,
  DeficiencyCreatePayload,
} from './apiInterface';
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
  UserRole,
  ChecklistComplianceStatus,
  DeficiencyResolutionStatus,
  CorrectionNotice,
  OCREngineInfo,
  DocumentIntelligenceResult,
} from '../types';
import {
  MOCK_APPLICATIONS,
  MOCK_DOCUMENTS,
  MOCK_CHECKLIST_ITEMS,
  MOCK_DEFICIENCIES,
  MOCK_AI_SUGGESTIONS,
  MOCK_EVC_RECORDS,
  MOCK_COMPLIANCE_ITEMS,
  MOCK_LATE_REQUESTS,
  MOCK_NOTIFICATIONS,
  MOCK_AUDIT_LOGS,
} from './mockData';
import { canTransitionStatus } from '../types/workflowTransitions';
import { getDefaultChecklistForType } from '../modules/regional-officer/utils/checklistTemplates';

// In-memory clones for development session
let applications: Application[] = JSON.parse(JSON.stringify(MOCK_APPLICATIONS));
let documents: ApplicationDocument[] = JSON.parse(JSON.stringify(MOCK_DOCUMENTS));
let checklistItems: ScrutinyChecklistItem[] = JSON.parse(JSON.stringify(MOCK_CHECKLIST_ITEMS));
let deficiencies: ScrutinyDeficiency[] = JSON.parse(JSON.stringify(MOCK_DEFICIENCIES));
let aiSuggestions: AIScrutinySuggestion[] = JSON.parse(JSON.stringify(MOCK_AI_SUGGESTIONS));
let evcRecords: EVCRecord[] = JSON.parse(JSON.stringify(MOCK_EVC_RECORDS));
let complianceItems: ComplianceItem[] = JSON.parse(JSON.stringify(MOCK_COMPLIANCE_ITEMS));
let lateRequests: LateSubmissionRequest[] = JSON.parse(JSON.stringify(MOCK_LATE_REQUESTS));
let notifications: AppNotification[] = JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS));
let auditLogs: AuditEvent[] = JSON.parse(JSON.stringify(MOCK_AUDIT_LOGS));

const delay = (ms: number = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockEduApproveRepository implements EduApproveDataService {
  getServiceStatus() {
    return {
      isLiveSupabase: false,
      connectionStatus: 'mock_fallback' as const,
      message: 'EduApprove Mock Data Provider active. Isolated development mode with realistic AICTE test datasets.',
    };
  }

  async getApplications(filters?: ApplicationFilterParams): Promise<Application[]> {
    await delay();
    let result = [...applications];

    if (filters) {
      // 1. Enforce Regional Officer Jurisdiction Access Restriction
      if (filters.officerJurisdictions && filters.officerJurisdictions.length > 0) {
        const allowed = filters.officerJurisdictions;
        result = result.filter(
          (app) => allowed.includes(app.institution.state) || allowed.some((j) => app.institution.regionalOffice.includes(j))
        );
      }

      if (filters.status) {
        result = result.filter((app) => app.status === filters.status);
      }
      if (filters.type) {
        result = result.filter((app) => app.type === filters.type);
      }
      if (filters.priority) {
        result = result.filter((app) => app.priority === filters.priority);
      }
      if (filters.assignedOfficerId) {
        result = result.filter((app) => app.assignedOfficerId === filters.assignedOfficerId);
      }
      if (filters.jurisdiction) {
        const jur = filters.jurisdiction;
        result = result.filter((app) => app.institution.state === jur || app.institution.regionalOffice.includes(jur));
      }
      if (filters.dateFrom) {
        const fromTime = new Date(filters.dateFrom).getTime();
        result = result.filter((app) => new Date(app.submittedAt).getTime() >= fromTime);
      }
      if (filters.dateTo) {
        const toTime = new Date(filters.dateTo).getTime();
        result = result.filter((app) => new Date(app.submittedAt).getTime() <= toTime);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (app) =>
            app.applicationNumber.toLowerCase().includes(query) ||
            app.institution.name.toLowerCase().includes(query) ||
            app.institution.city.toLowerCase().includes(query) ||
            app.institution.aictePermanentId.toLowerCase().includes(query)
        );
      }

      // 2. Sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'deadline_asc':
            result.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
            break;
          case 'deadline_desc':
            result.sort((a, b) => new Date(b.deadlineDate).getTime() - new Date(a.deadlineDate).getTime());
            break;
          case 'submitted_desc':
            result.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            break;
          case 'app_number':
            result.sort((a, b) => a.applicationNumber.localeCompare(b.applicationNumber));
            break;
          case 'institution_asc':
            result.sort((a, b) => a.institution.name.localeCompare(b.institution.name));
            break;
        }
      }

      // 3. Pagination
      if (filters.page && filters.pageSize) {
        const start = (filters.page - 1) * filters.pageSize;
        result = result.slice(start, start + filters.pageSize);
      }
    }

    return result;
  }

  async getApplicationById(id: string): Promise<Application | null> {
    await delay();
    const app = applications.find((a) => a.id === id);
    return app ? JSON.parse(JSON.stringify(app)) : null;
  }

  async transitionApplicationStatus(payload: TransitionPayload): Promise<{
    success: boolean;
    application: Application;
    error?: string;
  }> {
    await delay();
    const index = applications.findIndex((a) => a.id === payload.applicationId);
    if (index === -1) {
      throw new Error(`Application with ID ${payload.applicationId} not found.`);
    }

    const currentApp = applications[index];
    const validation = canTransitionStatus(currentApp.status, payload.targetStatus, payload.officerRole);

    if (!validation.allowed) {
      return {
        success: false,
        application: currentApp,
        error: validation.reason,
      };
    }

    const previousStatus = currentApp.status;
    const now = new Date().toISOString();

    const remarkId = `rem-${Date.now()}`;
    const newRemark = {
      id: remarkId,
      officerId: payload.officerId,
      officerName: payload.officerName,
      timestamp: now,
      statusFrom: previousStatus,
      statusTo: payload.targetStatus,
      stage: payload.stageName,
      remarks: payload.remarks,
    };

    const updatedApp: Application = {
      ...currentApp,
      status: payload.targetStatus,
      updatedAt: now,
      remarksHistory: [newRemark, ...currentApp.remarksHistory],
    };

    if (payload.targetStatus === 'under_re_scrutiny') {
      updatedApp.reScrutinyCount = (updatedApp.reScrutinyCount || 0) + 1;
    }

    applications[index] = updatedApp;

    // Record immutable audit event
    const auditEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      applicationId: updatedApp.id,
      applicationNumber: updatedApp.applicationNumber,
      actorId: payload.officerId,
      actorName: payload.officerName,
      actorRole: payload.officerRole,
      action: 'WORKFLOW_STATUS_TRANSITION',
      timestamp: now,
      affectedRecord: `Application: ${updatedApp.applicationNumber}`,
      previousState: previousStatus,
      newState: payload.targetStatus,
      remarks: payload.remarks,
      ipAddress: '127.0.0.1 (Local Dev)',
    };
    auditLogs.unshift(auditEvent);

    return {
      success: true,
      application: updatedApp,
    };
  }

  async reassignApplication(
    applicationId: string,
    officerId: string,
    officerName: string,
    requestingOfficerRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    await delay();
    if (requestingOfficerRole !== 'regional_officer' && requestingOfficerRole !== 'senior_authority' && requestingOfficerRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Only Regional Officers or Senior Authorities may reassign cases.' };
    }

    const app = applications.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Application not found.' };

    const previousOfficer = app.assignedOfficerName;
    app.assignedOfficerId = officerId;
    app.assignedOfficerName = officerName;
    app.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      actorId: officerId,
      actorName: officerName,
      actorRole: requestingOfficerRole,
      action: 'CASE_REASSIGNMENT',
      timestamp: new Date().toISOString(),
      affectedRecord: `Case Assignment`,
      previousState: previousOfficer || 'Unassigned',
      newState: officerName,
      remarks: `Case reassigned from ${previousOfficer || 'Unassigned'} to ${officerName}.`,
    });

    return { success: true };
  }

  async getDocumentsByApplicationId(applicationId: string): Promise<ApplicationDocument[]> {
    await delay();
    return documents.filter((doc) => doc.applicationId === applicationId);
  }

  async updateDocumentScrutiny(payload: DocumentVerificationPayload): Promise<{
    success: boolean;
    document: ApplicationDocument;
    error?: string;
  }> {
    await delay();
    const docIndex = documents.findIndex((d) => d.id === payload.documentId);
    if (docIndex === -1) {
      return { success: false, document: {} as any, error: 'Document not found.' };
    }

    const currentDoc = documents[docIndex];

    // Enforce mandatory officer remarks
    const remarks = payload.observations?.trim() || payload.deficiencyRemarks?.trim() || payload.deficiencyReason?.trim();
    if (!remarks) {
      return {
        success: false,
        document: currentDoc,
        error: 'Officer remarks and justification are mandatory when recording a scrutiny decision.',
      };
    }

    if ((payload.status === 'correction_required' || payload.status === 'rejected') && !payload.deficiencyReason?.trim() && !payload.deficiencyRemarks?.trim()) {
      return {
        success: false,
        document: currentDoc,
        error: `Deficiency reason and remedial remarks are required when marking a document as ${payload.status}.`,
      };
    }

    const prevStatus = currentDoc.status;
    const now = new Date().toISOString();

    const versionEntry = {
      version: currentDoc.version,
      fileName: currentDoc.fileName,
      fileSize: currentDoc.fileSize,
      uploadedAt: currentDoc.uploadedAt,
      storagePath: currentDoc.storagePath,
      status: payload.status,
      observations: payload.observations,
      reviewedBy: payload.officerName,
      reviewedAt: now,
      diffSummary: payload.observations || `Evaluated as ${payload.status}`,
    };

    const existingVersions = currentDoc.versions ? [...currentDoc.versions] : [];
    if (!existingVersions.some((v) => v.version === currentDoc.version)) {
      existingVersions.push(versionEntry);
    }

    const updatedDoc: ApplicationDocument = {
      ...currentDoc,
      status: payload.status,
      observations: payload.observations,
      deficiencyReason: payload.deficiencyReason,
      deficiencyRemarks: payload.deficiencyRemarks,
      verifiedBy: payload.officerName,
      verifiedAt: now,
      versions: existingVersions,
    };

    documents[docIndex] = updatedDoc;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: payload.applicationId,
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: payload.officerName,
      actorRole: 'regional_officer',
      action: 'DOCUMENT_SCRUTINY_DECISION',
      timestamp: now,
      affectedRecord: `Document: ${updatedDoc.code} - ${updatedDoc.name}`,
      previousState: prevStatus,
      newState: payload.status,
      remarks: payload.observations || payload.deficiencyRemarks || `Status marked as ${payload.status}`,
    });

    return { success: true, document: updatedDoc };
  }

  async getChecklistByApplicationId(applicationId: string): Promise<ScrutinyChecklistItem[]> {
    await delay();
    let items = checklistItems.filter((item) => item.applicationId === applicationId);
    if (items.length === 0) {
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        items = getDefaultChecklistForType(app.type, applicationId);
        checklistItems.push(...items);
      }
    }
    return items;
  }

  async updateChecklistItem(
    itemId: string,
    status: ChecklistComplianceStatus,
    officerNotes: string
  ): Promise<{ success: boolean; item: ScrutinyChecklistItem }> {
    await delay();
    const index = checklistItems.findIndex((i) => i.id === itemId);
    if (index === -1) throw new Error('Checklist item not found');

    const updated: ScrutinyChecklistItem = {
      ...checklistItems[index],
      status,
      officerNotes,
      reviewedBy: 'Ragini Telange',
      reviewedAt: new Date().toISOString(),
    };
    checklistItems[index] = updated;

    return { success: true, item: updated };
  }

  async getDeficienciesByApplicationId(applicationId: string): Promise<ScrutinyDeficiency[]> {
    await delay();
    return deficiencies.filter((d) => d.applicationId === applicationId);
  }

  async createDeficiency(payload: DeficiencyCreatePayload): Promise<{
    success: boolean;
    deficiency: ScrutinyDeficiency;
  }> {
    await delay();
    const newDef: ScrutinyDeficiency = {
      id: `def-${Date.now()}`,
      applicationId: payload.applicationId,
      documentId: payload.documentId,
      documentName: payload.documentName,
      checklistItemId: payload.checklistItemId,
      category: payload.category,
      clauseReference: payload.clauseReference,
      severity: payload.severity,
      deficiencyTitle: payload.deficiencyTitle,
      detailedReason: payload.detailedReason,
      remedialActionRequired: payload.remedialActionRequired,
      rectificationDeadline: payload.rectificationDeadline,
      isResolved: false,
      isDraft: !!payload.isDraft,
      status: payload.isDraft ? 'draft' : 'issued',
      createdAt: new Date().toISOString(),
    };

    deficiencies.push(newDef);

    // Update application deficiency count if not a draft
    if (!payload.isDraft) {
      const app = applications.find((a) => a.id === payload.applicationId);
      if (app) {
        app.deficiencyCount = (app.deficiencyCount || 0) + 1;
        app.updatedAt = new Date().toISOString();
      }
    }

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: payload.applicationId,
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: payload.officerName,
      actorRole: 'regional_officer',
      action: payload.isDraft ? 'DEFICIENCY_DRAFT_SAVED' : 'DEFICIENCY_LOGGED',
      timestamp: new Date().toISOString(),
      affectedRecord: `Deficiency: ${newDef.deficiencyTitle}`,
      previousState: 'none',
      newState: payload.severity,
      remarks: payload.detailedReason,
    });

    return { success: true, deficiency: newDef };
  }

  async saveDraftDeficiency(payload: DeficiencyCreatePayload): Promise<{
    success: boolean;
    deficiency: ScrutinyDeficiency;
  }> {
    return this.createDeficiency({ ...payload, isDraft: true });
  }

  async deleteDeficiency(deficiencyId: string): Promise<{ success: boolean; error?: string }> {
    await delay();
    const idx = deficiencies.findIndex((d) => d.id === deficiencyId);
    if (idx === -1) {
      return { success: false, error: 'Deficiency not found.' };
    }
    const def = deficiencies[idx];
    deficiencies.splice(idx, 1);

    if (!def.isDraft) {
      const app = applications.find((a) => a.id === def.applicationId);
      if (app && app.deficiencyCount > 0) {
        app.deficiencyCount -= 1;
      }
    }
    return { success: true };
  }

  async submitCorrectionRequest(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string,
    rectificationDeadline: string
  ): Promise<{ success: boolean; notice: CorrectionNotice; error?: string }> {
    await delay();
    const app = applications.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, notice: {} as any, error: 'Application not found.' };
    }

    if (app.status !== 'under_scrutiny' && app.status !== 'under_re_scrutiny') {
      return {
        success: false,
        notice: {} as any,
        error: `Cannot issue correction request from workflow status '${app.status}'. Application must be 'under_scrutiny' or 'under_re_scrutiny'.`,
      };
    }

    if (!remarks.trim()) {
      return {
        success: false,
        notice: {} as any,
        error: 'Comprehensive remarks are required when serving an official correction request notice.',
      };
    }

    const appDefs = deficiencies.filter((d) => d.applicationId === applicationId);
    if (appDefs.length === 0) {
      return {
        success: false,
        notice: {} as any,
        error: 'Cannot issue a correction request without at least one recorded deficiency.',
      };
    }

    // Promote all drafts to issued
    appDefs.forEach((d) => {
      d.isDraft = false;
      d.status = 'issued';
    });

    const now = new Date().toISOString();
    const prevStatus = app.status;
    app.status = 'correction_required';
    app.updatedAt = now;
    app.deficiencyCount = appDefs.length;

    const noticeNumber = `AICTE/CORR/WRO/${Date.now().toString().slice(-6)}`;
    const remarkId = `rem-${Date.now()}`;
    const newRemark = {
      id: remarkId,
      officerId,
      officerName,
      timestamp: now,
      statusFrom: prevStatus,
      statusTo: 'correction_required' as const,
      stage: 'Correction Request Issued',
      remarks: `Official Deficiency Memo ${noticeNumber} served. ${remarks}`,
    };
    app.remarksHistory = [newRemark, ...app.remarksHistory];

    const notice: CorrectionNotice = {
      noticeNumber,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      institutionName: app.institution.name,
      issuedAt: now,
      rectificationDeadline,
      issuedByOfficer: officerName,
      regionalOffice: app.institution.regionalOffice,
      deficiencies: JSON.parse(JSON.stringify(appDefs)),
      statutoryInstructions:
        'The institution is hereby instructed to rectify each of the itemized deficiencies within the stipulated rectification window. Failure to resubmit within the statutory deadline shall result in statutory adverse action under AICTE Approval Process Regulations.',
    };

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      actorId: officerId,
      actorName: officerName,
      actorRole: 'regional_officer',
      action: 'CORRECTION_NOTICE_ISSUED',
      timestamp: now,
      affectedRecord: `Correction Notice: ${noticeNumber}`,
      previousState: prevStatus,
      newState: 'correction_required',
      remarks: `Issued correction notice with ${appDefs.length} deficiencies. Rectification window until ${rectificationDeadline}.`,
    });

    return { success: true, notice };
  }

  async updateDeficiencyResolution(
    deficiencyId: string,
    resolutionStatus: DeficiencyResolutionStatus,
    resolutionRemarks: string,
    officerName: string
  ): Promise<{ success: boolean; deficiency: ScrutinyDeficiency; error?: string }> {
    await delay();
    const def = deficiencies.find((d) => d.id === deficiencyId);
    if (!def) {
      return { success: false, deficiency: {} as any, error: 'Deficiency not found.' };
    }

    if (!resolutionRemarks.trim()) {
      return {
        success: false,
        deficiency: def,
        error: 'Officer remarks are mandatory when recording deficiency re-scrutiny evaluation.',
      };
    }

    const prevStatus = def.resolutionStatus || (def.isResolved ? 'resolved' : 'still_outstanding');
    const now = new Date().toISOString();

    def.resolutionStatus = resolutionStatus;
    def.isResolved = resolutionStatus === 'resolved';
    def.resolutionRemarks = resolutionRemarks;
    if (resolutionStatus === 'resolved') {
      def.resolvedAt = now;
      def.status = 'resolved';
    } else if (resolutionStatus === 'still_outstanding') {
      def.status = 'outstanding';
    } else {
      def.status = 'further_review';
    }

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: def.applicationId,
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: 'regional_officer',
      action: 'DEFICIENCY_RESOLUTION_UPDATED',
      timestamp: now,
      affectedRecord: `Deficiency: ${def.deficiencyTitle}`,
      previousState: prevStatus,
      newState: resolutionStatus,
      remarks: resolutionRemarks,
    });

    return { success: true, deficiency: def };
  }

  // AI Scrutiny & Document Intelligence (Phase 7)
  async getAISuggestionsByApplicationId(applicationId: string): Promise<AIScrutinySuggestion[]> {
    await delay();
    return aiSuggestions.filter((s) => s.applicationId === applicationId);
  }

  async reviewAISuggestion(
    suggestionId: string,
    decision: 'confirmed_by_officer' | 'dismissed_by_officer',
    feedback?: string,
    officerName?: string
  ): Promise<{ success: boolean; suggestion: AIScrutinySuggestion }> {
    await delay();
    const index = aiSuggestions.findIndex((s) => s.id === suggestionId);
    if (index === -1) throw new Error('AI Suggestion not found');

    const updated: AIScrutinySuggestion = {
      ...aiSuggestions[index],
      status: decision,
      reviewState: decision === 'confirmed_by_officer' ? 'confirmed' : 'dismissed',
      reviewedBy: officerName || 'Ragini Telange',
      reviewedAt: new Date().toISOString(),
      officerFeedback: feedback,
    };
    aiSuggestions[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: officerName || 'Ragini Telange',
      actorRole: 'regional_officer',
      action: 'AI_SUGGESTION_REVIEWED',
      timestamp: new Date().toISOString(),
      affectedRecord: `AI Observation: ${updated.title}`,
      previousState: 'pending_review',
      newState: decision,
      remarks: feedback || `Officer marked finding as ${decision}.`,
    });

    return { success: true, suggestion: updated };
  }

  async getOcrEngineStatus(): Promise<OCREngineInfo> {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/documents/ocr-status');
      if (res.ok) {
        const data = await res.json();
        return {
          isAvailable: data.is_available,
          engineName: data.engine_name,
          installedBinary: data.installed_binary,
          statusCode: data.status_code,
          message: data.message,
          setupInstructions: data.setup_instructions,
        };
      }
    } catch {
      // Backend not running or unreachable; return fallback truthful local environment status
    }
    return {
      isAvailable: false,
      engineName: 'Tesseract OCR Engine (Host Standalone)',
      installedBinary: null,
      statusCode: 'unavailable',
      message: 'Local Tesseract OCR binary not detected on execution PATH. Operational in assisted regulatory sandbox mode.',
      setupInstructions:
        'To enable live OCR on the server:\n1. Download Tesseract OCR (UB-Mannheim Windows build).\n2. Add C:\\Program Files\\Tesseract-OCR to system PATH.\n3. pip install pytesseract pypdf pillow\n4. Restart the FastAPI backend.',
    };
  }

  async analyzeDocumentWithAI(
    applicationId: string,
    documentId: string,
    officerName: string,
    officerRole: UserRole
  ): Promise<{ success: boolean; result: DocumentIntelligenceResult; error?: string }> {
    await delay();

    // 1. Role validation
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return {
        success: false,
        result: {} as any,
        error: `Unauthorized: User role '${officerRole}' does not possess clearance for regulatory document intelligence.`,
      };
    }

    // 2. Application & Document verification
    const app = applications.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, result: {} as any, error: 'Application record not found.' };
    }

    const doc = documents.find((d) => d.id === documentId);
    if (!doc) {
      return { success: false, result: {} as any, error: 'Document record not found.' };
    }

    // 3. Document type verification
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff'];
    const fileName = doc.fileName.toLowerCase();
    const isSupported = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!isSupported) {
      return {
        success: false,
        result: {} as any,
        error: `Unsupported document format for '${doc.fileName}'. Only PDF and image scans (PNG, JPEG, TIFF) are accepted for AI text scrutiny.`,
      };
    }

    // 4. Retrieve engine status
    const engineStatus = await this.getOcrEngineStatus();

    // 5. Gather or create findings for this document
    let docFindings = aiSuggestions.filter((s) => s.documentId === documentId);
    if (docFindings.length === 0) {
      // Generate standard baseline observation if none pre-seeded
      const newFinding: AIScrutinySuggestion = {
        id: `ai-sug-${Date.now()}`,
        applicationId,
        documentId,
        documentName: doc.fileName,
        type: 'norm_non_compliance',
        title: `Document Standard Verification for ${doc.name}`,
        summary: `Automated inspection of ${doc.name} complete. Extracted certificate metadata correlates with APH guidelines.`,
        evidenceQuote: `"${doc.name} verified against institutional identifier ${app.institution.aictePermanentId}."`,
        supportingExtractedText: `Institution: ${app.institution.name}, Document: ${doc.name}, Version: v${doc.version}`,
        sourcePage: 1,
        pageReference: 'Page 1, Header',
        confidenceScore: 0.92,
        confidenceLabel: 'High Confidence (92%)',
        suggestedAction: 'Mark document as verified if physical inspection matches.',
        suggestedFollowUp: 'Record officer observations and mark verification state in Scrutiny Workspace.',
        status: 'pending_review',
        reviewState: 'pending_review',
        isMachineGenerated: true,
        relevantChecklistCode: doc.category === 'Land & Building' ? 'CHK-NEW-01' : 'CHK-SAF-01',
        relevantChecklistTitle: doc.category,
      };
      aiSuggestions.push(newFinding);
      docFindings = [newFinding];
    }

    const now = new Date().toISOString();
    return {
      success: true,
      result: {
        documentId,
        documentName: doc.name,
        engineStatus,
        analysisTimestamp: now,
        extractedTextSnippet: doc.ocrExtractedText || `[Simulated OCR Extract] ${doc.name} - AICTE Ref: ${app.applicationNumber} - Permanent ID: ${app.institution.aictePermanentId}`,
        findings: docFindings,
        isSimulatedSandbox: true,
      },
    };
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
    await delay();
    const index = aiSuggestions.findIndex((s) => s.id === suggestionId);
    if (index === -1) {
      return { success: false, suggestion: {} as any, error: 'Finding not found.' };
    }

    const current = aiSuggestions[index];
    const prevStatus = current.reviewState || 'pending_review';
    const now = new Date().toISOString();

    const updated: AIScrutinySuggestion = {
      ...current,
      status: payload.status === 'confirmed' ? 'confirmed_by_officer' : payload.status === 'dismissed' ? 'dismissed_by_officer' : current.status,
      reviewState: payload.status,
      reviewedBy: payload.officerName,
      reviewedAt: now,
      officerFeedback: payload.officerFeedback || current.officerFeedback,
      editedTitle: payload.editedTitle || current.editedTitle,
      editedSummary: payload.editedSummary || current.editedSummary,
    };
    aiSuggestions[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: payload.officerName,
      actorRole: 'regional_officer',
      action: 'AI_FINDING_REVIEWED',
      timestamp: now,
      affectedRecord: `AI Finding: ${updated.editedTitle || updated.title}`,
      previousState: prevStatus,
      newState: payload.status,
      remarks: payload.officerFeedback || `Officer marked finding as ${payload.status.toUpperCase()}.`,
    });

    return { success: true, suggestion: updated };
  }

  async convertFindingToDraftDeficiency(
    findingId: string,
    officerName: string,
    clauseReference: string = 'AICTE APH 2026-27 Norms',
    severity: 'minor' | 'major' | 'fatal' = 'major',
    deadline: string = '2026-11-05'
  ): Promise<{ success: boolean; deficiency: ScrutinyDeficiency; error?: string }> {
    await delay();
    const finding = aiSuggestions.find((s) => s.id === findingId);
    if (!finding) {
      return { success: false, deficiency: {} as any, error: 'Finding not found.' };
    }

    const effectiveTitle = finding.editedTitle || finding.title;
    const effectiveReason = (finding.editedSummary || finding.summary) +
      (finding.evidenceQuote ? ` [Extracted Evidence: ${finding.evidenceQuote}]` : '');

    const now = new Date().toISOString();
    const newDef: ScrutinyDeficiency = {
      id: `def-${Date.now()}`,
      applicationId: finding.applicationId,
      documentId: finding.documentId,
      documentName: finding.documentName,
      category: 'Document Intelligence & Scrutiny',
      clauseReference: clauseReference || finding.relevantChecklistCode || 'AICTE APH 2026-27 Clause 4.1',
      severity,
      deficiencyTitle: effectiveTitle,
      detailedReason: effectiveReason,
      remedialActionRequired: finding.suggestedFollowUp || finding.suggestedAction || 'Submit rectified instrument adhering to AICTE specifications.',
      rectificationDeadline: deadline,
      isResolved: false,
      status: 'draft',
      isDraft: true,
      createdAt: now,
    };

    deficiencies.push(newDef);

    // Update finding status to confirmed
    finding.reviewState = 'confirmed';
    finding.status = 'confirmed_by_officer';
    finding.reviewedBy = officerName;
    finding.reviewedAt = now;

    // Increment deficiency count on application without altering status
    const app = applications.find((a) => a.id === finding.applicationId);
    if (app) {
      app.deficiencyCount = deficiencies.filter((d) => d.applicationId === app.id).length;
    }

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: finding.applicationId,
      applicationNumber: app ? app.applicationNumber : '',
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: 'regional_officer',
      action: 'DEFICIENCY_CREATED_FROM_AI_FINDING',
      timestamp: now,
      affectedRecord: `Draft Deficiency: ${effectiveTitle}`,
      previousState: 'none',
      newState: 'draft',
      remarks: `Converted AI finding into official Draft Deficiency. Application workflow status untouched.`,
    });

    return { success: true, deficiency: newDef };
  }


  async getEVCRecords(): Promise<EVCRecord[]> {
    await delay();
    return [...evcRecords];
  }

  async getEVCRecordById(id: string): Promise<EVCRecord | null> {
    await delay();
    const rec = evcRecords.find((r) => r.id === id);
    return rec ? JSON.parse(JSON.stringify(rec)) : null;
  }

  async scheduleEVC(
    recordId: string,
    tentativeDate: string,
    confirmedDate: string,
    committeeMembers: any[],
    officerName: string,
    isUnannounced: boolean = false,
    visitTerms?: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, record: {} as any, error: 'Unauthorized: Only Regional Officers or Senior Authorities may schedule EVC visits.' };
    }

    const index = evcRecords.findIndex((r) => r.id === recordId);
    if (index === -1) return { success: false, record: {} as any, error: 'EVC Record not found.' };

    const current = evcRecords[index];
    if (current.status === 'cancelled') {
      return { success: false, record: current, error: 'Cannot schedule a cancelled EVC visit.' };
    }

    if (!confirmedDate && !tentativeDate) {
      return { success: false, record: current, error: 'Confirmed date or tentative date must be specified.' };
    }

    const updated: EVCRecord = {
      ...current,
      status: 'evc_scheduled',
      tentativeDate: tentativeDate || current.tentativeDate,
      confirmedDate: confirmedDate || current.confirmedDate,
      committeeMembers: committeeMembers && committeeMembers.length > 0 ? committeeMembers : current.committeeMembers,
      isUnannounced: isUnannounced !== undefined ? isUnannounced : current.isUnannounced,
      visitTerms: visitTerms || current.visitTerms,
    };
    evcRecords[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: updated.applicationNumber,
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'EVC_VISIT_SCHEDULED',
      timestamp: new Date().toISOString(),
      affectedRecord: `EVC Record: ${updated.id}`,
      previousState: current.status,
      newState: 'evc_scheduled',
      remarks: `EVC confirmed for ${confirmedDate || tentativeDate} with ${updated.committeeMembers.length} committee members. Unannounced: ${updated.isUnannounced ? 'Yes' : 'No'}.`,
    });

    return { success: true, record: updated };
  }

  async recordEVCVisitCompletion(
    recordId: string,
    completionDate: string,
    officerRemarks: string,
    officerName: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, record: {} as any, error: 'Unauthorized: Role cannot record EVC visit completion.' };
    }

    const index = evcRecords.findIndex((r) => r.id === recordId);
    if (index === -1) return { success: false, record: {} as any, error: 'EVC Record not found.' };

    const current = evcRecords[index];
    if (current.status !== 'evc_scheduled' && current.status !== 'scheduled' && current.status !== 'pending_scheduling') {
      return { success: false, record: current, error: `Cannot record completion for EVC in '${current.status}' status.` };
    }

    if (!officerRemarks.trim()) {
      return { success: false, record: current, error: 'Officer remarks are mandatory when recording EVC visit completion.' };
    }

    const updated: EVCRecord = {
      ...current,
      status: 'visit_completed',
      confirmedDate: completionDate || current.confirmedDate || new Date().toISOString().split('T')[0],
    };
    evcRecords[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: updated.applicationNumber,
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'EVC_VISIT_COMPLETED',
      timestamp: new Date().toISOString(),
      affectedRecord: `EVC Record: ${updated.id}`,
      previousState: current.status,
      newState: 'visit_completed',
      remarks: `Visit execution verified on ${completionDate}. ${officerRemarks}`,
    });

    return { success: true, record: updated };
  }

  async submitEVCReport(
    recordId: string,
    reportSummary: string,
    outcomeRecommendation: 'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended',
    officerRemarks: string,
    officerName: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, record: {} as any, error: 'Unauthorized: Role cannot submit EVC inspection reports.' };
    }

    const index = evcRecords.findIndex((r) => r.id === recordId);
    if (index === -1) return { success: false, record: {} as any, error: 'EVC Record not found.' };

    const current = evcRecords[index];
    if (current.status !== 'visit_completed' && current.status !== 'evc_scheduled' && current.status !== 'scheduled') {
      return { success: false, record: current, error: `Cannot submit report for EVC in '${current.status}' state.` };
    }

    if (!reportSummary.trim() || !outcomeRecommendation) {
      return { success: false, record: current, error: 'Report summary findings and official outcome recommendation are mandatory.' };
    }

    const now = new Date().toISOString();
    const updated: EVCRecord = {
      ...current,
      status: 'report_submitted',
      reportSummary,
      outcomeRecommendation,
      reportSubmittedAt: now,
      reportStorageUrl: `wro/evc-reports/evc-${current.id}-signed.pdf`,
    };
    evcRecords[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: updated.applicationNumber,
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'EVC_REPORT_SUBMITTED',
      timestamp: now,
      affectedRecord: `EVC Record: ${updated.id}`,
      previousState: current.status,
      newState: 'report_submitted',
      remarks: `Report submitted: Outcome is ${outcomeRecommendation}. ${officerRemarks}`,
    });

    return { success: true, record: updated };
  }

  async cancelEVCVisit(
    recordId: string,
    reason: string,
    officerName: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; record: EVCRecord; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, record: {} as any, error: 'Unauthorized: Role cannot cancel EVC visits.' };
    }

    const index = evcRecords.findIndex((r) => r.id === recordId);
    if (index === -1) return { success: false, record: {} as any, error: 'EVC Record not found.' };

    const current = evcRecords[index];
    if (!reason.trim()) {
      return { success: false, record: current, error: 'A mandatory reason is required to cancel an appointed EVC visit.' };
    }

    const updated: EVCRecord = {
      ...current,
      status: 'cancelled',
    };
    evcRecords[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: updated.applicationNumber,
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'EVC_VISIT_CANCELLED',
      timestamp: new Date().toISOString(),
      affectedRecord: `EVC Record: ${updated.id}`,
      previousState: current.status,
      newState: 'cancelled',
      remarks: `EVC visit cancelled: ${reason}`,
    });

    return { success: true, record: updated };
  }

  async getComplianceItems(institutionId?: string): Promise<ComplianceItem[]> {
    await delay();
    if (institutionId) {
      return complianceItems.filter((c) => c.institutionId === institutionId);
    }
    return [...complianceItems];
  }

  async updateComplianceStatus(
    itemId: string,
    status: any,
    remarks: string,
    officerName: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; item: ComplianceItem; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, item: {} as any, error: 'Unauthorized: Role cannot evaluate institutional compliance items.' };
    }

    const index = complianceItems.findIndex((c) => c.id === itemId);
    if (index === -1) return { success: false, item: {} as any, error: 'Compliance item not found.' };

    if (!remarks.trim()) {
      return { success: false, item: complianceItems[index], error: 'Officer remarks are mandatory when recording compliance status evaluation.' };
    }

    const current = complianceItems[index];
    const updated: ComplianceItem = {
      ...current,
      status,
      officerRemarks: remarks,
    };
    complianceItems[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId || '',
      applicationNumber: '',
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'COMPLIANCE_STATUS_UPDATED',
      timestamp: new Date().toISOString(),
      affectedRecord: `Compliance: ${updated.title}`,
      previousState: current.status,
      newState: status,
      remarks,
    });

    return { success: true, item: updated };
  }

  async getLateRequests(): Promise<LateSubmissionRequest[]> {
    await delay();
    return [...lateRequests];
  }

  async reviewLateRequest(
    requestId: string,
    status: any,
    reviewerRemarks: string,
    officerName: string,
    officerRole: UserRole = 'regional_officer'
  ): Promise<{ success: boolean; request: LateSubmissionRequest; error?: string }> {
    await delay();
    if (officerRole !== 'regional_officer' && officerRole !== 'senior_authority' && officerRole !== 'super_admin') {
      return { success: false, request: {} as any, error: 'Unauthorized: Role cannot review late submission petitions.' };
    }

    const index = lateRequests.findIndex((r) => r.id === requestId);
    if (index === -1) return { success: false, request: {} as any, error: 'Late request not found.' };

    if (!reviewerRemarks.trim()) {
      return { success: false, request: lateRequests[index], error: 'Officer remarks and recommendation justification are mandatory.' };
    }

    const current = lateRequests[index];
    const updated: LateSubmissionRequest = {
      ...current,
      status,
      reviewerRemarks,
      reviewedBy: officerName,
      reviewedAt: new Date().toISOString(),
    };
    lateRequests[index] = updated;

    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      applicationId: updated.applicationId,
      applicationNumber: updated.applicationNumber,
      actorId: 'ro-usr-001',
      actorName: officerName,
      actorRole: officerRole,
      action: 'LATE_REQUEST_REVIEWED',
      timestamp: new Date().toISOString(),
      affectedRecord: `Late Request: ${updated.requestType}`,
      previousState: current.status,
      newState: status,
      remarks: reviewerRemarks,
    });

    return { success: true, request: updated };
  }

  async getNotifications(role: UserRole, officerId?: string): Promise<AppNotification[]> {
    await delay();
    return notifications.filter((n) => n.recipientRole === role && (!officerId || !n.recipientId || n.recipientId === officerId));
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    await delay();
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      return { success: true };
    }
    return { success: false };
  }

  async markAllNotificationsAsRead(role: UserRole, officerId?: string): Promise<{ success: boolean; count: number }> {
    await delay();
    let updatedCount = 0;
    notifications.forEach((n) => {
      if (n.recipientRole === role && (!officerId || !n.recipientId || n.recipientId === officerId)) {
        if (!n.isRead) {
          n.isRead = true;
          updatedCount++;
        }
      }
    });
    return { success: true, count: updatedCount };
  }

  async getAuditLogs(applicationId?: string): Promise<AuditEvent[]> {
    await delay();
    if (applicationId) {
      return auditLogs.filter((l) => l.applicationId === applicationId);
    }
    return [...auditLogs];
  }
}
