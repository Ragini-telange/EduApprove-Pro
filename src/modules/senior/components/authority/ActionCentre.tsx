import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authorityApi } from '../../services/authorityApi';
import type { 
  ApplicationRecord, 
  EscalationCase, 
  EscalationPolicyConfig, 
  ScheduledSweepResult 
} from '../../types/authority';
import { EscalationPolicyModal } from './EscalationPolicyModal';
import { ResolveEscalationModal } from './ResolveEscalationModal';
import { 
  AlertOctagon, 
  Send, 
  UserCheck, 
  Clock, 
  FileCheck2, 
  Check, 
  X, 
  Sliders, 
  Play, 
  ShieldAlert, 
  FileWarning, 
  CalendarClock, 
  Timer, 
  MessageSquare, 
  CheckCircle2, 
  Search, 
  History, 
  ChevronDown, 
  ChevronUp,
  FileText,
  UserCheck2
} from 'lucide-react';

interface ActionCentreProps {
  applications: ApplicationRecord[];
  onReassign: (appId: string, newOfficer: string, reason: string) => Promise<boolean>;
  onFollowUp: (appId: string, note: string) => Promise<boolean>;
  onOpenCase: (app: ApplicationRecord) => void;
  onRefreshData: () => void;
}

export const ActionCentre: React.FC<ActionCentreProps> = ({
  applications,
  onOpenCase,
  onRefreshData,
}) => {
  const { user, role, canReassign } = useAuth();

  // Escalation cases state
  const [escalations, setEscalations] = useState<EscalationCase[]>([]);
  const [policy, setPolicy] = useState<EscalationPolicyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Expanded History cards
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedCaseForResolve, setSelectedCaseForResolve] = useState<EscalationCase | null>(null);

  // Record Follow-Up Modal
  const [selectedCaseForFollowUp, setSelectedCaseForFollowUp] = useState<EscalationCase | null>(null);
  const [followUpType, setFollowUpType] = useState<'Notice of Hearing' | 'Deficiency Rectification Summons' | 'EVC Expedite Order' | 'Show Cause Notice' | 'Document Renewal Requisition'>('Notice of Hearing');
  const [followUpPriority, setFollowUpPriority] = useState<'Standard' | 'High' | 'Emergency'>('High');
  const [followUpRecipient, setFollowUpRecipient] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Administrative Remark Modal
  const [selectedCaseForRemark, setSelectedCaseForRemark] = useState<EscalationCase | null>(null);
  const [remarkCategory, setRemarkCategory] = useState<'General' | 'Scrutiny Directive' | 'Legal Compliance' | 'SAC Referral' | 'Inspection Note' | 'Chairman Memo'>('Scrutiny Directive');
  const [remarkText, setRemarkText] = useState('');
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

  // Reassignment Modal
  const [selectedCaseForReassign, setSelectedCaseForReassign] = useState<EscalationCase | null>(null);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // Scheduled sweep state
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<ScheduledSweepResult | null>(null);

  // Notification banners
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load escalations & policy
  const loadEscalationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const cases = await authorityApi.getEscalationCases({
        search: searchQuery,
        level: filterLevel,
        category: filterCategory,
        region: filterRegion,
        status: filterStatus,
      });
      setEscalations(cases);

      const pol = await authorityApi.getEscalationPolicy();
      setPolicy(pol);
    } catch (err: any) {
      console.error('Error loading escalation cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterLevel, filterCategory, filterRegion, filterStatus]);

  useEffect(() => {
    loadEscalationData();
  }, [loadEscalationData]);

  const toggleHistory = (caseId: string) => {
    setExpandedHistories(prev => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  // Run Backend Scheduled Sweep
  const handleRunScheduledSweep = async () => {
    setIsSweeping(true);
    try {
      const result = await authorityApi.runScheduledEscalationSweep();
      setSweepResult(result);
      await loadEscalationData();
      onRefreshData();
      setNotificationMsg({
        type: 'success',
        text: `Backend sweep completed. ${result.newAlertsTriggered} new alert(s) triggered; ${result.duplicatesPrevented} duplicate alert(s) prevented.`
      });
      setTimeout(() => setNotificationMsg(null), 6000);
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: 'Backend sweep failed: ' + err?.message });
    } finally {
      setIsSweeping(false);
    }
  };

  // Acknowledge Alert
  const handleAcknowledge = async (esc: EscalationCase) => {
    const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
    const actorRole = role;
    const success = await authorityApi.acknowledgeEscalation(esc.id, actorName, actorRole);
    if (success) {
      setNotificationMsg({
        type: 'success',
        text: `Escalation ${esc.applicationNumber} officially acknowledged by ${actorName}.`
      });
      loadEscalationData();
      onRefreshData();
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Follow-Up Directive Submit
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForFollowUp || !followUpText) return;
    setIsSubmittingFollowUp(true);

    const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
    const success = await authorityApi.recordFollowUpDirective(selectedCaseForFollowUp.id, {
      type: followUpType,
      priority: followUpPriority,
      text: followUpText,
      recipientRole: followUpRecipient || selectedCaseForFollowUp.assignedRole,
      author: actorName,
      role,
    });

    setIsSubmittingFollowUp(false);
    if (success) {
      setNotificationMsg({
        type: 'success',
        text: `Official Central Bureau [${followUpType}] directive dispatched for ${selectedCaseForFollowUp.applicationNumber}.`
      });
      setSelectedCaseForFollowUp(null);
      setFollowUpText('');
      loadEscalationData();
      onRefreshData();
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Administrative Remark Submit
  const handleRemarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForRemark || !remarkText) return;
    setIsSubmittingRemark(true);

    const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
    const success = await authorityApi.addAdministrativeRemark(selectedCaseForRemark.id, {
      author: actorName,
      role,
      category: remarkCategory,
      text: remarkText,
    });

    setIsSubmittingRemark(false);
    if (success) {
      setNotificationMsg({
        type: 'success',
        text: `Administrative remark recorded in permanent audit ledger for ${selectedCaseForRemark.applicationNumber}.`
      });
      setSelectedCaseForRemark(null);
      setRemarkText('');
      loadEscalationData();
      onRefreshData();
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Reassignment Submit
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForReassign || !newOfficerName || !reassignReason) return;
    setIsSubmittingReassign(true);

    const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
    const success = await authorityApi.reassignEscalationOfficer(
      selectedCaseForReassign.id,
      newOfficerName,
      reassignReason,
      actorName,
      role
    );

    setIsSubmittingReassign(false);
    if (success) {
      setNotificationMsg({
        type: 'success',
        text: `Responsibility reassigned to ${newOfficerName} for ${selectedCaseForReassign.applicationNumber}.`
      });
      setSelectedCaseForReassign(null);
      setNewOfficerName('');
      setReassignReason('');
      loadEscalationData();
      onRefreshData();
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Resolve Escalation Submit
  const handleResolveSubmit = async (escId: string, data: { notes: string; proofRef: string }) => {
    const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
    const res = await authorityApi.resolveEscalation(escId, {
      resolvedBy: actorName,
      role,
      notes: data.notes,
      proofRef: data.proofRef,
    });

    if (res.success) {
      setNotificationMsg({ type: 'success', text: res.message });
      setSelectedCaseForResolve(null);
      loadEscalationData();
      onRefreshData();
      setTimeout(() => setNotificationMsg(null), 5000);
    }
    return res;
  };

  // Find linked application for View Dossier
  const handleViewDossier = (esc: EscalationCase) => {
    const matchedApp = applications.find(a => a.id === esc.caseId || a.applicationNumber === esc.applicationNumber);
    if (matchedApp) {
      onOpenCase(matchedApp);
    } else {
      // Create fallback ApplicationRecord structure
      const fallbackApp: ApplicationRecord = {
        id: esc.caseId,
        applicationNumber: esc.applicationNumber,
        institutionId: esc.institutionId,
        institutionName: esc.institutionName,
        instituteCode: esc.instituteCode,
        region: esc.region,
        state: esc.state,
        applicationType: 'Extension of Approval (EoA)',
        academicYear: '2026-2027',
        currentStage: esc.currentStage,
        currentStatus: esc.currentStatus,
        assignedOfficer: esc.assignedOfficer,
        assignedOfficerEmail: esc.assignedOfficerEmail,
        submittedDate: '2026-08-01',
        deadlineDate: esc.originalDeadline,
        deadlineStatus: esc.daysOverdue > 0 ? 'Overdue' : 'Normal',
        evcStatus: esc.evcStatus,
        complianceStatus: esc.deficienciesCount > 0 ? 'Critical Deficiency' : 'Compliant',
        deficienciesCount: esc.deficienciesCount,
        expiringDocumentsCount: esc.expiringDocumentsCount,
        daysInCurrentStage: esc.daysInCurrentStage,
        isEscalated: true,
        escalationReason: esc.reason,
        lastUpdated: esc.triggeredAt,
        intakeApplied: 180,
        programs: ['Technical Courses'],
      };
      onOpenCase(fallbackApp);
    }
  };

  // Quick Counter Cards (Section A Requirements)
  const deadlineCount = escalations.filter(e => e.escalationCategory === 'deadline_breach' && e.resolutionStatus !== 'Resolved').length;
  const evcDelayCount = escalations.filter(e => e.escalationCategory === 'evc_delay' && e.resolutionStatus !== 'Resolved').length;
  const complianceCount = escalations.filter(e => e.escalationCategory === 'compliance_deficiency' && e.resolutionStatus !== 'Resolved').length;
  const expiredDocsCount = escalations.filter(e => e.escalationCategory === 'document_expiry' && e.resolutionStatus !== 'Resolved').length;
  const inactivityCount = escalations.filter(e => e.escalationCategory === 'stage_inactivity' && e.resolutionStatus !== 'Resolved').length;

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-aicte-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-red-900/40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 backdrop-blur-xs shrink-0">
              <AlertOctagon className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Senior Authority Escalation Centre
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600/80 text-white border border-rose-400">
                  Phase 4 Live
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 max-w-2xl leading-relaxed">
                Central Bureau executive desk for statutory turnaround breaches, EVC inspection delays, compliance deficiencies, and traceable administrative directives.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Backend Scheduler: <strong>Periodic Cron Active (0 */6 * * *)</strong></span>
                </span>
                <span>•</span>
                <span>Deduplication Guard: <strong>{policy?.autoPreventDuplicates ? 'Enforced' : 'Off'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all shadow-xs"
              title="Configure Timelines, SLAs & Escalation Triggers"
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>Configure Policy</span>
            </button>

            <button
              onClick={handleRunScheduledSweep}
              disabled={isSweeping}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Trigger backend background worker to sweep all applications"
            >
              <Play className={`w-4 h-4 fill-slate-950 ${isSweeping ? 'animate-spin' : ''}`} />
              <span>{isSweeping ? 'Running Sweep...' : 'Run Scheduled Sweep'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notificationMsg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-subtle ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {notificationMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sweep Execution Summary Callout */}
      {sweepResult && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Backend Scheduler Execution Report</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {new Date(sweepResult.executionTimestamp).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Evaluated In-Flight</span>
              <strong className="text-sm text-white">{sweepResult.evaluatedCount}</strong>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">New Alerts Triggered</span>
              <strong className="text-sm text-amber-400">{sweepResult.newAlertsTriggered}</strong>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Duplicates Prevented</span>
              <strong className="text-sm text-emerald-400">{sweepResult.duplicatesPrevented}</strong>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Active Escalations</span>
              <strong className="text-sm text-rose-400">{sweepResult.activeEscalationsCount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 2. Five Detection Metric Quick Filter Cards (Section A Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Crossed Deadline */}
        <button
          onClick={() => setFilterCategory(filterCategory === 'deadline_breach' ? 'All' : 'deadline_breach')}
          className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
            filterCategory === 'deadline_breach'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Crossed Deadline</span>
            <CalendarClock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-950">{deadlineCount}</div>
          <span className="text-[10px] text-slate-400">Statutory SLA breach</span>
        </button>

        {/* Card 2: EVC Delay */}
        <button
          onClick={() => setFilterCategory(filterCategory === 'evc_delay' ? 'All' : 'evc_delay')}
          className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
            filterCategory === 'evc_delay'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">EVC Delay</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-950">{evcDelayCount}</div>
          <span className="text-[10px] text-slate-400">Scheduling/Report delay</span>
        </button>

        {/* Card 3: Overdue Compliance */}
        <button
          onClick={() => setFilterCategory(filterCategory === 'compliance_deficiency' ? 'All' : 'compliance_deficiency')}
          className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
            filterCategory === 'compliance_deficiency'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Compliance Overdue</span>
            <FileWarning className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-black text-orange-950">{complianceCount}</div>
          <span className="text-[10px] text-slate-400">Deficiencies unrectified</span>
        </button>

        {/* Card 4: Expired Documents */}
        <button
          onClick={() => setFilterCategory(filterCategory === 'document_expiry' ? 'All' : 'document_expiry')}
          className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
            filterCategory === 'document_expiry'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Expired Documents</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950">{expiredDocsCount}</div>
          <span className="text-[10px] text-slate-400">Fire/Land/Stability NOC</span>
        </button>

        {/* Card 5: Stage Inactivity */}
        <button
          onClick={() => setFilterCategory(filterCategory === 'stage_inactivity' ? 'All' : 'stage_inactivity')}
          className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
            filterCategory === 'stage_inactivity'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Stage Inactivity</span>
            <Timer className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-950">{inactivityCount}</div>
          <span className="text-[10px] text-slate-400">&gt; 14 days dormant</span>
        </button>
      </div>

      {/* 3. Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, institute, officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All">All Escalation Levels</option>
              <option value="1">Level 1: Regional Advisory</option>
              <option value="2">Level 2: Bureau Warning</option>
              <option value="3">Level 3: Apex Committee</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All">All Trigger Categories</option>
              <option value="deadline_breach">Crossed Deadline</option>
              <option value="evc_delay">EVC Inspection Delay</option>
              <option value="compliance_deficiency">Compliance Deficiency</option>
              <option value="document_expiry">Expired / Expiring Documents</option>
              <option value="stage_inactivity">Stage Inactivity / Dormant</option>
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All">All 8 AICTE Regions</option>
              <option value="Western">Western Region (WRO)</option>
              <option value="Northern">Northern Region (NRO)</option>
              <option value="Southern">Southern Region (SRO)</option>
              <option value="Central">Central Region (CRO)</option>
              <option value="South-Western">South-Western Region (SWRO)</option>
              <option value="Eastern">Eastern Region (ERO)</option>
              <option value="North-Western">North-Western Region (NWRO)</option>
              <option value="South-Central">South-Central Region (SCRO)</option>
              <option value="North-Eastern">North-Eastern Region (NERO)</option>
            </select>
          </div>

          {/* Resolution Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All">All Resolution Statuses</option>
              <option value="Open">Status: Open</option>
              <option value="Acknowledged">Status: Acknowledged</option>
              <option value="In Progress">Status: In Progress</option>
              <option value="Resolved">Status: Resolved</option>
            </select>
          </div>
        </div>

        {/* Active Filter Count and Clear button */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Displaying <strong>{escalations.length}</strong> matching escalation records
          </span>
          {(searchQuery || filterLevel !== 'All' || filterCategory !== 'All' || filterRegion !== 'All' || filterStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterLevel('All');
                setFilterCategory('All');
                setFilterRegion('All');
                setFilterStatus('All');
              }}
              className="text-aicte-800 hover:text-aicte-950 font-semibold underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Escalations Case List (Section A & B Display) */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">Loading statutory escalation records...</p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Zero Overdue Escalations</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No cases matching your filter criteria are currently flagged as overdue or requiring intervention.
            </p>
          </div>
        ) : (
          escalations.map((item) => {
            const isHistoryOpen = !!expandedHistories[item.id];

            // Escalation Level Styling
            let levelBadge = {
              label: 'Level 1: Advisory',
              bg: 'bg-amber-100 text-amber-900 border-amber-300',
              borderLeft: 'border-l-amber-500',
            };
            if (item.escalationLevel === 2) {
              levelBadge = {
                label: 'Level 2: Warning',
                bg: 'bg-orange-100 text-orange-950 border-orange-300',
                borderLeft: 'border-l-orange-500',
              };
            } else if (item.escalationLevel === 3) {
              levelBadge = {
                label: 'Level 3: Apex Escalation',
                bg: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
                borderLeft: 'border-l-rose-600',
              };
            }

            // Resolution Status Styling
            let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
            if (item.resolutionStatus === 'Open') statusBadge = 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
            else if (item.resolutionStatus === 'Acknowledged') statusBadge = 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
            else if (item.resolutionStatus === 'In Progress') statusBadge = 'bg-amber-50 text-amber-900 border-amber-200 font-semibold';
            else if (item.resolutionStatus === 'Resolved') statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border ${levelBadge.borderLeft} border-l-4 border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow p-5 space-y-4`}
              >
                {/* Row 1: Header References, Institution & Status Badges */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                        {item.applicationNumber}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Ref: {item.complianceReference}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${levelBadge.bg} flex items-center gap-1`}>
                        {item.escalationLevel === 3 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                        )}
                        <span>{levelBadge.label}</span>
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                        {item.resolutionStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <h2 className="text-sm font-bold text-slate-900">
                        {item.institutionName}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        ({item.region} Region • {item.state} • Code: {item.instituteCode})
                      </span>
                    </div>
                  </div>

                  {/* Stage & Deadline Badges */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0 text-xs">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Stage</span>
                      <span className="font-bold text-slate-800">{item.currentStage}</span>
                    </div>

                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Deadline</span>
                      <span className="font-mono font-bold text-slate-800">{item.originalDeadline}</span>
                    </div>

                    {item.daysOverdue > 0 ? (
                      <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-right">
                        <span className="text-[10px] text-rose-500 block font-bold uppercase">Overdue</span>
                        <span className="font-mono font-bold text-rose-700">+{item.daysOverdue} days</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-right">
                        <span className="text-[10px] text-emerald-600 block font-bold uppercase">SLA Status</span>
                        <span className="font-bold text-emerald-700">In Window</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Escalation Reason & Diagnostic Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Reason for Escalation */}
                  <div className="md:col-span-2 bg-rose-50/60 p-3 rounded-xl border border-rose-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-rose-600" />
                      <span>Statutory Reason for Escalation</span>
                    </span>
                    <p className="text-slate-900 font-medium text-xs leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  {/* Assigned Responsible Role */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Assigned Responsible Role
                    </span>
                    <p className="font-bold text-slate-800 truncate">
                      {item.assignedRole}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Officer: <strong>{item.assignedOfficer}</strong>
                    </p>
                    {item.assignedOfficerEmail && (
                      <p className="font-mono text-[10px] text-slate-400 truncate">
                        {item.assignedOfficerEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Diagnostic Tags */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                    Stage Elapsed: <strong>{item.daysInCurrentStage} days</strong>
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                    Deficiencies: <strong>{item.deficienciesCount}</strong>
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                    Expiring Documents: <strong>{item.expiringDocumentsCount}</strong>
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                    EVC Status: <strong>{item.evcStatus}</strong>
                  </span>
                  {item.acknowledgedBy && (
                    <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md font-medium border border-blue-200">
                      Acknowledged by: {item.acknowledgedBy}
                    </span>
                  )}
                  {item.resolvedBy && (
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
                      Resolved by: {item.resolvedBy}
                    </span>
                  )}
                </div>

                {/* Row 4: Permitted Authority Action Buttons (Section B) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* View Dossier Action */}
                    <button
                      onClick={() => handleViewDossier(item)}
                      className="px-3 py-1.5 bg-aicte-900 hover:bg-aicte-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Inspect full case dossier, attachments, and statutory desk"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Case Dossier</span>
                    </button>

                    {/* Acknowledge Alert Action */}
                    {item.resolutionStatus === 'Open' && (
                      <button
                        onClick={() => handleAcknowledge(item)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Record official acknowledgement of escalation"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-700" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {/* Record Follow-Up Action */}
                    <button
                      onClick={() => setSelectedCaseForFollowUp(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Dispatch statutory directive to Regional Officer or Institution"
                    >
                      <Send className="w-3.5 h-3.5 text-aicte-800" />
                      <span>Record Follow-Up</span>
                    </button>

                    {/* Add Administrative Remark Action */}
                    <button
                      onClick={() => setSelectedCaseForRemark(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Add official remark to statutory ledger"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                      <span>Add Remark</span>
                    </button>

                    {/* Reassign / Recommend Action (Role Check!) */}
                    <button
                      onClick={() => setSelectedCaseForReassign(item)}
                      disabled={role === 'institution_admin'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                        canReassign
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                          : role === 'regional_officer'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                      title={
                        canReassign 
                          ? 'Reassign lead scrutinizer or inspection convenor' 
                          : role === 'regional_officer'
                          ? 'Recommend reassignment to Central Bureau'
                          : 'Reassignment restricted to Senior Authority'
                      }
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>{canReassign ? 'Reassign' : 'Recommend Reassign'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mark as Resolved Action */}
                    {item.resolutionStatus !== 'Resolved' ? (
                      <button
                        onClick={() => setSelectedCaseForResolve(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Mark follow-up as resolved when underlying issues are verified"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}

                    {/* Expand/Collapse Traceable Escalation History */}
                    <button
                      onClick={() => toggleHistory(item.id)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>History ({item.history.length})</span>
                      {isHistoryOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Row 5: Expanded Traceable History Accordion */}
                {isHistoryOpen && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-aicte-900" />
                        <span>Traceable Escalation Event History & Audit Ledger</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Cryptographic Immutable Sequence
                      </span>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-2 text-xs">
                      {item.history.map((ev, idx) => (
                        <div
                          key={ev.id || idx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {ev.action}
                              </span>
                              {ev.level && (
                                <span className="text-[10px] font-semibold text-amber-700">
                                  Level {ev.level}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500">
                                by <strong>{ev.actor}</strong> ({ev.role})
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium text-[11px]">
                              {ev.details}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Administrative Remarks Display */}
                    {item.administrativeRemarks.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Recorded Administrative Remarks:
                        </span>
                        {item.administrativeRemarks.map((rem) => (
                          <div key={rem.id} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                            <div className="flex justify-between items-center text-slate-500">
                              <span className="font-semibold text-slate-800">
                                [{rem.category}] by {rem.author} ({rem.role})
                              </span>
                              <span className="font-mono text-[10px]">{new Date(rem.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700">{rem.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dispatched Follow-Up Directives Display */}
                    {item.followUpDirectives.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Dispatched Statutory Directives:
                        </span>
                        {item.followUpDirectives.map((dir) => (
                          <div key={dir.id} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                            <div className="flex justify-between items-center text-slate-500">
                              <span className="font-semibold text-rose-800">
                                [{dir.type}] ({dir.priority} Priority) to {dir.recipientRole}
                              </span>
                              <span className="font-mono text-[10px]">{new Date(dir.dispatchedAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{dir.instructionText}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resolution Metadata if resolved */}
                    {item.resolutionStatus === 'Resolved' && (
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-[11px] space-y-0.5 text-emerald-950">
                        <span className="font-bold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolution Record Reference: {item.resolutionProofRef || 'VERIFIED'}</span>
                        </span>
                        <p>{item.resolutionNotes}</p>
                        <span className="text-[10px] text-emerald-700 block">
                          Closed on: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A'} by {item.resolvedBy}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Escalation Timelines & SLA Policy Configuration */}
      {policy && (
        <EscalationPolicyModal
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          policy={policy}
          onSavePolicy={async (newPol) => {
            const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
            await authorityApi.updateEscalationPolicy(newPol, actorName);
            await loadEscalationData();
          }}
          onResetPolicy={async () => {
            const actorName = user?.name || 'Dr. Janhavi Hinganghatkar';
            await authorityApi.updateEscalationPolicy(policy, actorName);
            await loadEscalationData();
          }}
        />
      )}

      {/* MODAL 2: Resolve Escalation with Validation Check */}
      <ResolveEscalationModal
        escalation={selectedCaseForResolve}
        onClose={() => setSelectedCaseForResolve(null)}
        onResolve={handleResolveSubmit}
      />

      {/* MODAL 3: Record Official Follow-up Directive */}
      {selectedCaseForFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Dispatch Central Bureau Follow-Up Directive
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseForFollowUp(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFollowUpSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Target Application</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedCaseForFollowUp.applicationNumber}
                </span>
                <p className="font-medium text-slate-700 text-[11px] truncate">
                  {selectedCaseForFollowUp.institutionName} ({selectedCaseForFollowUp.region})
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Directive Notice Type:
                </label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Notice of Hearing">Notice of Hearing (APH Sec. 3.4)</option>
                  <option value="Deficiency Rectification Summons">Immediate Deficiency Rectification Summons (48h)</option>
                  <option value="EVC Expedite Order">EVC Inspection Panel Expedite Order</option>
                  <option value="Show Cause Notice">Statutory Show Cause Notice</option>
                  <option value="Document Renewal Requisition">Document Renewal Requisition (Fire/Land/Stability)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Directive Priority:
                  </label>
                  <select
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Standard">Standard Priority</option>
                    <option value="High">High Urgency</option>
                    <option value="Emergency">Critical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Recipient Role:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RO Northern or College Principal"
                    value={followUpRecipient}
                    onChange={(e) => setFollowUpRecipient(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Directive Instructions Text: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify clear mandatory directions, statutory compliance terms, and exact deadline..."
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                This statutory directive will be dispatched with your digital credentials ({user?.name}) and archived in the immutable audit ledger.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForFollowUp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFollowUp}
                  className="px-5 py-2 rounded-lg bg-aicte-900 hover:bg-aicte-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingFollowUp ? 'Dispatching...' : 'Dispatch Directive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Authorised Administrative Remark */}
      {selectedCaseForRemark && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Add Authorised Administrative Remark
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseForRemark(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRemarkSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Case Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedCaseForRemark.applicationNumber} — {selectedCaseForRemark.institutionName}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remark Category:
                </label>
                <select
                  value={remarkCategory}
                  onChange={(e) => setRemarkCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Scrutiny Directive">Scrutiny Directive</option>
                  <option value="Legal Compliance">Legal Compliance Opinion</option>
                  <option value="SAC Referral">Standing Appellate Committee Referral</option>
                  <option value="Inspection Note">Inspection Committee Advisory</option>
                  <option value="Chairman Memo">Executive Chairman / Member Secretary Memo</option>
                  <option value="General">General Administrative Note</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remark / Note Content: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record administrative observations, internal committee memos, or scrutiny guidance..."
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForRemark(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRemark}
                  className="px-5 py-2 rounded-lg bg-aicte-900 hover:bg-aicte-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isSubmittingRemark ? 'Recording...' : 'Record Remark'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Assign or Recommend Reassignment */}
      {selectedCaseForReassign && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {canReassign ? 'Authorised Official Reassignment' : 'Recommend Officer Reassignment'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseForReassign(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Target Case</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedCaseForReassign.applicationNumber}
                </span>
                <p className="text-[11px] text-slate-500">
                  Currently Assigned: <strong className="text-slate-800">{selectedCaseForReassign.assignedOfficer}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Eligible Official / Roster Panel: <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="">-- Select Eligible Official --</option>
                  <option value="Dr. S. K. Mahajan (RO Western)">Dr. S. K. Mahajan (RO Western)</option>
                  <option value="Er. Rajesh Bansal (RO Northern)">Er. Rajesh Bansal (RO Northern)</option>
                  <option value="Dr. K. Ramanathan (RO Southern)">Dr. K. Ramanathan (RO Southern)</option>
                  <option value="Er. Alok Sharma (RO Central)">Er. Alok Sharma (RO Central)</option>
                  <option value="Dr. Manjunath Swamy (RO South-Western)">Dr. Manjunath Swamy (RO South-Western)</option>
                  <option value="Dr. Debabrata Roy (RO Eastern)">Dr. Debabrata Roy (RO Eastern)</option>
                  <option value="Er. Harvinder Singh (RO North-Western)">Er. Harvinder Singh (RO North-Western)</option>
                  <option value="Dr. B. V. Ramana (RO South-Central)">Dr. B. V. Ramana (RO South-Central)</option>
                  <option value="Dr. Pranjal Saikia (RO North-Eastern)">Dr. Pranjal Saikia (RO North-Eastern)</option>
                  <option value="Central Bureau HQ Fast-Track Taskforce">Central Bureau HQ Fast-Track Taskforce</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statutory Reassignment Justification: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record formal statutory justification for reassigning lead officer/panel..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                {canReassign 
                  ? 'As Senior Bureau Officer, your reassignment immediately overrides regional allocation and is preserved in the audit trail.'
                  : 'Your recommendation will be submitted to Central Bureau HQ for final authorization.'}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForReassign(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReassign}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingReassign ? 'Processing...' : (canReassign ? 'Confirm Reassignment' : 'Submit Recommendation')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
