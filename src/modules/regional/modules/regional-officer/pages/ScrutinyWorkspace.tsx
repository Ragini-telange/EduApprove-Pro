import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getRegionalOfficerService } from '../services';
import {
  Application,
  ApplicationDocument,
  ScrutinyChecklistItem,
  Deficiency,
  ChecklistComplianceStatus,
  DocumentVerificationStatus,
  DeficiencyResolutionStatus,
  CorrectionNotice,
  AIScrutinySuggestion,
  OCREngineInfo,
  DocumentIntelligenceResult,
} from '../types';
import { getStatusBadgeConfig, canTransitionStatus } from '../../../types/workflowTransitions';
import {
  FileCheck2,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Send,
  Building,
  Calendar,
  ExternalLink,
  History,
  Trash2,
  Check,
  FileWarning,
  Cpu,
  Edit3,
  SlidersHorizontal,
  HelpCircle,
  CheckCheck,
  Wand2,
} from 'lucide-react';

export const ScrutinyWorkspace: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const service = getRegionalOfficerService();
  const providerStatus = service.getProviderStatus();

  // Active Application state
  const selectedAppId = paramId || searchParams.get('id') || '';
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [checklist, setChecklist] = useState<ScrutinyChecklistItem[]>([]);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Workspace Tab: 'checklist' | 'documents' | 'deficiencies' | 'rescrutiny' | 'intelligence'
  const [activeTab, setActiveTab] = useState<'checklist' | 'documents' | 'deficiencies' | 'rescrutiny' | 'intelligence'>('checklist');

  // Phase 7: AI Document Intelligence State
  const [aiFindings, setAiFindings] = useState<AIScrutinySuggestion[]>([]);
  const [ocrEngineStatus, setOcrEngineStatus] = useState<OCREngineInfo | null>(null);
  const [selectedIntelDocId, setSelectedIntelDocId] = useState<string>('');
  const [isIntelAnalyzing, setIsIntelAnalyzing] = useState(false);
  const [intelResult, setIntelResult] = useState<DocumentIntelligenceResult | null>(null);
  const [findingFilter, setFindingFilter] = useState<'all' | 'pending' | 'confirmed' | 'edited' | 'dismissed'>('all');
  const [showSetupGuideModal, setShowSetupGuideModal] = useState(false);

  // Edit Finding Modal
  const [editFindingModal, setEditFindingModal] = useState<AIScrutinySuggestion | null>(null);
  const [editFindingTitle, setEditFindingTitle] = useState('');
  const [editFindingSummary, setEditFindingSummary] = useState('');
  const [editFindingFeedback, setEditFindingFeedback] = useState('');

  // Convert to Deficiency Modal
  const [convertDefModal, setConvertDefModal] = useState<AIScrutinySuggestion | null>(null);
  const [convertSeverity, setConvertSeverity] = useState<'minor' | 'major' | 'fatal'>('major');
  const [convertClause, setConvertClause] = useState('AICTE APH 2026-27 Norm 4.1');
  const [convertDeadline, setConvertDeadline] = useState('2026-11-05');

  // Modals state
  const [docPreviewModal, setDocPreviewModal] = useState<ApplicationDocument | null>(null);
  const [docReviewModal, setDocReviewModal] = useState<ApplicationDocument | null>(null);
  const [docReviewStatus, setDocReviewStatus] = useState<DocumentVerificationStatus>('verified');
  const [docObservations, setDocObservations] = useState('');
  const [docDeficiencyReason, setDocDeficiencyReason] = useState('');
  const [docDeficiencyRemarks, setDocDeficiencyRemarks] = useState('');
  const [docCertConfirmed, setDocCertConfirmed] = useState(false);

  const [checklistEditModal, setChecklistEditModal] = useState<ScrutinyChecklistItem | null>(null);
  const [checklistStatus, setChecklistStatus] = useState<ChecklistComplianceStatus>('compliant');
  const [checklistNotes, setChecklistNotes] = useState('');

  const [addDeficiencyModal, setAddDeficiencyModal] = useState(false);
  const [newDefDocId, setNewDefDocId] = useState('');
  const [newDefTitle, setNewDefTitle] = useState('');
  const [newDefCategory, setNewDefCategory] = useState('Land & Building');
  const [newDefClause, setNewDefClause] = useState('AICTE APH 2026-27 Clause 4.1');
  const [newDefSeverity, setNewDefSeverity] = useState<'minor' | 'major' | 'fatal'>('major');
  const [newDefReason, setNewDefReason] = useState('');
  const [newDefAction, setNewDefAction] = useState('');
  const [newDefDeadline, setNewDefDeadline] = useState('2026-11-05');

  const [issueNoticeModal, setIssueNoticeModal] = useState(false);
  const [noticeRemarks, setNoticeRemarks] = useState('');
  const [noticeDeadline, setNoticeDeadline] = useState('2026-11-05');
  const [issuedNotice, setIssuedNotice] = useState<CorrectionNotice | null>(null);

  const [defResolutionModal, setDefResolutionModal] = useState<Deficiency | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<DeficiencyResolutionStatus>('resolved');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  // 1. Fetch list of all assigned applications
  const loadAssignedApps = useCallback(async () => {
    try {
      const apps = await service.getApplications({
        officerJurisdictions: user.jurisdictionStates,
      });
      setAllApplications(apps);
      // If no app selected, default to first or resubmitted app
      if (!selectedAppId && apps.length > 0) {
        const priorityApp = apps.find((a) => a.status === 'resubmitted' || a.status === 'under_scrutiny') || apps[0];
        setSearchParams({ id: priorityApp.id }, { replace: true });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to load applications.' });
    }
  }, [service, user.jurisdictionStates, selectedAppId, setSearchParams]);

  // 2. Fetch specific application details
  const loadAppDetails = useCallback(async (appId: string) => {
    if (!appId) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const [app, docs, chk, defs, suggestions, engineInfo] = await Promise.all([
        service.getApplicationById(appId),
        service.getDocuments(appId),
        service.getChecklist(appId),
        service.getDeficiencies(appId),
        service.getAISuggestions(appId),
        service.getOcrEngineStatus(),
      ]);
      setApplication(app);
      setDocuments(docs);
      setChecklist(chk);
      setDeficiencies(defs);
      setAiFindings(suggestions || []);
      setOcrEngineStatus(engineInfo);
      if (docs.length > 0) {
        setSelectedIntelDocId((prev) => prev || docs[0].id);
      }

      // Default active tab to 'rescrutiny' if application is resubmitted/under_re_scrutiny
      if (app && (app.status === 'resubmitted' || app.status === 'under_re_scrutiny')) {
        setActiveTab('rescrutiny');
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to load scrutiny data.' });
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadAssignedApps();
  }, [loadAssignedApps]);

  useEffect(() => {
    if (selectedAppId) {
      loadAppDetails(selectedAppId);
    }
  }, [selectedAppId, loadAppDetails]);

  // Checklist counts
  const checklistCounts = useMemo(() => {
    const total = checklist.length;
    const compliant = checklist.filter((i) => i.status === 'compliant').length;
    const nonCompliant = checklist.filter((i) => i.status === 'non_compliant').length;
    const pending = checklist.filter((i) => i.status === 'pending').length;
    const na = checklist.filter((i) => i.status === 'not_applicable').length;
    return { total, compliant, nonCompliant, pending, na };
  }, [checklist]);

  // Document counts
  const documentCounts = useMemo(() => {
    const total = documents.length;
    const verified = documents.filter((d) => d.status === 'verified').length;
    const correctionRequired = documents.filter((d) => d.status === 'correction_required').length;
    const rejected = documents.filter((d) => d.status === 'rejected').length;
    const pending = documents.filter((d) => d.status === 'pending').length;
    const updatedInResub = documents.filter((d) => d.isUpdatedInResubmission || d.version > 1).length;
    return { total, verified, correctionRequired, rejected, pending, updatedInResub };
  }, [documents]);

  // Re-scrutiny state helper
  const isReScrutinyMode = useMemo(() => {
    return (
      application?.status === 'resubmitted' ||
      application?.status === 'under_re_scrutiny' ||
      (application?.reScrutinyCount ?? 0) > 0
    );
  }, [application]);

  // Switch application handler
  const handleSelectApp = (appId: string) => {
    if (paramId) {
      navigate(`/regional-officer/scrutiny-workspace/${appId}`);
    } else {
      setSearchParams({ id: appId });
    }
  };

  // Start scrutiny action
  const handleStartScrutiny = async () => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const target = application.status === 'resubmitted' ? 'under_re_scrutiny' : 'under_scrutiny';
      const res = await service.executeWorkflowTransition({
        applicationId: application.id,
        targetStatus: target,
        officerId: user.id,
        officerName: user.name,
        officerRole: user.role,
        remarks: `Commenced ${target === 'under_re_scrutiny' ? 're-scrutiny' : 'initial scrutiny'} on WRO Scrutiny Desk.`,
        stageName: target === 'under_re_scrutiny' ? 'Re-Scrutiny Cycle' : 'Document Scrutiny',
      });
      if (res.success) {
        setApplication(res.application);
        setFeedbackMessage({
          type: 'success',
          text: `Application transitioned to ${target.replace('_', ' ').toUpperCase()} successfully.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Transition failed.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to start scrutiny.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Document Scrutiny Save
  const handleSaveDocReview = async () => {
    if (!docReviewModal || !application) return;
    if (!docObservations.trim() && !docDeficiencyRemarks.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Officer remarks and justification are mandatory when recording a scrutiny decision.',
      });
      return;
    }
    if ((docReviewStatus === 'correction_required' || docReviewStatus === 'rejected') && !docDeficiencyReason.trim() && !docDeficiencyRemarks.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: `Deficiency justification and remedial remarks are required when marking a document as ${docReviewStatus}.`,
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await service.verifyDocument({
        documentId: docReviewModal.id,
        applicationId: application.id,
        status: docReviewStatus,
        observations: docObservations,
        deficiencyReason: docDeficiencyReason,
        deficiencyRemarks: docDeficiencyRemarks,
        officerName: user.name,
      });

      if (res.success) {
        // Also if deficiency marked, record deficiency draft automatically
        if (docReviewStatus === 'correction_required') {
          await service.saveDraftDeficiency({
            applicationId: application.id,
            documentId: docReviewModal.id,
            documentName: docReviewModal.name,
            category: docReviewModal.category,
            clauseReference: 'AICTE APH 2026-27 Norms',
            severity: 'major',
            deficiencyTitle: `Deficiency in ${docReviewModal.name}`,
            detailedReason: docDeficiencyReason || docObservations,
            remedialActionRequired: docDeficiencyRemarks || 'Upload revised certificate with unexpired validity.',
            rectificationDeadline: '2026-11-05',
            officerName: user.name,
          });
        }

        await loadAppDetails(application.id);
        setDocReviewModal(null);
        setFeedbackMessage({
          type: 'success',
          text: `Document "${docReviewModal.code}" evaluated as ${docReviewStatus.toUpperCase()}.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to update document.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error updating document scrutiny.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Checklist Item Save
  const handleSaveChecklistItem = async () => {
    if (!checklistEditModal || !application) return;
    setIsActionLoading(true);
    try {
      const res = await service.updateChecklistStatus(
        checklistEditModal.id,
        checklistStatus,
        checklistNotes || 'Evaluated in accordance with AICTE Approval Process Handbook (APH 2026-27).'
      );
      if (res.success) {
        await loadAppDetails(application.id);
        setChecklistEditModal(null);
        setFeedbackMessage({
          type: 'success',
          text: `Checklist item ${checklistEditModal.code} updated to ${checklistStatus.toUpperCase()}.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error updating checklist item.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Deficiency (Draft or Direct)
  const handleCreateDeficiency = async (isDraft: boolean) => {
    if (!application) return;
    if (!newDefTitle.trim() || !newDefReason.trim() || !newDefAction.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Title, explanation reason, and remedial action required are mandatory.',
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const doc = documents.find((d) => d.id === newDefDocId);
      const res = isDraft
        ? await service.saveDraftDeficiency({
            applicationId: application.id,
            documentId: newDefDocId || undefined,
            documentName: doc?.name || undefined,
            category: newDefCategory,
            clauseReference: newDefClause,
            severity: newDefSeverity,
            deficiencyTitle: newDefTitle,
            detailedReason: newDefReason,
            remedialActionRequired: newDefAction,
            rectificationDeadline: newDefDeadline,
            officerName: user.name,
          })
        : await service.recordDeficiency({
            applicationId: application.id,
            documentId: newDefDocId || undefined,
            documentName: doc?.name || undefined,
            category: newDefCategory,
            clauseReference: newDefClause,
            severity: newDefSeverity,
            deficiencyTitle: newDefTitle,
            detailedReason: newDefReason,
            remedialActionRequired: newDefAction,
            rectificationDeadline: newDefDeadline,
            officerName: user.name,
          });

      if (res.success) {
        await loadAppDetails(application.id);
        setAddDeficiencyModal(false);
        setNewDefTitle('');
        setNewDefReason('');
        setNewDefAction('');
        setFeedbackMessage({
          type: 'success',
          text: isDraft ? 'Draft deficiency saved.' : 'Deficiency officially logged.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error saving deficiency.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Deficiency
  const handleDeleteDeficiency = async (defId: string) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const res = await service.deleteDeficiency(defId);
      if (res.success) {
        await loadAppDetails(application.id);
        setFeedbackMessage({ type: 'success', text: 'Deficiency removed.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error removing deficiency.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Submit Correction Request Notice
  const handleSubmitCorrectionNotice = async () => {
    if (!application) return;
    if (!noticeRemarks.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Official notice remarks and justification instructions are mandatory.',
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await service.submitCorrectionRequest(
        application.id,
        user.id,
        user.name,
        noticeRemarks,
        noticeDeadline
      );

      if (res.success) {
        setIssuedNotice(res.notice);
        await loadAppDetails(application.id);
        setIssueNoticeModal(false);
        setNoticeRemarks('');
        setFeedbackMessage({
          type: 'success',
          text: `Official Correction Notice ${res.notice.noticeNumber} served to institution. Application moved to CORRECTION_REQUIRED.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to submit correction request.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error serving correction request.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update Deficiency Resolution in Re-Scrutiny
  const handleUpdateDeficiencyResolution = async () => {
    if (!defResolutionModal || !application) return;
    if (!resolutionRemarks.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Officer remarks are mandatory when recording deficiency re-scrutiny evaluation.',
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await service.updateDeficiencyResolution(
        defResolutionModal.id,
        resolutionStatus,
        resolutionRemarks,
        user.name
      );

      if (res.success) {
        await loadAppDetails(application.id);
        setDefResolutionModal(null);
        setResolutionRemarks('');
        setFeedbackMessage({
          type: 'success',
          text: `Deficiency marked as ${resolutionStatus.replace('_', ' ').toUpperCase()}.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to update resolution.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error recording resolution.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Recommend Next Stage from Re-Scrutiny
  const handleRecommendNextStage = async (targetStatus: 'pending_evc' | 'under_next_stage') => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const res = await service.executeWorkflowTransition({
        applicationId: application.id,
        targetStatus,
        officerId: user.id,
        officerName: user.name,
        officerRole: user.role,
        remarks:
          targetStatus === 'pending_evc'
            ? 'Re-scrutiny cleared. Physical inspection recommended for newly added lab infrastructure.'
            : 'All deficiencies successfully rectified. Recommended for AICTE Bureau / Senior Authority approval committee.',
        stageName: 'Re-Scrutiny Clearance',
      });

      if (res.success) {
        setApplication(res.application);
        setFeedbackMessage({
          type: 'success',
          text: `Case advanced to ${targetStatus.replace('_', ' ').toUpperCase()}.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Transition failed.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Transition error.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // PHASE 7: AI DOCUMENT INTELLIGENCE HANDLERS
  // --------------------------------------------------------------------------
  const handleAnalyzeDocument = async (docIdToAnalyze?: string) => {
    const targetDocId = docIdToAnalyze || selectedIntelDocId;
    if (!application || !targetDocId) return;

    setIsIntelAnalyzing(true);
    setFeedbackMessage(null);
    try {
      const res = await service.analyzeDocumentWithAI(
        application.id,
        targetDocId,
        user.name,
        user.role
      );
      if (res.success) {
        setIntelResult(res.result);
        setOcrEngineStatus(res.result.engineStatus);
        const updated = await service.getAISuggestions(application.id);
        setAiFindings(updated);
        setFeedbackMessage({
          type: 'success',
          text: `Document intelligence analysis complete for "${res.result.documentName}". ${res.result.findings.length} assistive finding(s) generated.`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Document analysis could not be completed.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Error running document intelligence analysis.',
      });
    } finally {
      setIsIntelAnalyzing(false);
    }
  };

  const handleLaunchAIDocumentAnalysis = (doc: ApplicationDocument) => {
    setSelectedIntelDocId(doc.id);
    setActiveTab('intelligence');
    handleAnalyzeDocument(doc.id);
  };

  const handleConfirmFinding = async (finding: AIScrutinySuggestion) => {
    setIsActionLoading(true);
    try {
      const res = await service.updateAISuggestionReview(finding.id, {
        status: 'confirmed',
        officerName: user.name,
        officerFeedback: 'Officer verified discrepancy against document scan.',
      });
      if (res.success) {
        setAiFindings((prev) => prev.map((f) => (f.id === finding.id ? res.suggestion : f)));
        setFeedbackMessage({
          type: 'success',
          text: `Finding "${finding.title}" confirmed. You can now convert it to a draft deficiency.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to confirm finding.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDismissFinding = async (finding: AIScrutinySuggestion) => {
    setIsActionLoading(true);
    try {
      const res = await service.updateAISuggestionReview(finding.id, {
        status: 'dismissed',
        officerName: user.name,
        officerFeedback: 'Dismissed by officer following regulatory clarification.',
      });
      if (res.success) {
        setAiFindings((prev) => prev.map((f) => (f.id === finding.id ? res.suggestion : f)));
        setFeedbackMessage({
          type: 'success',
          text: `Finding "${finding.title}" marked as dismissed.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to dismiss finding.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenEditFinding = (finding: AIScrutinySuggestion) => {
    setEditFindingModal(finding);
    setEditFindingTitle(finding.editedTitle || finding.title);
    setEditFindingSummary(finding.editedSummary || finding.summary);
    setEditFindingFeedback(finding.officerFeedback || '');
  };

  const handleSaveEditedFinding = async () => {
    if (!editFindingModal) return;
    if (!editFindingTitle.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Finding title cannot be empty.' });
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await service.updateAISuggestionReview(editFindingModal.id, {
        status: 'edited',
        editedTitle: editFindingTitle,
        editedSummary: editFindingSummary,
        officerFeedback: editFindingFeedback || 'Officer edited and customized finding.',
        officerName: user.name,
      });
      if (res.success) {
        setAiFindings((prev) => prev.map((f) => (f.id === editFindingModal.id ? res.suggestion : f)));
        setEditFindingModal(null);
        setFeedbackMessage({
          type: 'success',
          text: `Finding refined and saved as EDITED.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to save edited finding.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenConvertDeficiency = (finding: AIScrutinySuggestion) => {
    setConvertDefModal(finding);
    setConvertSeverity('major');
    setConvertClause(finding.relevantChecklistCode || 'AICTE APH 2026-27 Norm 4.1');
    setConvertDeadline('2026-11-05');
  };

  const handleExecuteConvertToDeficiency = async () => {
    if (!convertDefModal) return;
    setIsActionLoading(true);
    try {
      const res = await service.convertFindingToDraftDeficiency(
        convertDefModal.id,
        user.name,
        convertClause,
        convertSeverity,
        convertDeadline
      );
      if (res.success) {
        if (application) {
          const [updatedDefs, updatedFindings] = await Promise.all([
            service.getDeficiencies(application.id),
            service.getAISuggestions(application.id),
          ]);
          setDeficiencies(updatedDefs);
          setAiFindings(updatedFindings);
        }
        setConvertDefModal(null);
        setFeedbackMessage({
          type: 'success',
          text: `Draft deficiency created in Deficiency Studio. Official notice requires manual issuance.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to convert finding.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error converting to deficiency.' });
    } finally {
      setIsActionLoading(false);
    }
  };


  const statusConfig = application ? getStatusBadgeConfig(application.status) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Application Switcher Bar */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <FileSearch className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Scrutiny & Re-Scrutiny Workspace
                </h1>
                <p className="text-xs text-slate-500">
                  Comprehensive regulatory evaluation, document inspection, clause compliance checklist, and deficiency memos.
                </p>
              </div>
            </div>
          </div>

          {/* Application Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="app-selector" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Select Case:
            </label>
            <div className="relative min-w-[280px]">
              <select
                id="app-selector"
                value={application?.id || ''}
                onChange={(e) => handleSelectApp(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {allApplications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.applicationNumber} — {app.institution.name.slice(0, 32)}... ({app.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <Link
              to="/regional-officer/applications"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 border border-blue-200 bg-blue-50/50 px-3 py-2 rounded-lg"
            >
              Queue
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Selected Application Summary Strip */}
        {application && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Application #</span>
              <span className="text-xs font-bold text-slate-900">{application.applicationNumber}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Institution</span>
              <span className="text-xs font-bold text-slate-900 truncate block" title={application.institution.name}>
                {application.institution.name}
              </span>
              <span className="text-[10px] text-slate-500">{application.institution.city}, {application.institution.state}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Type</span>
              <span className="text-xs font-medium text-slate-700 capitalize">
                {application.type.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Status</span>
              {statusConfig && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}>
                  {statusConfig.label}
                </span>
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Statutory Deadline</span>
              <span className="text-xs font-semibold text-amber-700 inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                {application.deadlineDate}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Feedback Alert */}
      {feedbackMessage && (
        <aside
          aria-label="Action feedback"
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <strong className="font-semibold block">{feedbackMessage.type === 'success' ? 'Success' : 'Notice'}</strong>
            {feedbackMessage.text}
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </aside>
      )}

      {/* 3. Re-Scrutiny Alert Banner (if applicable) */}
      {isReScrutinyMode && (
        <aside aria-label="Re-scrutiny case alert" className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-l-4 border-purple-600 p-4 rounded-xl shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-purple-600 text-white">
                <RotateCcw className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                  Re-Scrutiny Active (Cycle #{application?.reScrutinyCount || 1})
                </h3>
                <p className="text-xs text-purple-800">
                  Institution has resubmitted corrected documents in response to previous deficiency memo.
                  <span className="font-semibold ml-1">
                    {documentCounts.updatedInResub} revised document(s) detected.
                  </span>
                </p>
              </div>
            </div>

            {application?.status === 'resubmitted' && (
              <button
                onClick={handleStartScrutiny}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-2xs inline-flex items-center gap-1.5 shrink-0"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Commence Re-Scrutiny
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 4. Action Banner for Initial Scrutiny Start (if 'submitted') */}
      {application?.status === 'submitted' && (
        <aside aria-label="Initial scrutiny notice" className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-xs text-blue-900">
              <span className="font-bold">Application Awaiting Scrutiny Commencement:</span> Currently in
              <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-800 font-mono text-[11px]">submitted</code>
              state. Advance to <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-800 font-mono text-[11px]">under_scrutiny</code> to evaluate documents and checklist items.
            </div>
          </div>
          <button
            onClick={handleStartScrutiny}
            disabled={isActionLoading}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-2xs shrink-0 inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Commence Scrutiny
          </button>
        </aside>
      )}

      {/* 5. Main Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Configurable Regulatory Checklist</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {checklistCounts.compliant}/{checklistCounts.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Inspection & Review</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {documentCounts.verified}/{documentCounts.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deficiencies')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'deficiencies'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileWarning className="w-4 h-4" />
            <span>Deficiency Studio & Notices</span>
            {deficiencies.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {deficiencies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rescrutiny')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'rescrutiny'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <span>Re-Scrutiny & Diff Tracker</span>
            {isReScrutinyMode && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'intelligence'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Document Intelligence</span>
            {aiFindings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                {aiFindings.filter((f) => f.reviewState === 'pending_review' || (!f.reviewState && f.status === 'pending_review')).length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: REGULATORY CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Checklist Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Requirements</span>
                  <span className="text-lg font-bold text-slate-900">{checklistCounts.total}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[11px] font-medium text-emerald-700 block">Compliant</span>
                  <span className="text-lg font-bold text-emerald-800">{checklistCounts.compliant}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-[11px] font-medium text-rose-700 block">Non-Compliant</span>
                  <span className="text-lg font-bold text-rose-800">{checklistCounts.nonCompliant}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-medium text-amber-700 block">Pending Evaluation</span>
                  <span className="text-lg font-bold text-amber-800">{checklistCounts.pending}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500 block">Not Applicable</span>
                  <span className="text-lg font-bold text-slate-700">{checklistCounts.na}</span>
                </div>
              </div>

              {/* Checklist Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                      <th className="py-3 px-4">Code & Category</th>
                      <th className="py-3 px-4">Requirement & APH Clause</th>
                      <th className="py-3 px-4">Associated Docs</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Officer Remarks & Evidence</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {checklist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-mono font-bold text-slate-900 block">{item.code}</span>
                          <span className="text-[10px] text-slate-500">{item.category}</span>
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-sm">
                          <strong className="text-slate-900 font-semibold block">{item.title}</strong>
                          <p className="text-[11px] text-slate-600 mt-0.5">{item.requirementText}</p>
                          <span className="inline-block mt-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.normReference}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-wrap gap-1">
                            {item.associatedDocCodes.map((code) => (
                              <span key={code} className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {code}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              item.status === 'compliant'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'non_compliant'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.status === 'not_applicable'
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          {item.officerNotes ? (
                            <p className="text-[11px] text-slate-700">{item.officerNotes}</p>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No notes recorded</span>
                          )}
                          {item.previousReviewStatus && (
                            <div className="mt-1.5 p-1.5 bg-purple-50 rounded border border-purple-200 text-[10px] text-purple-900">
                              <span className="font-bold">Prior Review: </span>
                              {item.previousReviewStatus.toUpperCase()} — {item.previousReviewRemarks}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top text-right">
                          <button
                            onClick={() => {
                              setChecklistEditModal(item);
                              setChecklistStatus(item.status);
                              setChecklistNotes(item.officerNotes || '');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT INSPECTION & REVIEW */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Regulatory Documents</h3>
                  <p className="text-xs text-slate-500">
                    Verify each document against AICTE requirements. Status changes require justification remarks and confirmation.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Verified:</span>
                  <span className="font-bold text-emerald-700">{documentCounts.verified}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">Pending:</span>
                  <span className="font-bold text-amber-700">{documentCounts.pending}</span>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-2xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-800">{doc.code}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              v{doc.version}
                            </span>
                            {doc.isUpdatedInResubmission && (
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">
                                Updated in Resubmission
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>File: <strong className="text-slate-700 font-mono">{doc.fileName}</strong> ({doc.fileSize})</span>
                            <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            {doc.expiryDate && (
                              <span className="text-amber-700 font-medium">
                                Expiry: {doc.expiryDate}
                              </span>
                            )}
                          </div>

                          {/* Observations / Remarks */}
                          {doc.observations && (
                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                              <strong className="text-slate-900 font-semibold">Officer Observation:</strong> {doc.observations}
                            </p>
                          )}

                          {doc.deficiencyReason && (
                            <p className="text-xs text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 mt-2">
                              <strong className="text-rose-900 font-semibold">Deficiency Flagged:</strong> {doc.deficiencyReason}
                            </p>
                          )}

                          {doc.previousVersionRemarks && (
                            <p className="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200 mt-2">
                              <strong className="text-purple-950 font-semibold">Previous Version Note:</strong> {doc.previousVersionRemarks}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border ${
                            doc.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : doc.status === 'correction_required'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : doc.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {doc.status.replace('_', ' ').toUpperCase()}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => setDocPreviewModal(doc)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Preview
                          </button>

                          <button
                            onClick={() => handleLaunchAIDocumentAnalysis(doc)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-1.5 transition-colors"
                            title="Run AI document intelligence analysis"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Analyze with AI
                          </button>

                          <button
                            onClick={() => {
                              setDocReviewModal(doc);
                              setDocReviewStatus(doc.status === 'pending' ? 'verified' : doc.status);
                              setDocObservations(doc.observations || '');
                              setDocDeficiencyReason(doc.deficiencyReason || '');
                              setDocDeficiencyRemarks(doc.deficiencyRemarks || '');
                              setDocCertConfirmed(false);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            Evaluate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEFICIENCY STUDIO & NOTICES */}
          {activeTab === 'deficiencies' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recorded Deficiencies & Correction Notice Studio</h3>
                  <p className="text-xs text-slate-500">
                    Draft or record non-compliances. Once finalized, issue an official AICTE Correction Notice with strict rectification deadline.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddDeficiencyModal(true)}
                    className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    Add Deficiency Item
                  </button>
                  {deficiencies.length > 0 && (
                    <button
                      onClick={() => setIssueNoticeModal(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      Issue Correction Request Notice
                    </button>
                  )}
                </div>
              </div>

              {/* Deficiencies Cards */}
              {deficiencies.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No Deficiencies Currently Logged</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    All evaluated items comply with AICTE norms. If discrepancies arise during document scrutiny, log them using the button above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deficiencies.map((def) => (
                    <div
                      key={def.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                def.severity === 'fatal'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : def.severity === 'major'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {def.severity} severity
                            </span>
                            <span className="text-xs text-slate-300">•</span>
                            <h4 className="text-sm font-bold text-slate-900">{def.deficiencyTitle}</h4>
                            {def.isDraft ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                DRAFT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ISSUED
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 mt-1">
                            <strong className="text-slate-900 font-semibold">Reason:</strong> {def.detailedReason}
                          </p>

                          <p className="text-xs text-blue-800 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 mt-2">
                            <strong className="text-blue-950 font-semibold">Remedial Action Required:</strong> {def.remedialActionRequired}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                            <span>Category: <strong className="text-slate-700">{def.category}</strong></span>
                            <span>Clause: <strong className="text-slate-700">{def.clauseReference}</strong></span>
                            <span>Rectification Deadline: <strong className="text-rose-700">{def.rectificationDeadline}</strong></span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDeleteDeficiency(def.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete deficiency"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RE-SCRUTINY & DIFF TRACKER */}
          {activeTab === 'rescrutiny' && (
            <div className="space-y-6">
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  Re-Scrutiny & Document Version Diff Analyzer
                </div>
                <p className="text-xs text-purple-800 mt-1">
                  Compare corrected document versions submitted by the institution against earlier scrutiny records and record deficiency resolution status.
                </p>
              </div>

              {/* 1. Updated Documents Diff Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Updated Documents in this Resubmission Cycle
                </h4>

                {documents.filter((d) => d.isUpdatedInResubmission || d.version > 1).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                    No updated document versions recorded for this application.
                  </p>
                ) : (
                  documents
                    .filter((d) => d.isUpdatedInResubmission || d.version > 1)
                    .map((doc) => (
                      <div key={doc.id} className="p-4 rounded-xl border border-purple-200 bg-white shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="font-mono text-xs font-bold text-purple-700">{doc.code}</span>
                            <h5 className="text-sm font-bold text-slate-900">{doc.name}</h5>
                            <span className="text-[11px] text-slate-500">Current File: {doc.fileName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Version {doc.version}
                          </span>
                        </div>

                        {/* Version Comparison Table */}
                        {doc.versions && doc.versions.length > 0 && (
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3">Version</th>
                                  <th className="py-2 px-3">File Name & Size</th>
                                  <th className="py-2 px-3">Uploaded On</th>
                                  <th className="py-2 px-3">Scrutiny State & Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {doc.versions.map((ver) => (
                                  <tr key={ver.version} className={ver.version === doc.version ? 'bg-purple-50/40 font-medium' : ''}>
                                    <td className="py-2 px-3 font-bold font-mono">v{ver.version}</td>
                                    <td className="py-2 px-3">
                                      <span className="font-mono text-[11px] text-slate-800">{ver.fileName}</span>
                                      <span className="text-slate-400 text-[10px] ml-1">({ver.fileSize})</span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-500">{new Date(ver.uploadedAt).toLocaleString()}</td>
                                    <td className="py-2 px-3">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 mr-2">
                                        {ver.status.toUpperCase()}
                                      </span>
                                      <span className="text-slate-700 text-[11px]">{ver.observations || ver.diffSummary}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* 2. Prior Deficiencies Resolution Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Prior Deficiency Resolution Evaluation
                </h4>

                {deficiencies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                    No active deficiencies found to evaluate.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deficiencies.map((def) => (
                      <div
                        key={def.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                def.isResolved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : def.resolutionStatus === 'requires_further_review'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {def.resolutionStatus ? def.resolutionStatus.replace('_', ' ').toUpperCase() : def.isResolved ? 'RESOLVED' : 'OUTSTANDING'}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900">{def.deficiencyTitle}</h5>
                          </div>
                          <p className="text-xs text-slate-600">{def.detailedReason}</p>
                          {def.resolutionRemarks && (
                            <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                              <strong>Officer Evaluation:</strong> {def.resolutionRemarks}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setDefResolutionModal(def);
                            setResolutionStatus(def.resolutionStatus || (def.isResolved ? 'resolved' : 'still_outstanding'));
                            setResolutionRemarks(def.resolutionRemarks || '');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 shrink-0 shadow-2xs"
                        >
                          Record Resolution
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Re-Scrutiny Decision Panel */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Re-Scrutiny Workflow Decision
                  </h4>
                  <p className="text-xs text-slate-500">
                    Once all prior deficiencies and resubmitted documents are reviewed, advance the case to the appropriate next stage.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRecommendNextStage('pending_evc')}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Recommend EVC Inspection
                  </button>

                  <button
                    onClick={() => handleRecommendNextStage('under_next_stage')}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Recommend for Bureau Approval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI-ASSISTED DOCUMENT INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              {/* Header Strip & Document Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 rounded-xl border border-indigo-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      AI Document Intelligence & Statutory Copilot
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      AICTE Scrutiny Assistant
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Automated OCR text inspection, APH checklist comparison, and discrepancy identification. Findings are non-binding suggestions requiring officer verification.
                  </p>
                </div>

                {/* Document Selector & Action Button */}
                <div className="flex items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <label htmlFor="intel-doc-select" className="sr-only">Select Document to Inspect</label>
                    <select
                      id="intel-doc-select"
                      value={selectedIntelDocId}
                      onChange={(e) => {
                        setSelectedIntelDocId(e.target.value);
                        setIntelResult(null);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code}: {d.name} ({d.fileName})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => handleAnalyzeDocument()}
                    disabled={isIntelAnalyzing || !selectedIntelDocId}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs inline-flex items-center gap-2 transition-colors shrink-0"
                  >
                    {isIntelAnalyzing ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Scan...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Run Scrutiny Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Statutory Safeguard & OCR Status Banners */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Regulatory Non-Binding Safeguard */}
                <div className="md:col-span-2 p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <strong className="font-bold text-amber-900 block">
                      Mandatory Regulatory Safeguard: Assistive Intelligence Only
                    </strong>
                    <p className="text-amber-800 leading-relaxed">
                      Machine-generated findings are preliminary suggestions to assist the Regional Officer. They cannot alter official application status or issue binding deficiency notices. Every finding must be verified, edited, or confirmed by the officer prior to any regulatory action.
                    </p>
                  </div>
                </div>

                {/* 2. OCR Engine Status Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        OCR Engine Status
                      </span>
                      {ocrEngineStatus?.isAvailable ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Operational
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Info className="w-3 h-3 text-amber-600" /> Assisted Sandbox
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-1">
                      {ocrEngineStatus?.engineName || 'Tesseract OCR / PDF Extractor'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {ocrEngineStatus?.message || 'Host extraction service active for statutory scrutiny.'}
                    </p>
                  </div>
                  {!ocrEngineStatus?.isAvailable && (
                    <button
                      onClick={() => setShowSetupGuideModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 text-left mt-2 inline-flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      View Host Setup Guide
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Document Metadata Strip & Extracted Text Preview */}
              {selectedIntelDocId && (
                (() => {
                  const doc = documents.find((d) => d.id === selectedIntelDocId);
                  if (!doc) return null;
                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                          <span className="text-xs text-slate-400 font-mono">({doc.fileName})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {doc.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>Size: <strong className="text-slate-700">{doc.fileSize}</strong></span>
                          <span>Version: <strong className="text-slate-700">v{doc.version}</strong></span>
                          <span>Verification State: <strong className="text-slate-800 uppercase">{doc.status}</strong></span>
                        </div>
                      </div>

                      {/* Text Excerpt Snippet */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Extracted Text / OCR Sample:
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Scanned with 300 DPI layout analyzer
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {intelResult?.extractedTextSnippet || doc.ocrExtractedText || `[Extracted Document Instrument] Title: ${doc.name} | Application Ref: ${application?.applicationNumber} | Category: ${doc.category} | File: ${doc.fileName} | Verification Record: Clean scanned instrument.`}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Findings Filtering Bar & Counts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 mr-1">Filter Findings:</span>
                  {(['all', 'pending', 'confirmed', 'edited', 'dismissed'] as const).map((filter) => {
                    const count =
                      filter === 'all'
                        ? aiFindings.length
                        : filter === 'pending'
                        ? aiFindings.filter((f) => f.reviewState === 'pending_review' || (!f.reviewState && f.status === 'pending_review')).length
                        : filter === 'confirmed'
                        ? aiFindings.filter((f) => f.reviewState === 'confirmed' || f.status === 'confirmed_by_officer').length
                        : filter === 'edited'
                        ? aiFindings.filter((f) => f.reviewState === 'edited').length
                        : aiFindings.filter((f) => f.reviewState === 'dismissed' || f.status === 'dismissed_by_officer').length;

                    return (
                      <button
                        key={filter}
                        onClick={() => setFindingFilter(filter)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                          findingFilter === filter
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {filter.replace('_', ' ')} ({count})
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs text-slate-500">
                  Showing {
                    aiFindings.filter((f) => {
                      if (findingFilter === 'all') return true;
                      if (findingFilter === 'pending') return f.reviewState === 'pending_review' || (!f.reviewState && f.status === 'pending_review');
                      if (findingFilter === 'confirmed') return f.reviewState === 'confirmed' || f.status === 'confirmed_by_officer';
                      if (findingFilter === 'edited') return f.reviewState === 'edited';
                      if (findingFilter === 'dismissed') return f.reviewState === 'dismissed' || f.status === 'dismissed_by_officer';
                      return true;
                    }).length
                  } finding(s)
                </span>
              </div>

              {/* Findings List Display */}
              {isIntelAnalyzing ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-xl space-y-3">
                  <RotateCcw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Analyzing Document Scan...</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Executing optical text extraction, clause validation, and deficiency risk matching against AICTE Approval Process Handbook (2026-27).
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredFindings = aiFindings.filter((f) => {
                    if (findingFilter === 'all') return true;
                    if (findingFilter === 'pending') return f.reviewState === 'pending_review' || (!f.reviewState && f.status === 'pending_review');
                    if (findingFilter === 'confirmed') return f.reviewState === 'confirmed' || f.status === 'confirmed_by_officer';
                    if (findingFilter === 'edited') return f.reviewState === 'edited';
                    if (findingFilter === 'dismissed') return f.reviewState === 'dismissed' || f.status === 'dismissed_by_officer';
                    return true;
                  });

                  if (filteredFindings.length === 0) {
                    return (
                      <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-800">
                          {findingFilter === 'all'
                            ? 'No Findings Recorded for this Document'
                            : `No Findings in "${findingFilter.toUpperCase()}" Status`}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          Click "Run Scrutiny Analysis" above to inspect the document or select a different filter category.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredFindings.map((finding) => {
                        const isPending = finding.reviewState === 'pending_review' || (!finding.reviewState && finding.status === 'pending_review');
                        const isConfirmed = finding.reviewState === 'confirmed' || (!finding.reviewState && finding.status === 'confirmed_by_officer');
                        const isEdited = finding.reviewState === 'edited';
                        const isDismissed = finding.reviewState === 'dismissed' || (!finding.reviewState && finding.status === 'dismissed_by_officer');

                        return (
                          <div
                            key={finding.id}
                            className={`p-5 rounded-xl border transition-colors shadow-2xs ${
                              isConfirmed
                                ? 'bg-emerald-50/20 border-emerald-200'
                                : isEdited
                                ? 'bg-blue-50/20 border-blue-200'
                                : isDismissed
                                ? 'bg-slate-50/70 border-slate-200 opacity-70'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                {/* Header Tags */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Machine Suggestion Chip */}
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <Sparkles className="w-3 h-3" />
                                    AI SUGGESTION
                                  </span>

                                  {/* Type Chip */}
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                                    {finding.type.replace('_', ' ')}
                                  </span>

                                  {/* Review State Chip */}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      isConfirmed
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : isEdited
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : isDismissed
                                        ? 'bg-slate-200 text-slate-700'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    {isEdited
                                      ? 'EDITED & CONFIRMED'
                                      : isConfirmed
                                      ? 'CONFIRMED'
                                      : isDismissed
                                      ? 'DISMISSED'
                                      : 'PENDING OFFICER REVIEW'}
                                  </span>

                                  {/* Confidence Badge */}
                                  {finding.confidenceScore !== undefined && (
                                    finding.confidenceScore < 0.60 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        {finding.confidenceLabel || `Low Confidence (${Math.round(finding.confidenceScore * 100)}%) — Manual Check Recommended`}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                                        {finding.confidenceLabel || `Confidence: ${Math.round(finding.confidenceScore * 100)}%`}
                                      </span>
                                    )
                                  )}

                                  {/* Page Reference (only if supplied) */}
                                  {(finding.pageReference || finding.sourcePage) && (
                                    <span className="text-[11px] font-medium text-slate-500">
                                      Location: <strong className="text-slate-700">{finding.pageReference || `Page ${finding.sourcePage}`}</strong>
                                    </span>
                                  )}
                                </div>

                                {/* Issue Title */}
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {finding.editedTitle || finding.title}
                                    {finding.editedTitle && (
                                      <span className="ml-2 text-[11px] font-normal text-blue-600 italic">
                                        (Edited by Officer)
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {finding.editedSummary || finding.summary}
                                  </p>
                                </div>

                                {/* Relevant Checklist Norm */}
                                {finding.relevantChecklistCode && (
                                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="text-slate-500 font-semibold">Checklist Norm:</span>
                                    <span className="font-mono font-bold text-slate-800">{finding.relevantChecklistCode}</span>
                                    {finding.relevantChecklistTitle && (
                                      <span className="text-slate-600">• {finding.relevantChecklistTitle}</span>
                                    )}
                                  </div>
                                )}

                                {/* Supporting Extracted Text */}
                                {(finding.supportingExtractedText || finding.evidenceQuote) && (
                                  <div className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100 text-xs">
                                    <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-0.5">
                                      Supporting Evidence Excerpt
                                    </span>
                                    <blockquote className="text-slate-700 italic border-l-2 border-indigo-400 pl-2">
                                      "{finding.supportingExtractedText || finding.evidenceQuote}"
                                    </blockquote>
                                  </div>
                                )}

                                {/* Suggested Follow-up */}
                                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                  <strong className="text-slate-900 font-semibold">Suggested Officer Follow-Up: </strong>
                                  {finding.suggestedFollowUp || finding.suggestedAction}
                                </div>

                                {/* Officer Review History / Feedback */}
                                {finding.reviewedBy && (
                                  <div className="text-[11px] text-slate-500 pt-1">
                                    Reviewed by <strong className="text-slate-700">{finding.reviewedBy}</strong> on{' '}
                                    {finding.reviewedAt?.slice(0, 10)}.
                                    {finding.officerFeedback && (
                                      <span className="text-slate-700 block mt-0.5 font-medium">
                                        Remarks: "{finding.officerFeedback}"
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Officer Action Buttons */}
                              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmFinding(finding)}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs inline-flex items-center justify-center gap-1.5"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Confirm Finding
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditFinding(finding)}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center justify-center gap-1.5"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      Edit & Refine
                                    </button>

                                    <button
                                      onClick={() => handleDismissFinding(finding)}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1.5"
                                    >
                                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                      Dismiss
                                    </button>
                                  </>
                                )}

                                {(isConfirmed || isEdited) && (
                                  <>
                                    <button
                                      onClick={() => handleOpenConvertDeficiency(finding)}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs inline-flex items-center justify-center gap-1.5"
                                    >
                                      <FileWarning className="w-3.5 h-3.5" />
                                      Convert to Draft Deficiency
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditFinding(finding)}
                                      disabled={isActionLoading}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Edit
                                    </button>

                                    <button
                                      onClick={() => handleDismissFinding(finding)}
                                      disabled={isActionLoading}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}

                                {isDismissed && (
                                  <button
                                    onClick={() => handleConfirmFinding(finding)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                                  >
                                    Re-open for Review
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Document Preview Modal */}
      {docPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{docPreviewModal.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{docPreviewModal.fileName} (v{docPreviewModal.version})</p>
                </div>
              </div>
              <button
                onClick={() => setDocPreviewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center py-10">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 uppercase">Simulated AICTE Document Viewer</h4>
                <p className="text-xs text-slate-500 mt-1">
                  File: <code className="font-mono text-slate-800">{docPreviewModal.fileName}</code> ({docPreviewModal.fileSize})
                </p>
                <div className="mt-3">
                  <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700">
                    PDF Document (Signed AICTE Submission)
                  </span>
                </div>
              </div>

              {docPreviewModal.ocrExtractedText && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    OCR Extracted Text (Assistive Verification)
                  </span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {docPreviewModal.ocrExtractedText}
                  </div>
                </div>
              )}

              {docPreviewModal.aiScrutinySummary && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900">
                    <strong className="font-semibold block">AI Scrutiny Analysis:</strong>
                    {docPreviewModal.aiScrutinySummary}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDocPreviewModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Document Scrutiny Evaluation */}
      {docReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Record Scrutiny Evaluation — {docReviewModal.code}
                </h3>
              </div>
              <button
                onClick={() => setDocReviewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Evaluation Outcome <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocReviewStatus('verified')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                      docReviewStatus === 'verified'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Verified Compliant
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocReviewStatus('correction_required')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                      docReviewStatus === 'correction_required'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Correction Required
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocReviewStatus('rejected')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                      docReviewStatus === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Reject Document
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Officer Technical Observations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={docObservations}
                  onChange={(e) => setDocObservations(e.target.value)}
                  placeholder="Enter detailed observations verifying acreage, validity dates, seal/signature..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(docReviewStatus === 'correction_required' || docReviewStatus === 'rejected') && (
                <>
                  <div>
                    <label className="text-xs font-bold text-rose-700 block mb-1">
                      Deficiency Reason <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={docDeficiencyReason}
                      onChange={(e) => setDocDeficiencyReason(e.target.value)}
                      placeholder="e.g. Fire NOC validity expired on 14/10/2026"
                      className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-rose-700 block mb-1">
                      Remedial Instructions for Institution <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={docDeficiencyRemarks}
                      onChange={(e) => setDocDeficiencyRemarks(e.target.value)}
                      placeholder="Specify what document, renewal receipt, or affidavit must be resubmitted..."
                      className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docCertConfirmed}
                    onChange={(e) => setDocCertConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">
                    I confirm that I have evaluated this regulatory submission against the AICTE Approval Process Handbook (APH 2026-27) norms.
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setDocReviewModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocReview}
                disabled={isActionLoading || !docCertConfirmed}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-2xs"
              >
                {isActionLoading ? 'Saving...' : 'Save Evaluation Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Checklist Item Review */}
      {checklistEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Checklist Item: {checklistEditModal.code}
              </h3>
              <button
                onClick={() => setChecklistEditModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Requirement</span>
                <h4 className="text-xs font-bold text-slate-800">{checklistEditModal.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1">{checklistEditModal.requirementText}</p>
                <span className="inline-block mt-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {checklistEditModal.normReference}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Compliance Status</label>
                <select
                  value={checklistStatus}
                  onChange={(e) => setChecklistStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="compliant">Compliant (Meets Norms)</option>
                  <option value="non_compliant">Non-Compliant (Deficiency Found)</option>
                  <option value="pending">Pending Further Review</option>
                  <option value="not_applicable">Not Applicable to this Program</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Officer Finding Notes</label>
                <textarea
                  rows={3}
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  placeholder="Record specific calculations, survey numbers, or clause conformity observations..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setChecklistEditModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChecklistItem}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs"
              >
                Save Finding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Deficiency */}
      {addDeficiencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Scrutiny Deficiency Item</h3>
              <button
                onClick={() => setAddDeficiencyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Associated Document</label>
                <select
                  value={newDefDocId}
                  onChange={(e) => setNewDefDocId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="">General Application Deficiency</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={newDefSeverity}
                    onChange={(e) => setNewDefSeverity(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="fatal">Fatal Non-Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rectification Deadline</label>
                  <input
                    type="date"
                    value={newDefDeadline}
                    onChange={(e) => setNewDefDeadline(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deficiency Title</label>
                <input
                  type="text"
                  value={newDefTitle}
                  onChange={(e) => setNewDefTitle(e.target.value)}
                  placeholder="e.g. Fire Safety Certificate Lapsed"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Explanation Reason</label>
                <textarea
                  rows={2}
                  value={newDefReason}
                  onChange={(e) => setNewDefReason(e.target.value)}
                  placeholder="State the non-compliance clearly..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Remedial Action Required</label>
                <textarea
                  rows={2}
                  value={newDefAction}
                  onChange={(e) => setNewDefAction(e.target.value)}
                  placeholder="Specify what document or correction the institution must submit..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setAddDeficiencyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateDeficiency(true)}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateDeficiency(false)}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs"
              >
                Log Deficiency
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Issue Official Correction Request Notice */}
      {issueNoticeModal && application && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-950">
                  Issue Official AICTE Correction Notice
                </h3>
              </div>
              <button
                onClick={() => setIssueNoticeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                This will officially transition Application <strong className="text-slate-900">{application.applicationNumber}</strong> to{' '}
                <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">CORRECTION_REQUIRED</span>.
                The institution will be served with the itemized deficiency memo below.
              </p>

              {/* Itemized summary */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">
                  Deficiencies Included in Notice ({deficiencies.length})
                </span>
                <ul className="text-xs space-y-1 divide-y divide-slate-100">
                  {deficiencies.map((d, idx) => (
                    <li key={d.id} className="pt-1 flex items-start justify-between gap-2">
                      <span>{idx + 1}. <strong>{d.deficiencyTitle}</strong> ({d.category})</span>
                      <span className="text-[10px] uppercase font-bold text-rose-700">{d.severity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rectification Deadline</label>
                <input
                  type="date"
                  value={noticeDeadline}
                  onChange={(e) => setNoticeDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Notice Remarks & Directive <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={noticeRemarks}
                  onChange={(e) => setNoticeRemarks(e.target.value)}
                  placeholder="Enter statutory instructions and instructions for portal re-upload..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIssueNoticeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCorrectionNotice}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-2xs"
              >
                Confirm & Serve Correction Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Re-Scrutiny Deficiency Resolution */}
      {defResolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Evaluate Deficiency Resolution
              </h3>
              <button
                onClick={() => setDefResolutionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Deficiency</span>
                <h4 className="text-xs font-bold text-slate-900">{defResolutionModal.deficiencyTitle}</h4>
                <p className="text-xs text-slate-600 mt-1">{defResolutionModal.detailedReason}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Resolution Decision</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="resolved">Resolved (Corrected Document Complies with Norms)</option>
                  <option value="still_outstanding">Still Outstanding (Deficiency Persists)</option>
                  <option value="requires_further_review">Requires Further Review / Hearing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Officer Re-Scrutiny Evaluation Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Record why the resubmission satisfies or fails to satisfy the deficiency..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setDefResolutionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDeficiencyResolution}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-2xs"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit & Refine AI Finding */}
      {editFindingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit & Refine Machine Finding</h3>
              </div>
              <button
                onClick={() => setEditFindingModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Finding Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFindingTitle}
                  onChange={(e) => setEditFindingTitle(e.target.value)}
                  placeholder="Enter customized finding title..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detailed Explanation / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editFindingSummary}
                  onChange={(e) => setEditFindingSummary(e.target.value)}
                  placeholder="Explain the statutory defect or discrepancy..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Officer Remarks & Review Justification
                </label>
                <textarea
                  rows={2}
                  value={editFindingFeedback}
                  onChange={(e) => setEditFindingFeedback(e.target.value)}
                  placeholder="Add officer comments clarifying why this item is refined..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setEditFindingModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedFinding}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-2xs"
              >
                Save & Confirm Edits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Convert Finding to Draft Deficiency */}
      {convertDefModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Convert Finding to Draft Deficiency</h3>
                  <p className="text-[11px] text-slate-500">Adds an itemized draft non-compliance into the Deficiency Studio</p>
                </div>
              </div>
              <button
                onClick={() => setConvertDefModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">Selected Finding:</span>
                <strong className="text-slate-900 block">{convertDefModal.editedTitle || convertDefModal.title}</strong>
                <p className="text-slate-600 mt-1">{convertDefModal.editedSummary || convertDefModal.summary}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deficiency Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={convertSeverity}
                  onChange={(e) => setConvertSeverity(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="minor">Minor (Condonable / Clarification Required)</option>
                  <option value="major">Major (Statutory Non-Compliance / Mandatory Rectification)</option>
                  <option value="fatal">Fatal (Fatal Disqualification Norm / Non-Curable)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  AICTE Clause Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={convertClause}
                  onChange={(e) => setConvertClause(e.target.value)}
                  placeholder="e.g. AICTE APH 2026-27 Clause 4.1"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rectification Statutory Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={convertDeadline}
                  onChange={(e) => setConvertDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <strong className="font-semibold text-slate-900 block mb-0.5">Statutory Protection Notice:</strong>
                Draft deficiencies remain unissued and can be revised or deleted anytime. Application status will remain unchanged until the officer officially issues the Correction Request notice.
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setConvertDefModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConvertToDeficiency}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-2xs"
              >
                Save as Draft Deficiency
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OCR Host Setup Guide */}
      {showSetupGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">OCR & Document Extraction Setup Guide</h3>
              </div>
              <button
                onClick={() => setShowSetupGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                EduApprove Pro utilizes lightweight local OCR libraries (Tesseract OCR / PyPDF) on the host backend to extract statutory texts without sending confidential documents to external third-party services.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                  Step-by-Step Server Setup (Windows)
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-sans">
                  <li>
                    <strong>Install Tesseract OCR Binary:</strong> Download the installer for Windows from{' '}
                    <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">UB-Mannheim/tesseract/wiki</code>.
                  </li>
                  <li>
                    <strong>Add to System Environment:</strong> Ensure <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">C:\Program Files\Tesseract-OCR</code> is included in your system PATH variable.
                  </li>
                  <li>
                    <strong>Install Python Bindings:</strong> In the backend environment, run:
                    <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg mt-1 font-mono text-[11px] overflow-x-auto">
                      pip install pytesseract pypdf pillow
                    </pre>
                  </li>
                  <li>
                    <strong>Verify Status:</strong> Restart the FastAPI backend server on port 8000. The OCR Engine Status banner will automatically update to <em>Operational</em>.
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <strong>Assisted Sandbox Active:</strong> In development or demo mode without Tesseract installed, EduApprove Pro runs in rule-assisted scrutiny simulation mode using verified AICTE sample document metadata.
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowSetupGuideModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
