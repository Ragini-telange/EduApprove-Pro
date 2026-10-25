import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EVCRecord, EVCStatus, EVCExpert, AuditEvent } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Trash2,
  X,
  History,
  Clock,
  Eye,
  AlertTriangle,
  Building2,
  FileCheck2,
  UserCheck,
  Ban,
  CalendarCheck2,
} from 'lucide-react';

export const EVCView: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();

  const [records, setRecords] = useState<EVCRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'pending_scheduling' | 'upcoming' | 'completed' | 'missing_reports' | 'cancelled'
  >('all');
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>('all');

  // Modal States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<EVCRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States for Modals
  // 1. Schedule Form
  const [scheduleTentativeDate, setScheduleTentativeDate] = useState('');
  const [scheduleConfirmedDate, setScheduleConfirmedDate] = useState('');
  const [scheduleVisitType, setScheduleVisitType] = useState<
    'Regular Verification' | 'Surprise / Unannounced Visit' | 'Deficiency Re-inspection'
  >('Regular Verification');
  const [scheduleIsUnannounced, setScheduleIsUnannounced] = useState(false);
  const [scheduleVisitTerms, setScheduleVisitTerms] = useState('');
  const [scheduleCommittee, setScheduleCommittee] = useState<EVCExpert[]>([]);
  // Expert add sub-form
  const [newExpertName, setNewExpertName] = useState('');
  const [newExpertDesignation, setNewExpertDesignation] = useState('');
  const [newExpertInstitution, setNewExpertInstitution] = useState('');
  const [newExpertSpec, setNewExpertSpec] = useState('');
  const [newExpertRole, setNewExpertRole] = useState<'Chairman' | 'Member' | 'Architect' | 'Regional Officer Representative'>('Member');

  // 2. Completion Form
  const [completionDate, setCompletionDate] = useState('2026-10-22');
  const [completionRemarks, setCompletionRemarks] = useState('');

  // 3. Report Form
  const [reportSummary, setReportSummary] = useState('');
  const [reportOutcome, setReportOutcome] = useState<
    'Satisfactory' | 'Deficiencies Found' | 'Severe Violations' | 'Re-visit Recommended'
  >('Satisfactory');
  const [reportRemarks, setReportRemarks] = useState('');

  // 4. Cancel Form
  const [cancelReason, setCancelReason] = useState('');

  // Load EVC Records
  useEffect(() => {
    setIsLoading(true);
    dataService.getEVCRecords().then((items) => {
      setRecords(items);
      setIsLoading(false);
    });
  }, [dataService, refreshKey]);

  // Check RBAC permissions
  const isAuthorized =
    user?.role === 'regional_officer' ||
    user?.role === 'senior_authority' ||
    user?.role === 'super_admin';

  // Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Search filter
      const matchesSearch =
        rec.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.visitTerms.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Visit type filter
      if (visitTypeFilter !== 'all' && rec.visitType !== visitTypeFilter) {
        return false;
      }

      // 3. Status tab filter
      if (activeFilter === 'pending_scheduling') {
        return rec.status === 'pending_scheduling';
      }
      if (activeFilter === 'upcoming') {
        return rec.status === 'evc_scheduled' || rec.status === 'scheduled';
      }
      if (activeFilter === 'completed') {
        return rec.status === 'visit_completed' || rec.status === 'completed';
      }
      if (activeFilter === 'missing_reports') {
        return (
          (rec.status === 'visit_completed' || rec.status === 'completed') &&
          !rec.reportSubmittedAt
        );
      }
      if (activeFilter === 'cancelled') {
        return rec.status === 'cancelled';
      }

      return true;
    });
  }, [records, searchQuery, activeFilter, visitTypeFilter]);

  // Counts for KPIs
  const kpis = useMemo(() => {
    const total = records.length;
    const pendingScheduling = records.filter((r) => r.status === 'pending_scheduling').length;
    const upcoming = records.filter(
      (r) => r.status === 'evc_scheduled' || r.status === 'scheduled'
    ).length;
    const completed = records.filter(
      (r) => r.status === 'visit_completed' || r.status === 'completed'
    ).length;
    const missingReports = records.filter(
      (r) => (r.status === 'visit_completed' || r.status === 'completed') && !r.reportSubmittedAt
    ).length;
    const reportSubmitted = records.filter((r) => r.status === 'report_submitted').length;
    const cancelled = records.filter((r) => r.status === 'cancelled').length;

    return { total, pendingScheduling, upcoming, completed, missingReports, reportSubmitted, cancelled };
  }, [records]);

  // Open Schedule Modal
  const handleOpenSchedule = (rec: EVCRecord) => {
    setSelectedRecord(rec);
    setActionError(null);
    setScheduleTentativeDate(rec.tentativeDate || '2026-10-27');
    setScheduleConfirmedDate(rec.confirmedDate || '2026-10-28');
    setScheduleVisitType(rec.visitType);
    setScheduleIsUnannounced(rec.isUnannounced);
    setScheduleVisitTerms(rec.visitTerms || '');
    setScheduleCommittee(rec.committeeMembers ? [...rec.committeeMembers] : []);
    setScheduleModalOpen(true);
  };

  // Add Committee Member to form
  const handleAddExpert = () => {
    if (!newExpertName.trim() || !newExpertInstitution.trim()) {
      setActionError('Expert name and affiliated institution are required.');
      return;
    }
    const expert: EVCExpert = {
      id: `exp-${Date.now()}`,
      name: newExpertName.trim(),
      designation: newExpertDesignation.trim() || 'Professor',
      institution: newExpertInstitution.trim(),
      specialization: newExpertSpec.trim() || 'Engineering Norms Scrutiny',
      role: newExpertRole,
    };
    setScheduleCommittee([...scheduleCommittee, expert]);
    setNewExpertName('');
    setNewExpertDesignation('');
    setNewExpertInstitution('');
    setNewExpertSpec('');
    setActionError(null);
  };

  const handleRemoveExpert = (expertId: string) => {
    setScheduleCommittee(scheduleCommittee.filter((e) => e.id !== expertId));
  };

  // Submit Schedule
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!scheduleConfirmedDate && !scheduleTentativeDate) {
      setActionError('Please specify at least a confirmed or tentative visit date.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.scheduleEVC(
      selectedRecord.id,
      scheduleTentativeDate,
      scheduleConfirmedDate,
      scheduleCommittee,
      user?.name || 'Ragini Telange',
      scheduleIsUnannounced,
      scheduleVisitTerms,
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to schedule EVC visit.');
    } else {
      setScheduleModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Record Visit Completion
  const handleOpenCompletion = (rec: EVCRecord) => {
    setSelectedRecord(rec);
    setActionError(null);
    setCompletionDate('2026-10-22');
    setCompletionRemarks('');
    setCompletionModalOpen(true);
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!completionRemarks.trim()) {
      setActionError('Officer verification remarks are mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.recordEVCVisitCompletion(
      selectedRecord.id,
      completionDate,
      completionRemarks,
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to record visit completion.');
    } else {
      setCompletionModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Submit Report Modal
  const handleOpenReport = (rec: EVCRecord) => {
    setSelectedRecord(rec);
    setActionError(null);
    setReportSummary(rec.reportSummary || '');
    setReportOutcome(rec.outcomeRecommendation || 'Satisfactory');
    setReportRemarks('');
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!reportSummary.trim()) {
      setActionError('Report summary findings are mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.submitEVCReport(
      selectedRecord.id,
      reportSummary,
      reportOutcome,
      reportRemarks,
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to submit inspection report.');
    } else {
      setReportModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Cancel Modal
  const handleOpenCancel = (rec: EVCRecord) => {
    setSelectedRecord(rec);
    setActionError(null);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!cancelReason.trim()) {
      setActionError('A cancellation justification reason is mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.cancelEVCVisit(
      selectedRecord.id,
      cancelReason,
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to cancel EVC visit.');
    } else {
      setCancelModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Audit History Drawer
  const handleOpenHistory = async (rec: EVCRecord) => {
    setSelectedRecord(rec);
    setHistoryModalOpen(true);
    const logs = await dataService.getAuditLogs(rec.applicationId);
    setAuditLogs(logs);
  };

  const getStatusBadge = (status: EVCStatus) => {
    switch (status) {
      case 'report_submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Report Submitted
          </span>
        );
      case 'visit_completed':
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            Visit Completed
          </span>
        );
      case 'evc_scheduled':
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <CalendarCheck2 className="w-3.5 h-3.5 mr-1" />
            Visit Scheduled
          </span>
        );
      case 'pending_scheduling':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending Scheduling
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 line-through">
            <Ban className="w-3.5 h-3.5 mr-1" />
            Cancelled
          </span>
        );
      case 'not_required':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Not Required
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Expert Visit Committee (EVC) Tracking
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
              APH Norms Chapter 4
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Physical Inspection Pipeline • Committee Scheduling, Surprise Inspections & Statutory Scrutiny Reports
          </p>
        </div>

        {/* RBAC Notice if unauthorized */}
        {!isAuthorized && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only: Modifying EVC records requires Regional Officer or Authority authorization.</span>
          </div>
        )}
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setActiveFilter('all')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'all'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Pipeline</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{kpis.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All tracked visits</div>
        </div>

        <div
          onClick={() => setActiveFilter('pending_scheduling')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'pending_scheduling'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Pending Scheduling</div>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{kpis.pendingScheduling}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting committee dates</div>
        </div>

        <div
          onClick={() => setActiveFilter('upcoming')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'upcoming'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Upcoming Visits</div>
          <div className="text-xl font-bold text-purple-900 mt-0.5">{kpis.upcoming}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Scheduled for inspection</div>
        </div>

        <div
          onClick={() => setActiveFilter('completed')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'completed'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Visits Completed</div>
          <div className="text-xl font-bold text-blue-900 mt-0.5">{kpis.completed}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Inspection concluded</div>
        </div>

        <div
          onClick={() => setActiveFilter('missing_reports')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'missing_reports'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Missing Reports</div>
          <div className="text-xl font-bold text-rose-900 mt-0.5">{kpis.missingReports}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Report pending &gt; 48h</div>
        </div>

        <div
          onClick={() => setActiveFilter('cancelled')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            activeFilter === 'cancelled'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cancelled</div>
          <div className="text-xl font-bold text-slate-800 mt-0.5">{kpis.cancelled}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deferred or cancelled</div>
        </div>
      </div>

      {/* 3. Filters and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by application number, institute name, or visit terms..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Visit Type Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={visitTypeFilter}
            onChange={(e) => setVisitTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Inspection Types</option>
            <option value="Regular Verification">Regular Verification</option>
            <option value="Surprise / Unannounced Visit">Surprise / Unannounced Visit</option>
            <option value="Deficiency Re-inspection">Deficiency Re-inspection</option>
          </select>
        </div>
      </div>

      {/* 4. Active Filters Feedback Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> EVC records
          {activeFilter !== 'all' && (
            <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              Filter: {activeFilter.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {(activeFilter !== 'all' || visitTypeFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setActiveFilter('all');
              setVisitTypeFilter('all');
              setSearchQuery('');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 5. EVC Records List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading EVC records from regional database...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">No EVC records found</h3>
          <p className="text-xs text-slate-500 mt-1">
            No inspection records match the current filter selection or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const hasReport = !!rec.reportSubmittedAt;
            const isCompleted = rec.status === 'visit_completed' || rec.status === 'completed';
            const isScheduled = rec.status === 'evc_scheduled' || rec.status === 'scheduled';
            const isPendingScheduling = rec.status === 'pending_scheduling';
            const isCancelled = rec.status === 'cancelled';

            return (
              <Card key={rec.id} className="p-5 border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
                {/* Header Row: Application, Institution, Badges */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/regional-officer/applications/${rec.applicationId}`}
                        className="font-mono text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-colors"
                        title="View Full Application File"
                      >
                        {rec.applicationNumber}
                        <Eye className="w-3 h-3 ml-0.5" />
                      </Link>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {rec.visitType}
                      </span>
                      {rec.isUnannounced && (
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded uppercase tracking-wide">
                          <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
                          Unannounced / Surprise Visit
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{rec.institutionName}</h3>
                  </div>

                  {/* Status & History Trigger */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(rec.status)}
                    <button
                      onClick={() => handleOpenHistory(rec)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View EVC Event History & Audit Trail"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unannounced Confidential Notice */}
                {rec.isUnannounced && !isCompleted && !hasReport && (
                  <div className="my-3 p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Confidential Surprise Inspection Protocol:</strong>
                      <span>
                        Visit schedule and appointed experts are withheld from institutional display until arrival on site, in accordance with AICTE anti-corruption vigilance norms.
                      </span>
                    </div>
                  </div>
                )}

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                  {/* Column 1: Scheduling & Dates */}
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Scheduling Status & Timelines</span>
                    </div>

                    <div className="space-y-1 text-slate-600">
                      <div>
                        <span className="text-slate-500">Confirmed Date: </span>
                        <strong>{rec.confirmedDate || 'Pending Final Confirmation'}</strong>
                      </div>
                      {rec.tentativeDate && rec.tentativeDate !== rec.confirmedDate && (
                        <div>
                          <span className="text-slate-500">Tentative Window: </span>
                          <span>{rec.tentativeDate}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Lead Regional Officer: </span>
                        <strong>{rec.leadOfficerName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Scope & Terms of Reference */}
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Visit Terms of Reference</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                      {rec.visitTerms || 'Standard physical verification of instructional facilities and student amenities per APH Chapter 4.'}
                    </p>
                  </div>

                  {/* Column 3: Outstanding Actions & Status */}
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Outstanding Actions & Deadlines</span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      {isCancelled ? (
                        <span className="text-slate-500 italic">No further action. Visit was cancelled.</span>
                      ) : hasReport ? (
                        <span className="text-emerald-700 font-medium">
                          Inspection completed & report officially submitted on{' '}
                          {new Date(rec.reportSubmittedAt!).toLocaleDateString()}.
                        </span>
                      ) : isCompleted ? (
                        <div className="text-rose-700 font-semibold">
                          Visit completed! Report submission is outstanding. Mandatory submission required within 48h.
                        </div>
                      ) : isScheduled ? (
                        <span className="text-purple-700 font-medium">
                          Visit confirmed for {rec.confirmedDate}. Execute inspection on site.
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          Requires committee appointment & visit date confirmation.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointed Committee Experts Roster */}
                <div className="pt-2 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Appointed Expert Committee ({rec.committeeMembers?.length || 0} Members)
                      </span>
                    </div>
                    {isAuthorized && !isCancelled && (
                      <button
                        onClick={() => handleOpenSchedule(rec)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        {rec.committeeMembers?.length ? 'Edit Committee Roster' : '+ Appoint Committee Experts'}
                      </button>
                    )}
                  </div>

                  {rec.committeeMembers && rec.committeeMembers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {rec.committeeMembers.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900">{member.name}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {member.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {member.designation} • {member.institution}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Specialization: <strong>{member.specialization}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-800 text-xs">
                      No committee experts appointed yet. Regional Officer must assign 2–3 subject matter specialists and an architect valuer.
                    </div>
                  )}
                </div>

                {/* Submitted Report Findings (if available) */}
                {hasReport && (
                  <div className="my-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>EVC Inspection Report Findings</span>
                      </div>
                      <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                        Recommendation: {rec.outcomeRecommendation}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900/90 leading-relaxed font-sans">
                      {rec.reportSummary}
                    </p>
                    <div className="text-[10px] text-emerald-700 pt-1 flex items-center justify-between">
                      <span>Submitted on: {new Date(rec.reportSubmittedAt!).toLocaleString()}</span>
                      {rec.reportStorageUrl && (
                        <span className="font-mono text-emerald-800 underline cursor-pointer">
                          {rec.reportStorageUrl}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Operational Action Bar (Authorized Officers Only) */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    Lead RO: <strong>{rec.leadOfficerName}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Schedule / Reschedule Button */}
                    {!isCancelled && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isAuthorized}
                        onClick={() => handleOpenSchedule(rec)}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {isScheduled ? 'Reschedule Visit' : 'Schedule Visit'}
                      </Button>
                    )}

                    {/* Record Visit Completion */}
                    {(isScheduled || isPendingScheduling) && !isCancelled && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isAuthorized}
                        onClick={() => handleOpenCompletion(rec)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Record Visit Completion
                      </Button>
                    )}

                    {/* Submit EVC Report */}
                    {(isCompleted || isScheduled) && !hasReport && !isCancelled && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!isAuthorized}
                        onClick={() => handleOpenReport(rec)}
                      >
                        <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                        Submit Inspection Report
                      </Button>
                    )}

                    {/* Cancel Visit */}
                    {!isCancelled && !hasReport && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!isAuthorized}
                        onClick={() => handleOpenCancel(rec)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        Cancel Visit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Schedule / Reschedule Visit Modal */}
      {/* ========================================================================= */}
      {scheduleModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Expert Visit Committee (EVC)
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.institutionName} • {selectedRecord.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirmed Visit Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleConfirmedDate}
                    onChange={(e) => setScheduleConfirmedDate(e.target.value)}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tentative Window Date
                  </label>
                  <input
                    type="date"
                    value={scheduleTentativeDate}
                    onChange={(e) => setScheduleTentativeDate(e.target.value)}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Visit Type & Unannounced Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inspection Type</label>
                  <select
                    value={scheduleVisitType}
                    onChange={(e) => setScheduleVisitType(e.target.value as any)}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Regular Verification">Regular Verification</option>
                    <option value="Surprise / Unannounced Visit">Surprise / Unannounced Visit</option>
                    <option value="Deficiency Re-inspection">Deficiency Re-inspection</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleIsUnannounced}
                      onChange={(e) => setScheduleIsUnannounced(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Surprise / Unannounced Visit (Confidential)
                    </span>
                  </label>
                </div>
              </div>

              {scheduleIsUnannounced && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> This inspection will not be published in the institution's public portal dashboard until the committee arrives on site.
                </div>
              )}

              {/* Terms of Reference */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Visit Objectives & Terms of Reference
                </label>
                <textarea
                  rows={2}
                  value={scheduleVisitTerms}
                  onChange={(e) => setScheduleVisitTerms(e.target.value)}
                  placeholder="Specify facilities to inspect, laboratory requirements, cadre rosters, or building stability..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Committee Members Builder */}
              <div className="border-t pt-3">
                <div className="font-bold text-slate-800 mb-2">
                  Appointed Committee Members ({scheduleCommittee.length})
                </div>

                {/* List existing in form */}
                {scheduleCommittee.length > 0 && (
                  <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                    {scheduleCommittee.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px]"
                      >
                        <div>
                          <strong>{m.name}</strong> ({m.role}) — {m.designation}, {m.institution} [{m.specialization}]
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpert(m.id)}
                          className="text-rose-600 hover:text-rose-800 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Member Subform */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-700 text-[11px]">Add New Expert Member:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Expert Full Name (e.g., Dr. A. K. Sharma)"
                      value={newExpertName}
                      onChange={(e) => setNewExpertName(e.target.value)}
                      className="p-1.5 border rounded border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Designation (e.g., Professor / Dean)"
                      value={newExpertDesignation}
                      onChange={(e) => setNewExpertDesignation(e.target.value)}
                      className="p-1.5 border rounded border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Affiliated Institution (e.g., VNIT Nagpur)"
                      value={newExpertInstitution}
                      onChange={(e) => setNewExpertInstitution(e.target.value)}
                      className="p-1.5 border rounded border-slate-300 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Specialization (e.g., Robotics)"
                        value={newExpertSpec}
                        onChange={(e) => setNewExpertSpec(e.target.value)}
                        className="p-1.5 border rounded border-slate-300 text-xs flex-1"
                      />
                      <select
                        value={newExpertRole}
                        onChange={(e) => setNewExpertRole(e.target.value as any)}
                        className="p-1.5 border rounded border-slate-300 text-xs bg-white"
                      >
                        <option value="Chairman">Chairman</option>
                        <option value="Member">Member</option>
                        <option value="Architect">Architect</option>
                        <option value="Regional Officer Representative">RO Rep</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddExpert}>
                      <Plus className="w-3 h-3 mr-1" /> Add Member to Roster
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Confirm EVC Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Record Visit Completion Modal */}
      {/* ========================================================================= */}
      {completionModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record EVC Visit Execution</h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.institutionName} • {selectedRecord.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setCompletionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCompletionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Inspection Completion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Officer Execution Remarks & Inspection Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  placeholder="Record verification that the expert committee convened, physical inspection was conducted, and attendance register signed..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Mark Visit as Completed'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Submit Inspection Report Modal */}
      {/* ========================================================================= */}
      {reportModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit EVC Inspection Report & Recommendation
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.institutionName} • {selectedRecord.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Outcome Recommendation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportOutcome}
                  onChange={(e) => setReportOutcome(e.target.value as any)}
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Satisfactory">Satisfactory (Recommended for Approval)</option>
                  <option value="Deficiencies Found">Deficiencies Found (Rectification Required)</option>
                  <option value="Severe Violations">Severe Violations (Non-Approval / Rejection)</option>
                  <option value="Re-visit Recommended">Re-visit Recommended (Inconclusive / Second Inspection)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Committee Report Findings Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize the physical inspection findings across instructional labs, barrier-free accessibility, computing nodes, fire safety measures, and cadre ratio..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Regional Officer Scrutiny Remarks
                </label>
                <textarea
                  rows={2}
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  placeholder="Internal Regional Office remarks or endorsements..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Officially Submit EVC Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Cancel Visit Modal */}
      {/* ========================================================================= */}
      {cancelModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Cancel EVC Inspection Visit
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.institutionName} • {selectedRecord.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel this scheduled EVC visit? Cancelling this visit will record an official regulatory event and notify all appointed committee experts.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Cancellation Justification Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter official reason for cancellation (e.g., deferral granted under force majeure, application withdrawn, or administrative reschedule)..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(false)}
                >
                  Keep Visit
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Audit Event History Drawer */}
      {/* ========================================================================= */}
      {historyModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  EVC Event & Audit History
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.institutionName} • {selectedRecord.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No recorded audit trail events found for this EVC record.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-800">
                      <span className="font-bold text-blue-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Actor: <strong>{log.actorName}</strong> ({log.actorRole})
                    </div>
                    {log.previousState && (
                      <div className="text-[10px] text-slate-500">
                        Transition: <span className="font-mono">{log.previousState}</span> →{' '}
                        <span className="font-mono font-semibold text-blue-700">{log.newState}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-700 italic mt-1 leading-relaxed">
                      "{log.remarks}"
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="text-right border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(false)}
              >
                Close History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
