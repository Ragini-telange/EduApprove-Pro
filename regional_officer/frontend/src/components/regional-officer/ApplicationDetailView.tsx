import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Application,
  ApplicationDocument,
  ScrutinyChecklistItem,
  ScrutinyDeficiency,
  AIScrutinySuggestion,
  DocumentVerificationStatus,
  EVCRecord,
  ComplianceItem,
  LateSubmissionRequest,
} from '../../types';
import { getAvailableTransitions, TransitionRule } from '../../types/workflowTransitions';
import { calculateDeadlineDaysRemaining } from '../../modules/regional-officer/utils/dateHelpers';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  ArrowLeft,
  Building,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  History,
  CalendarCheck,
  ShieldAlert,
  ClockAlert,
  CheckCircle2,
  Send,
  Eye,
  FileCheck2,
  Users,
  AlertCircle,
  ShieldCheck,
  FileSearch,
} from 'lucide-react';

export const ApplicationDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();

  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [checklist, setChecklist] = useState<ScrutinyChecklistItem[]>([]);
  const [deficiencies, setDeficiencies] = useState<ScrutinyDeficiency[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIScrutinySuggestion[]>([]);
  const [evcRecord, setEvcRecord] = useState<EVCRecord | null>(null);
  const [complianceList, setComplianceList] = useState<ComplianceItem[]>([]);
  const [lateRequestsList, setLateRequestsList] = useState<LateSubmissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tabs
  const [activeTab, setActiveTab] = useState<
    'documents' | 'checklist' | 'deficiencies' | 'evc' | 'compliance' | 'late_requests' | 'ai_assistant' | 'timeline'
  >('documents');

  // Selected document for scrutiny modal
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [docObservation, setDocObservation] = useState('');
  const [docStatus, setDocStatus] = useState<DocumentVerificationStatus>('verified');
  const [docDeficiencyReason, setDocDeficiencyReason] = useState('');
  const [docDeficiencyRemarks, setDocDeficiencyRemarks] = useState('');

  // Workflow Transition Modal
  const [selectedTransition, setSelectedTransition] = useState<TransitionRule | null>(null);
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      dataService.getApplicationById(id),
      dataService.getDocumentsByApplicationId(id),
      dataService.getChecklistByApplicationId(id),
      dataService.getDeficienciesByApplicationId(id),
      dataService.getAISuggestionsByApplicationId(id),
      dataService.getEVCRecords(),
      dataService.getComplianceItems(),
      dataService.getLateRequests(),
    ]).then(([app, docs, chk, defs, ai, evcs, compliances, lateReqs]) => {
      setApplication(app);
      setDocuments(docs);
      setChecklist(chk);
      setDeficiencies(defs);
      setAiSuggestions(ai);

      if (app) {
        // Match EVC Record
        const matchedEVC = evcs.find((e) => e.applicationId === app.id || e.id === app.evcVisitId);
        setEvcRecord(matchedEVC || null);

        // Match Compliance Items
        const matchedCompliance = compliances.filter(
          (c) => c.institutionId === app.institutionId || c.applicationId === app.id
        );
        setComplianceList(matchedCompliance);

        // Match Late Requests
        const matchedLate = lateReqs.filter((l) => l.applicationId === app.id);
        setLateRequestsList(matchedLate);
      }

      setIsLoading(false);
    });
  }, [id, dataService, refreshKey]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800">Retrieving Statutory Case Record...</h3>
        <p className="text-xs text-slate-500 mt-1">Verifying institutional documents and regulatory history.</p>
      </div>
    );
  }

  // Handle Invalid Application ID
  if (!application) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Application Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Application with ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-rose-700">{id}</code> does not exist, has been withdrawn, or is not registered in this system.
        </p>
        <div className="mt-5">
          <Link to="/regional-officer/applications">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Assigned Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Jurisdiction Access Check
  const isAuthorizedJurisdiction =
    user.jurisdictionStates.includes(application.institution.state) ||
    user.regionalOffice.includes(application.institution.regionalOffice);

  // Available regulatory transitions
  const availableTransitions = isAuthorizedJurisdiction
    ? getAvailableTransitions(application.status, user.role)
    : [];

  const deadlineInfo = calculateDeadlineDaysRemaining(application.deadlineDate);

  // Handle Document Verification Save
  const handleSaveDocScrutiny = async () => {
    if (!selectedDoc) return;

    await dataService.updateDocumentScrutiny({
      documentId: selectedDoc.id,
      applicationId: application.id,
      status: docStatus,
      observations: docObservation,
      deficiencyReason: docStatus === 'correction_required' ? docDeficiencyReason : undefined,
      deficiencyRemarks: docStatus === 'correction_required' ? docDeficiencyRemarks : undefined,
      officerName: user.name,
    });

    if (docStatus === 'correction_required' && docDeficiencyReason) {
      await dataService.createDeficiency({
        applicationId: application.id,
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
        category: selectedDoc.category,
        clauseReference: 'AICTE Approval Process Norms',
        severity: 'major',
        deficiencyTitle: `Deficiency in ${selectedDoc.name}`,
        detailedReason: docDeficiencyReason,
        remedialActionRequired: docDeficiencyRemarks || 'Upload rectified document conforming to handbook guidelines.',
        rectificationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        officerName: user.name,
      });
    }

    setSelectedDoc(null);
    triggerRefresh();
  };

  // Handle Workflow Status Transition
  const handleExecuteTransition = async () => {
    if (!selectedTransition) return;
    if (selectedTransition.requiresRemarks && !transitionRemarks.trim()) {
      setTransitionError('Statutory officer remarks are mandatory for regulatory transitions.');
      return;
    }

    setIsTransitioning(true);
    setTransitionError(null);

    const result = await dataService.transitionApplicationStatus({
      applicationId: application.id,
      targetStatus: selectedTransition.targetStatus,
      officerId: user.id,
      officerName: user.name,
      officerRole: user.role,
      remarks: transitionRemarks,
      stageName: selectedTransition.label,
    });

    setIsTransitioning(false);

    if (result.success) {
      setSelectedTransition(null);
      setTransitionRemarks('');
      triggerRefresh();
    } else {
      setTransitionError(result.error || 'Transition failed due to workflow constraints.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/regional-officer/applications">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Queue
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <div className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {application.applicationNumber}
          </div>
          <Badge status={application.status} size="md" />
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              deadlineInfo.isOverdue
                ? 'bg-rose-100 text-rose-800'
                : deadlineInfo.severity === 'critical'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}
            aria-label={deadlineInfo.accessibleText}
            title={deadlineInfo.accessibleText}
          >
            {deadlineInfo.label}
          </span>
        </div>

        {/* Workflow Transition Buttons & Scrutiny Workspace Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/regional-officer/scrutiny-workspace/${application.id}`}>
            <Button variant="outline" size="sm" icon={<FileSearch className="w-4 h-4 text-indigo-600" />}>
              Scrutiny Workspace
            </Button>
          </Link>

          {availableTransitions.length === 0 ? (
            <span className="text-xs text-slate-500 italic">
              {!isAuthorizedJurisdiction
                ? 'Jurisdiction Restricted: Case outside your assigned region.'
                : 'No further actions permitted for current status & role.'}
            </span>
          ) : (
            availableTransitions.map((trans) => (
              <Button
                key={trans.targetStatus}
                variant={
                  trans.targetStatus === 'correction_required'
                    ? 'danger'
                    : trans.targetStatus === 'under_next_stage'
                    ? 'success'
                    : 'primary'
                }
                size="sm"
                onClick={() => {
                  setSelectedTransition(trans);
                  setTransitionRemarks('');
                  setTransitionError(null);
                }}
              >
                {trans.label}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Jurisdiction Access Warning Banner if not authorized */}
      {!isAuthorizedJurisdiction && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Jurisdiction Notice:</strong> This institution is located in{' '}
            <strong>{application.institution.state}</strong>. Your officer profile is assigned to{' '}
            <strong>{user.jurisdictionStates.join(', ')}</strong>. You have read-only inspection access; status modifications are restricted.
          </div>
        </div>
      )}

      {/* Case Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Building className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900">{application.institution.name}</h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                PID: {application.institution.aictePermanentId}
              </span>
              <span className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold border border-blue-200">
                AY {application.academicYear}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span>{application.institution.address}, {application.institution.city}, {application.institution.state} - {application.institution.pinCode}</span>
              <span>•</span>
              <span>Category: <strong>{application.institution.institutionType}</strong></span>
              <span>•</span>
              <span>Est: <strong>{application.institution.establishedYear}</strong></span>
              <span>•</span>
              <span>Contact: {application.institution.contactPerson} ({application.institution.contactPhone})</span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-6 shrink-0 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Application Type</div>
              <div className="font-semibold text-slate-800 capitalize mt-0.5">
                {application.type.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Submitted On</div>
              <div className="font-semibold text-slate-800 font-mono mt-0.5">
                {new Date(application.submittedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Statutory Deadline</div>
              <div className="font-semibold text-rose-700 font-mono mt-0.5">{application.deadlineDate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assigned RO</div>
              <div className="font-semibold text-slate-800 mt-0.5">{application.assignedOfficerName || 'Unassigned'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Versions ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Scrutiny Checklist ({checklist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deficiencies')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'deficiencies'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Deficiencies & Resubmission ({deficiencies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evc')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'evc'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-teal-600" />
          <span>EVC Inspection {evcRecord ? '(Active)' : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          <span>Compliance & Expiry ({complianceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('late_requests')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'late_requests'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClockAlert className="w-4 h-4 text-orange-600" />
          <span>Late Requests & Appeals ({lateRequestsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ai_assistant'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>AI Pre-Screening ({aiSuggestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Chronological Timeline</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DOCUMENTS & VERSIONS                                          */}
      {/* ==================================================================== */}
      {activeTab === 'documents' && (
        <Card className="!p-0 overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Regulatory Document Scrutiny Desk</h3>
              <p className="text-xs text-slate-500">
                Inspect land deeds, sanctioned building plans, fire safety certificates, and faculty rosters.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Total Documents: {documents.length}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {doc.code}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                    <span className="text-[11px] text-slate-400">({doc.category})</span>
                    <Badge
                      variant={
                        doc.status === 'verified'
                          ? 'success'
                          : doc.status === 'correction_required'
                          ? 'warning'
                          : doc.status === 'rejected'
                          ? 'danger'
                          : 'default'
                      }
                      size="sm"
                    >
                      {doc.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>File: <strong>{doc.fileName}</strong> ({doc.fileSize})</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-700">Version: v{doc.version}</span>
                    <span>•</span>
                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  {doc.observations && (
                    <div className="bg-slate-100/90 p-2.5 rounded text-slate-700 border border-slate-200 leading-relaxed">
                      <strong>RO Scrutiny Note:</strong> {doc.observations}
                      {doc.verifiedBy && (
                        <span className="text-slate-500 ml-2 italic">
                          — Verified by {doc.verifiedBy} on {new Date(doc.verifiedAt || '').toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {doc.status === 'correction_required' && doc.deficiencyReason && (
                    <div className="bg-amber-50 p-2.5 rounded text-amber-900 border border-amber-200 leading-relaxed">
                      <strong>Flagged Deficiency:</strong> {doc.deficiencyReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setDocStatus(doc.status === 'pending' ? 'verified' : doc.status);
                      setDocObservation(doc.observations || '');
                      setDocDeficiencyReason(doc.deficiencyReason || '');
                      setDocDeficiencyRemarks(doc.deficiencyRemarks || '');
                    }}
                  >
                    <span>Scrutinize Document</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SCRUTINY CHECKLIST                                            */}
      {/* ==================================================================== */}
      {activeTab === 'checklist' && (
        <Card title="AICTE Regulatory Checklist Verification" subtitle="Criteria per Table 4.1 & 5.1 of APH 2026-27">
          <div className="divide-y divide-slate-100 text-xs">
            {checklist.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {item.code}
                    </span>
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                      {item.normReference}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{item.requirementText}</p>
                  {item.officerNotes && (
                    <div className="text-[11px] bg-slate-50 p-2 rounded text-slate-700 border border-slate-200 mt-1">
                      <strong>Officer Verification Finding:</strong> {item.officerNotes}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Badge
                    variant={
                      item.status === 'compliant'
                        ? 'success'
                        : item.status === 'non_compliant'
                        ? 'danger'
                        : 'default'
                    }
                    size="md"
                  >
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DEFICIENCIES & RESUBMISSION TRACKING                          */}
      {/* ==================================================================== */}
      {activeTab === 'deficiencies' && (
        <Card
          title="Deficiencies & Resubmission Tracking"
          subtitle={`Re-scrutiny iteration count: ${application.reScrutinyCount || 0}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Resubmission History:</span>{' '}
                {application.reScrutinyCount > 0
                  ? `Application has undergone ${application.reScrutinyCount} re-scrutiny cycle(s) following institutional rectifications.`
                  : 'Initial scrutiny cycle. No resubmissions recorded yet.'}
              </div>
              <span className="font-mono font-bold text-blue-900">Deficiencies: {deficiencies.length}</span>
            </div>

            {deficiencies.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-semibold text-slate-800">No Outstanding Deficiencies</h4>
                <p className="mt-0.5">All verified documents currently meet AICTE regulatory norms.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deficiencies.map((def) => (
                  <div key={def.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900 text-sm">{def.deficiencyTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold uppercase">
                          {def.severity} Severity
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-mono">
                        Rectification Deadline: <strong>{def.rectificationDeadline}</strong>
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      <strong>Detailed Finding:</strong> {def.detailedReason}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Remedial Action Required:</strong> {def.remedialActionRequired}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: EVC INSPECTION DETAILS                                        */}
      {/* ==================================================================== */}
      {activeTab === 'evc' && (
        <Card title="Expert Visit Committee (EVC) Physical Inspection" subtitle="On-site infrastructure verification per Section E norms">
          {!evcRecord ? (
            <div className="py-10 text-center text-xs text-slate-500 space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <h4 className="font-semibold text-slate-800">No Physical EVC Visit Scheduled</h4>
              <p className="max-w-md mx-auto text-slate-500">
                This application does not currently have an active physical inspection order. If laboratory or site verification is required, use the <strong>"Recommend EVC Physical Visit"</strong> action.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-900">{evcRecord.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{evcRecord.visitType}</h4>
                  </div>
                  <div className="text-right">
                    <Badge variant={evcRecord.status === 'report_submitted' ? 'success' : 'info'} size="md">
                      {evcRecord.status.replace(/_/g, ' ')}
                    </Badge>
                    {evcRecord.isUnannounced && (
                      <span className="block text-[10px] text-rose-700 font-bold uppercase mt-1">
                        Surprise Unannounced Inspection (Not pre-notified)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">Confirmed Visit Date:</span>{' '}
                    <strong>{evcRecord.confirmedDate || 'Pending Schedule'}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Lead Officer:</span> {evcRecord.leadOfficerName}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-800">Inspection Mandate:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{evcRecord.visitTerms}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-800">Appointed Committee Experts ({evcRecord.committeeMembers.length}):</span>
                  <div className="mt-1.5 space-y-1.5">
                    {evcRecord.committeeMembers.map((m) => (
                      <div key={m.id} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong>{m.name}</strong> ({m.role}) — {m.specialization}
                        </div>
                        <span className="text-[10px] text-slate-500">{m.institution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {evcRecord.reportSummary && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>EVC Report Finding: {evcRecord.outcomeRecommendation}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{evcRecord.reportSummary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COMPLIANCE & EXPIRY MONITOR                                   */}
      {/* ==================================================================== */}
      {activeTab === 'compliance' && (
        <Card title="Institutional Compliance & Undertakings" subtitle="Anti-ragging mandates and periodic certificate renewals">
          {complianceList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No mandatory compliance requirements registered for this institution.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {complianceList.map((comp) => (
                <div key={comp.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{comp.title}</h4>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{comp.clause}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={comp.status === 'overdue' ? 'danger' : 'info'} size="sm">
                        {comp.status.toUpperCase()}
                      </Badge>
                      <div className="text-[10px] text-slate-500 mt-1">Due Date: {comp.dueDate}</div>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{comp.description}</p>

                  {comp.documentExpiryDate && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <strong>Certificate Expiry:</strong> {comp.documentExpiryDate}{' '}
                      {comp.isRenewalDueSoon && <span className="font-bold text-rose-700">(Renewal Due Soon)</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: LATE REQUESTS & APPEALS                                       */}
      {/* ==================================================================== */}
      {activeTab === 'late_requests' && (
        <Card title="Late Submission & Force Majeure Appeals" subtitle="Statutory condonation petitions per Section G guidelines">
          {lateRequestsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No late submission or condonation requests submitted for this case.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {lateRequestsList.map((late) => (
                <div key={late.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="font-bold text-amber-950">{late.requestType}</h4>
                      <div className="text-[11px] text-amber-800">Category: {late.reasonCategory}</div>
                    </div>
                    <Badge variant={late.status === 'accepted_for_processing' ? 'success' : 'warning'} size="sm">
                      {late.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    <strong>Stated Grounds:</strong> {late.detailedReason}
                  </p>

                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded text-amber-900 text-[11px] leading-relaxed">
                    <strong>Statutory Disclaimer:</strong> {late.statutoryDisclaimer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: AI ASSISTANT                                                  */}
      {/* ==================================================================== */}
      {activeTab === 'ai_assistant' && (
        <Card
          title="AI-Assisted Scrutiny Insights (Assistive Only)"
          subtitle="Document OCR text extraction & automated compliance pre-screening. Requires Regional Officer verification."
        >
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Statutory AI Boundary Notice:</strong> AI suggestions assist human officers. They do not constitute official statutory decisions.
              </span>
            </div>

            {aiSuggestions.map((sug) => (
              <div key={sug.id} className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sug.title}</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded">
                    Confidence: {Math.round(sug.confidenceScore * 100)}%
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{sug.summary}</p>
                {sug.evidenceQuote && (
                  <div className="p-2 bg-slate-50 border rounded font-mono text-[11px] text-slate-700">
                    {sug.evidenceQuote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 8: CHRONOLOGICAL TIMELINE                                        */}
      {/* ==================================================================== */}
      {activeTab === 'timeline' && (
        <Card title="Case Scrutiny Timeline & Remarks History" subtitle="Immutable chronological audit record">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
            {application.remarksHistory.map((rem) => (
              <div key={rem.id} className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span>{rem.stage}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {new Date(rem.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Officer: <strong>{rem.officerName}</strong> • Transition: {rem.statusFrom} &rarr; {rem.statusTo}
                </div>
                <div className="mt-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed">
                  {rem.remarks}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DOCUMENT SCRUTINY MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Document Scrutiny: {selectedDoc.code} - {selectedDoc.name}
                </h3>
                <p className="text-[11px] text-slate-500">File: {selectedDoc.fileName} ({selectedDoc.fileSize})</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scrutiny Determination</label>
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 font-medium"
              >
                <option value="verified">Verified & Compliant</option>
                <option value="correction_required">Correction Required (Issue Deficiency)</option>
                <option value="pending">Pending Further Review</option>
                <option value="rejected">Rejected (Irreparable Non-Compliance)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Technical Verification Observations</label>
              <textarea
                value={docObservation}
                onChange={(e) => setDocObservation(e.target.value)}
                placeholder="Record technical verification notes, e.g. continuous parcel acreage, building occupancy date..."
                rows={3}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {docStatus === 'correction_required' && (
              <div className="space-y-3 p-3 bg-amber-50 rounded border border-amber-200">
                <div>
                  <label className="block font-semibold text-amber-900 mb-1">Deficiency Reason (Issued to Institution)</label>
                  <input
                    type="text"
                    value={docDeficiencyReason}
                    onChange={(e) => setDocDeficiencyReason(e.target.value)}
                    placeholder="e.g. NOC validity expired on 14/10/2026..."
                    className="w-full p-2 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-900 mb-1">Remedial Action Required</label>
                  <input
                    type="text"
                    value={docDeficiencyRemarks}
                    onChange={(e) => setDocDeficiencyRemarks(e.target.value)}
                    placeholder="e.g. Upload renewed certificate or proof of inspection fee paid..."
                    className="w-full p-2 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveDocScrutiny}>
                Save Scrutiny Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW TRANSITION MODAL */}
      {selectedTransition && (
        <ConfirmationModal
          isOpen={true}
          title={`Execute Action: ${selectedTransition.label}`}
          message={`Are you sure you want to transition application ${application.applicationNumber} to status '${selectedTransition.targetStatus}'? This action will be immutably recorded in the statutory audit log.`}
          confirmLabel={selectedTransition.label}
          isDestructive={selectedTransition.targetStatus === 'rejected' || selectedTransition.targetStatus === 'correction_required'}
          isLoading={isTransitioning}
          onConfirm={handleExecuteTransition}
          onCancel={() => setSelectedTransition(null)}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Authoritative Scrutiny Remarks (Mandatory)
              </label>
              <textarea
                value={transitionRemarks}
                onChange={(e) => setTransitionRemarks(e.target.value)}
                placeholder="Enter regulatory justification, inspection committee reference, or deficiency summary..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {transitionError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{transitionError}</span>
              </div>
            )}
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
