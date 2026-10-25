import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LateSubmissionRequest, LateRequestStatus, AuditEvent } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  AlertCircle,
  ClockAlert,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  X,
  History,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  Ban,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const LateRequestsView: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();

  const [requests, setRequests] = useState<LateSubmissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [moreInfoModalOpen, setMoreInfoModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LateSubmissionRequest | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);

  // Form states
  const [decisionType, setDecisionType] = useState<'accepted_for_processing' | 'not_accepted'>('accepted_for_processing');
  const [reviewerRemarks, setReviewerRemarks] = useState('');
  const [statutoryCheckboxAcknowledged, setStatutoryCheckboxAcknowledged] = useState(false);
  const [moreInfoRemarks, setMoreInfoRemarks] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Check RBAC permissions
  const isAuthorized =
    user?.role === 'regional_officer' ||
    user?.role === 'senior_authority' ||
    user?.role === 'super_admin';

  useEffect(() => {
    setIsLoading(true);
    dataService.getLateRequests().then((res) => {
      setRequests(res);
      setIsLoading(false);
    });
  }, [dataService, refreshKey]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.detailedReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reasonCategory.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (categoryFilter !== 'all' && req.reasonCategory !== categoryFilter) {
        return false;
      }

      if (statusFilter === 'all') return true;
      return req.status === statusFilter;
    });
  }, [requests, searchQuery, statusFilter, categoryFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending_review').length;
    const moreInfo = requests.filter((r) => r.status === 'more_info_required').length;
    const accepted = requests.filter((r) => r.status === 'accepted_for_processing').length;
    const notAccepted = requests.filter((r) => r.status === 'not_accepted').length;
    return { total, pending, moreInfo, accepted, notAccepted };
  }, [requests]);

  // Open Decision Modal
  const handleOpenDecision = (req: LateSubmissionRequest) => {
    setSelectedRequest(req);
    setDecisionType('accepted_for_processing');
    setReviewerRemarks('');
    setStatutoryCheckboxAcknowledged(false);
    setActionError(null);
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!reviewerRemarks.trim()) {
      setActionError('Officer recommendation remarks and justification are mandatory.');
      return;
    }
    if (!statutoryCheckboxAcknowledged) {
      setActionError('You must acknowledge the statutory regulatory condition before proceeding.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const res = await dataService.reviewLateRequest(
      selectedRequest.id,
      decisionType,
      reviewerRemarks.trim(),
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to record decision.');
    } else {
      setDecisionModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Request More Info Modal
  const handleOpenMoreInfo = (req: LateSubmissionRequest) => {
    setSelectedRequest(req);
    setMoreInfoRemarks('');
    setActionError(null);
    setMoreInfoModalOpen(true);
  };

  const handleMoreInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!moreInfoRemarks.trim()) {
      setActionError('Clarification instructions explaining what information is needed are mandatory.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const res = await dataService.reviewLateRequest(
      selectedRequest.id,
      'more_info_required',
      moreInfoRemarks.trim(),
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to request additional information.');
    } else {
      setMoreInfoModalOpen(false);
      triggerRefresh();
    }
  };

  // Open Audit History
  const handleOpenHistory = async (req: LateSubmissionRequest) => {
    setSelectedRequest(req);
    setHistoryModalOpen(true);
    const logs = await dataService.getAuditLogs(req.applicationId);
    setAuditLogs(logs);
  };

  const getStatusBadge = (status: LateRequestStatus) => {
    switch (status) {
      case 'accepted_for_processing':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Accepted for Processing
          </span>
        );
      case 'not_accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <Ban className="w-3.5 h-3.5 mr-1" />
            Petition Declined
          </span>
        );
      case 'more_info_required':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            More Info Required
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <ClockAlert className="w-3.5 h-3.5 mr-1" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Late Submission & Re-Application Requests
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
              APH Condonation Scrutiny
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review Extraordinary Submissions, Condonation Petitions, and Force Majeure Evidence
          </p>
        </div>

        {/* RBAC Notice if unauthorized */}
        {!isAuthorized && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only: Reviewing late submission requests requires Regional Officer authorization.</span>
          </div>
        )}
      </div>

      {/* 2. Mandatory Statutory Disclaimer Box (Section D requirement) */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border-2 border-amber-400/80 rounded-2xl text-xs text-amber-950 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <strong className="text-amber-950 text-sm font-bold uppercase tracking-wider">
              Statutory AICTE Normative Governance Rule:
            </strong>
            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.2 rounded-full border border-amber-300">
              Mandatory Legal Provision
            </span>
          </div>
          <p className="leading-relaxed text-amber-900">
            Accepting an application or late petition for regional officer processing <strong>DOES NOT</strong> itself grant a statutory deadline extension, official exemption, or regulatory waiver to AICTE Approval Process Handbook guidelines. It solely permits regional scrutiny of the uploaded dossier. Official condonation of delay remains subject to statutory decision by the AICTE Executive Committee.
          </p>
        </div>
      </div>

      {/* 3. KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Petitions</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{kpis.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All late requests</div>
        </div>

        <div
          onClick={() => setStatusFilter('pending_review')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            statusFilter === 'pending_review'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Pending Review</div>
          <div className="text-xl font-bold text-blue-900 mt-0.5">{kpis.pending}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Awaiting initial action</div>
        </div>

        <div
          onClick={() => setStatusFilter('more_info_required')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            statusFilter === 'more_info_required'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">More Info Required</div>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{kpis.moreInfo}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Clarification requested</div>
        </div>

        <div
          onClick={() => setStatusFilter('accepted_for_processing')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            statusFilter === 'accepted_for_processing'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Accepted for Scrutiny</div>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">{kpis.accepted}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Admitted to queue</div>
        </div>

        <div
          onClick={() => setStatusFilter('not_accepted')}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            statusFilter === 'not_accepted'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Petition Declined</div>
          <div className="text-xl font-bold text-rose-900 mt-0.5">{kpis.notAccepted}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Rejected condonation</div>
        </div>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by application number, institution, or grounds for late request..."
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

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Grounds Categories</option>
            <option value="Natural Calamity">Natural Calamity</option>
            <option value="Technical Gateway Failure">Technical Gateway Failure</option>
            <option value="Administrative Exigency">Administrative Exigency</option>
            <option value="Judicial Order">Judicial Order</option>
          </select>
        </div>
      </div>

      {/* 5. Request Cards List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading late submission requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          <ClockAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1">No late submission petitions match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="p-5 border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
              {/* Header: App #, Institution, Category, Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/regional-officer/applications/${req.applicationId}`}
                      className="font-mono text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-colors"
                      title="View Linked Application"
                    >
                      {req.applicationNumber}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {req.requestType}
                    </span>
                    <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      Grounds: {req.reasonCategory}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{req.institutionName}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(req.status)}
                  <button
                    onClick={() => handleOpenHistory(req)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View Request Review History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body: Grounds & Evidence */}
              <div className="py-3 space-y-3 text-xs">
                {/* Stated Reason */}
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Institution's Stated Grounds & Circumstances:
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    "{req.detailedReason}"
                  </p>
                </div>

                {/* Metadata & Supporting Evidence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <div className="text-slate-500">Submission Timestamp:</div>
                    <strong className="text-slate-800">
                      {new Date(req.requestedAt).toLocaleString()}
                    </strong>
                    <div className="text-[10px] text-slate-400">
                      Statutory cutoff was breached; condonation request logged.
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <div className="text-slate-500">Supporting Evidence Metadata:</div>
                    {req.supportingDocName ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-blue-700 font-semibold truncate">
                          {req.supportingDocName}
                        </span>
                        <button
                          onClick={() => alert(`Simulating secure preview of ${req.supportingDocName}`)}
                          className="text-[10px] bg-white text-blue-700 hover:bg-blue-50 font-semibold px-2 py-0.5 rounded border border-blue-200 shrink-0"
                        >
                          View Evidence
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No supporting evidence document attached.</span>
                    )}
                  </div>
                </div>

                {/* Review History / Remarks */}
                {req.reviewedBy && (
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-semibold">Review Record & Officer Justification:</strong>
                      <span className="text-[10px] text-blue-700">
                        Reviewed by {req.reviewedBy} on {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-950 italic">
                      "{req.reviewerRemarks}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Statutory disclaimer formally affirmed by institution representative</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Request More Info */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isAuthorized}
                    onClick={() => handleOpenMoreInfo(req)}
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Request Additional Info
                  </Button>

                  {/* Record Decision */}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!isAuthorized}
                    onClick={() => handleOpenDecision(req)}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                    Record Permitted Decision
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Record Permitted Decision Modal */}
      {/* ========================================================================= */}
      {decisionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Regional Officer Recommendation / Decision
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRequest.institutionName} • {selectedRequest.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statutory Disclaimer inside Decision Modal */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Statutory Regulation Notice:</strong>
                <span className="text-[11px] leading-relaxed">
                  Accepting this late request for processing allows Regional Officers to conduct scrutiny. It <strong>does NOT</strong> grant an official statutory deadline extension or regulatory waiver to AICTE APH cutoff dates.
                </span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Permitted Review Decision <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2 ${
                      decisionType === 'accepted_for_processing'
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisionType"
                      value="accepted_for_processing"
                      checked={decisionType === 'accepted_for_processing'}
                      onChange={() => setDecisionType('accepted_for_processing')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <strong className="block text-emerald-900 font-semibold">Accept for Processing</strong>
                      <span className="text-[10px] text-emerald-700">
                        Admit into regional scrutiny workspace
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2 ${
                      decisionType === 'not_accepted'
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisionType"
                      value="not_accepted"
                      checked={decisionType === 'not_accepted'}
                      onChange={() => setDecisionType('not_accepted')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <strong className="block text-rose-900 font-semibold">Decline Petition</strong>
                      <span className="text-[10px] text-rose-700">
                        Reject condonation of statutory delay
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Officer Remarks & Decision Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewerRemarks}
                  onChange={(e) => setReviewerRemarks(e.target.value)}
                  placeholder="Record grounds for acceptance/rejection (e.g., force majeure verified via district notification, or inadequate evidence provided)..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mandatory Statutory Acknowledgment Checkbox */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statutoryCheckboxAcknowledged}
                    onChange={(e) => setStatutoryCheckboxAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    I confirm that accepting this request for processing merely allows scrutiny evaluation and does <strong>NOT</strong> grant an official exemption or waiver to AICTE statutory deadlines.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Submit Permitted Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Request Additional Info Modal */}
      {/* ========================================================================= */}
      {moreInfoModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Request Additional Information / Clarification
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRequest.institutionName} • {selectedRequest.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setMoreInfoModalOpen(false)}
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

            <form onSubmit={handleMoreInfoSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Specify what additional proof, certified gazette notifications, bank transaction logs, or municipal orders are required to substantiate the petition.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clarification Query & Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={moreInfoRemarks}
                  onChange={(e) => setMoreInfoRemarks(e.target.value)}
                  placeholder="e.g. Certified bank dispute reference number (UTR) required from branch manager regarding transaction timeout on cutoff night..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMoreInfoModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : 'Send Clarification Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Audit Event History Drawer */}
      {/* ========================================================================= */}
      {historyModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  Petition Review & Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRequest.institutionName} • {selectedRequest.applicationNumber}
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
                  No recorded audit trail events found for this petition.
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
