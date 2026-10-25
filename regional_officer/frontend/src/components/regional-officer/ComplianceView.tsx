import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ComplianceItem, ComplianceStatus, ApplicationDocument, Application } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  calculateDeadlineDaysRemaining,
  getDeadlineIndicator,
  calculateDocumentExpiry,
} from '../../modules/regional-officer/utils/dateHelpers';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Search,
  Filter,
  Eye,
  Calendar,
  X,
  FileText,
  AlertCircle,
  ClockAlert,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
} from 'lucide-react';

export const ComplianceView: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();

  // Primary Tab: 'undertakings' | 'document_expiry'
  const [activeMainTab, setActiveMainTab] = useState<'undertakings' | 'document_expiry'>('undertakings');

  // Tab 1: Undertakings state
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab 2: Document Expiry Monitoring state
  const [allDocs, setAllDocs] = useState<(ApplicationDocument & { institutionName: string; appNumber: string })[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [expiryThreshold, setExpiryThreshold] = useState<number>(30); // Configurable threshold: 30, 15, 7, etc.
  const [docFilter, setDocFilter] = useState<'all' | 'approaching' | 'expired' | 'no_expiry'>('approaching');
  const [docSearch, setDocSearch] = useState('');

  // Modals for Compliance Actions
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [officerRemarksInput, setOfficerRemarksInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // RBAC permission check
  const isAuthorized =
    user?.role === 'regional_officer' ||
    user?.role === 'senior_authority' ||
    user?.role === 'super_admin';

  // Load Compliance Items
  useEffect(() => {
    setIsLoadingItems(true);
    dataService.getComplianceItems().then((res) => {
      setItems(res);
      setIsLoadingItems(false);
    });
  }, [dataService, refreshKey]);

  // Load Documents across all applications for Expiry Monitoring
  useEffect(() => {
    setIsLoadingDocs(true);
    dataService.getApplications().then(async (apps) => {
      const docPromises = apps.map(async (app) => {
        const docs = await dataService.getDocumentsByApplicationId(app.id);
        return docs.map((d) => ({
          ...d,
          institutionName: app.institution.name,
          appNumber: app.applicationNumber,
        }));
      });
      const nested = await Promise.all(docPromises);
      setAllDocs(nested.flat());
      setIsLoadingDocs(false);
    });
  }, [dataService, refreshKey]);

  // Filtered Compliance Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'escalated') return item.escalationLevel === 'critical_overdue';
      return item.status === statusFilter;
    });
  }, [items, searchQuery, statusFilter]);

  // KPIs for Compliance
  const complianceKpis = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const submitted = items.filter((i) => i.status === 'submitted').length;
    const verified = items.filter((i) => i.status === 'verified').length;
    const overdue = items.filter((i) => i.status === 'overdue').length;
    const escalated = items.filter((i) => i.escalationLevel === 'critical_overdue').length;
    return { total, pending, submitted, verified, overdue, escalated };
  }, [items]);

  // Evaluated and Filtered Documents for Expiry Monitoring
  const evaluatedDocs = useMemo(() => {
    return allDocs.map((doc) => {
      const expiryResult = calculateDocumentExpiry(doc.expiryDate, expiryThreshold);
      return {
        ...doc,
        expiryResult,
      };
    });
  }, [allDocs, expiryThreshold]);

  const filteredDocs = useMemo(() => {
    return evaluatedDocs.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.code.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.institutionName.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.appNumber.toLowerCase().includes(docSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (docFilter === 'approaching') {
        return doc.expiryResult.isApproachingExpiry;
      }
      if (docFilter === 'expired') {
        return doc.expiryResult.isExpired;
      }
      if (docFilter === 'no_expiry') {
        return !doc.expiryResult.hasExpiry;
      }
      return true; // 'all'
    });
  }, [evaluatedDocs, docSearch, docFilter]);

  // Expiry KPIs
  const expiryKpis = useMemo(() => {
    const expiredCount = evaluatedDocs.filter((d) => d.expiryResult.isExpired).length;
    const approachingCount = evaluatedDocs.filter((d) => d.expiryResult.isApproachingExpiry).length;
    const noExpiryCount = evaluatedDocs.filter((d) => !d.expiryResult.hasExpiry).length;
    const total = evaluatedDocs.length;
    return { expiredCount, approachingCount, noExpiryCount, total };
  }, [evaluatedDocs]);

  // Handle Open Verification Modal
  const handleOpenVerification = (item: ComplianceItem) => {
    setSelectedItem(item);
    setOfficerRemarksInput('Verified compliant against AICTE statutory regulations and institutional records.');
    setActionError(null);
    setVerificationModalOpen(true);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!officerRemarksInput.trim()) {
      setActionError('Officer verification remarks are mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.updateComplianceStatus(
      selectedItem.id,
      'verified',
      officerRemarksInput.trim(),
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to record verification.');
    } else {
      setVerificationModalOpen(false);
      triggerRefresh();
    }
  };

  // Handle Open Correction Modal
  const handleOpenCorrection = (item: ComplianceItem) => {
    setSelectedItem(item);
    setOfficerRemarksInput('Affidavit incomplete or certificate renewal proof missing. Mandatory resubmission required.');
    setActionError(null);
    setCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!officerRemarksInput.trim()) {
      setActionError('Correction instructions and deficiency remarks are mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await dataService.updateComplianceStatus(
      selectedItem.id,
      'correction_required',
      officerRemarksInput.trim(),
      user?.name || 'Ragini Telange',
      user?.role
    );

    setActionLoading(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to request corrections.');
    } else {
      setCorrectionModalOpen(false);
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Page Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Compliance Management & Document Expiry Watchlist
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              APH Statutory Directives
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Statutory Undertakings, Anti-Ragging Mandates, and Configurable Document Expiry Monitoring
          </p>
        </div>

        {/* RBAC Notice if unauthorized */}
        {!isAuthorized && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only: Evaluating compliance or recording verification requires Regional Officer permissions.</span>
          </div>
        )}
      </div>

      {/* 2. Main Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('undertakings')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeMainTab === 'undertakings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Statutory Compliance Undertakings ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('document_expiry')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeMainTab === 'document_expiry'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClockAlert className="w-4 h-4" />
          <span>Document Expiry Monitoring ({allDocs.length})</span>
          {expiryKpis.expiredCount > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {expiryKpis.expiredCount} Expired
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: Statutory Compliance Undertakings */}
      {/* ========================================================================= */}
      {activeMainTab === 'undertakings' && (
        <div className="space-y-5">
          {/* KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setStatusFilter('all')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">All Items</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{complianceKpis.total}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tracked mandates</div>
            </div>

            <div
              onClick={() => setStatusFilter('pending')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Pending</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">{complianceKpis.pending}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Awaiting submission</div>
            </div>

            <div
              onClick={() => setStatusFilter('submitted')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'submitted'
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider">Submitted</div>
              <div className="text-xl font-bold text-indigo-900 mt-0.5">{complianceKpis.submitted}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Ready for review</div>
            </div>

            <div
              onClick={() => setStatusFilter('verified')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'verified'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Verified</div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">{complianceKpis.verified}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Verified compliant</div>
            </div>

            <div
              onClick={() => setStatusFilter('overdue')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'overdue'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Overdue</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{complianceKpis.overdue}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Deadline lapsed</div>
            </div>

            <div
              onClick={() => setStatusFilter('escalated')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                statusFilter === 'escalated'
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Escalated</div>
              <div className="text-xl font-bold text-purple-900 mt-0.5">{complianceKpis.escalated}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">Bureau notice sent</div>
            </div>
          </div>

          {/* Search Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by mandate title, clause, or institution name..."
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

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
              <span>Showing {filteredItems.length} of {items.length} items</span>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-blue-600 hover:underline ml-1"
                >
                  Reset filter
                </button>
              )}
            </div>
          </div>

          {/* Compliance Items List */}
          {isLoadingItems ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading statutory compliance undertakings...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">No compliance requirements found</h3>
              <p className="text-xs text-slate-500 mt-1">No items match your active search or filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isVerified = item.status === 'verified';
                const deadlineIndicator = getDeadlineIndicator(item.dueDate, isVerified);
                const deadlineInfo = calculateDeadlineDaysRemaining(item.dueDate);

                return (
                  <Card key={item.id} className="p-5 border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
                    {/* Top Row: Title, Clause, Institution, Deadline Indicator */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                          <span className="font-mono text-[11px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Clause: {item.clause}
                          </span>
                          {item.escalationLevel === 'critical_overdue' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                              CRITICAL ESCALATION
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span>Institute: <strong>{item.institutionName}</strong></span>
                          {item.applicationId && (
                            <>
                              <span>•</span>
                              <Link
                                to={`/regional-officer/applications/${item.applicationId}`}
                                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                              >
                                View Linked Application
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Deadline Indicator */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <Badge
                          variant={
                            item.status === 'verified'
                              ? 'success'
                              : item.status === 'overdue'
                              ? 'danger'
                              : item.status === 'submitted'
                              ? 'info'
                              : item.status === 'correction_required'
                              ? 'warning'
                              : 'default'
                          }
                          size="md"
                        >
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>

                        {/* Deadline Indicator Component (Section E) */}
                        <span
                          aria-label={deadlineIndicator.accessibleText}
                          className={`text-xs px-2.5 py-1 rounded-full border ${deadlineIndicator.badgeClass}`}
                        >
                          {deadlineIndicator.label}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Description & Dates */}
                    <div className="py-3 space-y-3 text-xs">
                      <p className="text-slate-700 leading-relaxed">{item.description}</p>

                      {/* Timelines and Overdue Duration Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Statutory Due Date:</span>
                          <strong className="text-slate-800">{item.dueDate}</strong>
                        </div>

                        <div>
                          <span className="text-slate-500 block">Overdue Duration / Timeliness:</span>
                          <span
                            aria-label={deadlineInfo.accessibleText}
                            className={`font-semibold ${
                              isVerified
                                ? 'text-emerald-700'
                                : deadlineInfo.isOverdue
                                ? 'text-rose-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {isVerified ? 'Fulfilled on Schedule' : deadlineInfo.accessibleText}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">Associated Document Expiry:</span>
                          {item.documentExpiryDate ? (
                            <strong className="text-amber-800">{item.documentExpiryDate}</strong>
                          ) : (
                            <span className="text-slate-400 italic">No specific expiry date recorded</span>
                          )}
                        </div>
                      </div>

                      {/* Uploaded Evidence Metadata Box */}
                      {item.submittedDocumentName ? (
                        <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                              <strong className="block font-semibold">
                                Submitted Affidavit / Evidence: {item.submittedDocumentName}
                              </strong>
                              <span className="text-[10px] text-blue-700">
                                Submitted on: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Simulating secure preview of ${item.submittedDocumentName}`)}
                            className="text-xs bg-white text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded border border-blue-300 shadow-2xs transition-colors shrink-0"
                          >
                            Preview Affidavit
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs italic flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>No evidence affidavit uploaded yet by the institution.</span>
                        </div>
                      )}

                      {/* Previous Review Remarks */}
                      {item.officerRemarks && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                          <strong className="font-semibold text-slate-900">Officer Remarks / Findings: </strong>
                          <span>{item.officerRemarks}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Bar (Authorized Officers Only) */}
                    <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500">
                        Required Next Action:{' '}
                        <strong className="text-slate-700">
                          {isVerified
                            ? 'Verification recorded. Compliance archive maintained.'
                            : item.status === 'submitted'
                            ? 'Review uploaded evidence affidavit and record verification.'
                            : item.status === 'overdue'
                            ? 'Issue formal compliance demand notice or escalate.'
                            : 'Awaiting institutional affidavit upload.'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Request Correction Button */}
                        {!isVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isAuthorized}
                            onClick={() => handleOpenCorrection(item)}
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Request Correction
                          </Button>
                        )}

                        {/* Record Verification Button */}
                        {!isVerified && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!isAuthorized}
                            onClick={() => handleOpenVerification(item)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Record Verification
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: Document Expiry Monitoring & Watchlist */}
      {/* ========================================================================= */}
      {activeMainTab === 'document_expiry' && (
        <div className="space-y-5">
          {/* Configurable Threshold Notice & Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Configurable Document Expiry Thresholds
                </h3>
                <p className="text-xs text-slate-500">
                  Select or enter the statutory advance warning horizon instead of hardcoding a universal rule.
                </p>
              </div>

              {/* Threshold Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-600 mr-1">Threshold:</span>
                {[30, 15, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() => setExpiryThreshold(days)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      expiryThreshold === days
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={expiryThreshold}
                    onChange={(e) => setExpiryThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 p-1 text-xs text-center border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">days</span>
                </div>
              </div>
            </div>

            {/* Strict Regulatory Rule Notice Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-semibold">AICTE Document Expiry Scrutiny Rule (Zero Assumption):</strong>
                <span className="text-[11px] leading-relaxed">
                  Only documents with an explicit, source-recorded expiration date (e.g. Fire NOC, Building Stability, Lift Fitness, Pollution Consent) are subject to expiry evaluation. Permanent records (e.g. Registered Land Sale Deeds, Master Architect Plans) lack an expiry date and are <strong>strictly never inferred</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Expiry KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setDocFilter('approaching')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                docFilter === 'approaching'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Approaching Expiry</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">{expiryKpis.approachingCount}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Within {expiryThreshold} days</div>
            </div>

            <div
              onClick={() => setDocFilter('expired')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                docFilter === 'expired'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Expired Documents</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{expiryKpis.expiredCount}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Past statutory validity</div>
            </div>

            <div
              onClick={() => setDocFilter('no_expiry')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                docFilter === 'no_expiry'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Permanent / No Expiry</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{expiryKpis.noExpiryCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Land titles, deeds</div>
            </div>

            <div
              onClick={() => setDocFilter('all')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                docFilter === 'all'
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">All Monitored Documents</div>
              <div className="text-xl font-bold text-blue-900 mt-0.5">{expiryKpis.total}</div>
              <div className="text-[10px] text-blue-600 mt-0.5">Total across portfolio</div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search documents by name, code, application #, or institution..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {docSearch && (
                <button
                  onClick={() => setDocSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 shrink-0">
              Showing <strong>{filteredDocs.length}</strong> matching documents
            </div>
          </div>

          {/* Documents Table */}
          {isLoadingDocs ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Scanning repository for document expiries...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <ClockAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">No documents found in this view</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try switching the filter to "All Monitored Documents" or expanding the threshold.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Document Details</th>
                      <th className="py-3 px-4">Institution & Application</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Actual Expiry Date</th>
                      <th className="py-3 px-4">Days Remaining / Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => {
                      const res = doc.expiryResult;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Document Name & Code */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {doc.code}
                              </span>
                              <span>• {doc.category}</span>
                            </div>
                          </td>

                          {/* Institution & App */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{doc.institutionName}</div>
                            <Link
                              to={`/regional-officer/applications/${doc.applicationId}`}
                              className="font-mono text-[11px] text-blue-600 hover:underline"
                            >
                              {doc.appNumber}
                            </Link>
                          </td>

                          {/* Issue Date */}
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {doc.issueDate || 'Not specified'}
                          </td>

                          {/* Actual Expiry Date */}
                          <td className="py-3 px-4">
                            {doc.expiryDate ? (
                              <span className="font-mono font-bold text-slate-900 text-[11px]">
                                {doc.expiryDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                None (Permanent Record)
                              </span>
                            )}
                          </td>

                          {/* Days Remaining / Expiry Badge */}
                          <td className="py-3 px-4">
                            <span
                              aria-label={res.accessibleText}
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${res.badgeClass}`}
                            >
                              {res.label}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/regional-officer/scrutiny-workspace/${doc.applicationId}`}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1"
                            >
                              Inspect in Workspace
                              <Eye className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Record Compliance Verification */}
      {/* ========================================================================= */}
      {verificationModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Compliance Verification
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedItem.title} • {selectedItem.institutionName}
                </p>
              </div>
              <button
                onClick={() => setVerificationModalOpen(false)}
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

            <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>
                  Clause: <strong>{selectedItem.clause}</strong>
                </div>
                <div>
                  Submitted Affidavit:{' '}
                  <strong>{selectedItem.submittedDocumentName || 'Undertaking affirmed on portal'}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Regional Officer Verification Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={officerRemarksInput}
                  onChange={(e) => setOfficerRemarksInput(e.target.value)}
                  placeholder="Record verification remarks confirming the affidavit conforms to statutory AICTE guidelines..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerificationModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Verify Compliant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Request Compliance Correction */}
      {/* ========================================================================= */}
      {correctionModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Request Compliance Correction / Rectification
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedItem.title} • {selectedItem.institutionName}
                </p>
              </div>
              <button
                onClick={() => setCorrectionModalOpen(false)}
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

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Specify the deficiency or missing affidavits. The institution will be formally notified to rectify this compliance item.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deficiency Remarks & Rectification Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={officerRemarksInput}
                  onChange={(e) => setOfficerRemarksInput(e.target.value)}
                  placeholder="Explain why the submitted evidence is deficient or requires updated certification..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCorrectionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Issuing...' : 'Issue Correction Notice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
