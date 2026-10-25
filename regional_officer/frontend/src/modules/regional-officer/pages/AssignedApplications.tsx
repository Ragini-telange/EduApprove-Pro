import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useRegionalOfficerData } from '../hooks';
import { Application, ApplicationStatus, UserRole } from '../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import { calculateDeadlineDaysRemaining } from '../utils/dateHelpers';
import { getRegionalOfficerService } from '../services';
import {
  Search,
  Eye,
  AlertCircle,
  RefreshCw,
  UserCheck,
  X,
  Filter,
  ArrowUpDown,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCog,
  SlidersHorizontal,
} from 'lucide-react';

export const AssignedApplications: React.FC = () => {
  const { user } = useAuth();
  const service = getRegionalOfficerService();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const initialStatus = searchParams.get('status') || 'all';
  const initialFilter = searchParams.get('filter') || 'all';
  const initialType = searchParams.get('type') || 'all';
  const initialUrgency = searchParams.get('urgency') || 'all';
  const initialJurisdiction = searchParams.get('jurisdiction') || 'all';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [urgencyFilter, setUrgencyFilter] = useState(initialUrgency);
  const [jurisdictionFilter, setJurisdictionFilter] = useState(initialJurisdiction);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [specialFilter, setSpecialFilter] = useState(initialFilter);

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<'deadline_asc' | 'deadline_desc' | 'submitted_desc' | 'app_number' | 'institution_asc'>('deadline_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetAppForReassign, setTargetAppForReassign] = useState<Application | null>(null);
  const [newOfficerName, setNewOfficerName] = useState('Officer Amit Verma (WRO Desk 4)');
  const [isReassigning, setIsReassigning] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Data fetching hook with jurisdictional access enforcement
  const { applications, isLoading, error, refetch } = useRegionalOfficerData({
    officerJurisdictions: user.jurisdictionStates, // STRICT RBAC: Only authorized states
  });

  // Sync URL search params
  useEffect(() => {
    const s = searchParams.get('status');
    const f = searchParams.get('filter');
    const t = searchParams.get('type');
    const u = searchParams.get('urgency');
    const j = searchParams.get('jurisdiction');
    if (s) setStatusFilter(s);
    if (f) setSpecialFilter(f);
    if (t) setTypeFilter(t);
    if (u) setUrgencyFilter(u);
    if (j) setJurisdictionFilter(j);
  }, [searchParams]);

  // Update query params helper
  const updateQueryParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    updateQueryParam('status', val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setUrgencyFilter('all');
    setJurisdictionFilter('all');
    setDateFrom('');
    setDateTo('');
    setSpecialFilter('all');
    setSortBy('deadline_asc');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Perform filtration & sorting on authorized applications
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app: Application) => {
        // Status
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;

        // Type
        if (typeFilter !== 'all' && app.type !== typeFilter) return false;

        // Urgency
        if (urgencyFilter !== 'all' && app.priority !== urgencyFilter) return false;

        // Jurisdiction State
        if (jurisdictionFilter !== 'all' && app.institution.state !== jurisdictionFilter) return false;

        // Overdue Special Filter
        if (specialFilter === 'overdue') {
          const deadlineInfo = calculateDeadlineDaysRemaining(app.deadlineDate);
          if (!deadlineInfo.isOverdue) return false;
        }

        // Date Range
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (new Date(app.submittedAt).getTime() < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).getTime();
          if (new Date(app.submittedAt).getTime() > toTime) return false;
        }

        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = app.applicationNumber.toLowerCase().includes(q);
          const matchName = app.institution.name.toLowerCase().includes(q);
          const matchCity = app.institution.city.toLowerCase().includes(q);
          const matchPID = app.institution.aictePermanentId.toLowerCase().includes(q);
          if (!matchNum && !matchName && !matchCity && !matchPID) return false;
        }

        return true;
      })
      .sort((a: Application, b: Application) => {
        switch (sortBy) {
          case 'deadline_asc':
            return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
          case 'deadline_desc':
            return new Date(b.deadlineDate).getTime() - new Date(a.deadlineDate).getTime();
          case 'submitted_desc':
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          case 'app_number':
            return a.applicationNumber.localeCompare(b.applicationNumber);
          case 'institution_asc':
            return a.institution.name.localeCompare(b.institution.name);
          default:
            return 0;
        }
      });
  }, [applications, statusFilter, typeFilter, urgencyFilter, jurisdictionFilter, specialFilter, dateFrom, dateTo, searchQuery, sortBy]);

  // Pagination calculation
  const totalItems = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    urgencyFilter !== 'all' ||
    jurisdictionFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    specialFilter !== 'all';

  // Handle case reassignment
  const handleConfirmReassignment = async () => {
    if (!targetAppForReassign) return;
    setIsReassigning(true);

    const result = await (service as any).baseService.reassignApplication(
      targetAppForReassign.id,
      'ro-usr-002',
      newOfficerName,
      user.role
    );

    setIsReassigning(false);
    setReassignModalOpen(false);

    if (result.success) {
      setActionSuccessMsg(`Case ${targetAppForReassign.applicationNumber} reassigned to ${newOfficerName}.`);
      refetch();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Assigned Applications Management
            </h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredApplications.length} of {applications.length} Cases
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Authorized Jurisdiction: <strong className="text-slate-800">{user.jurisdictionStates.join(', ')}</strong> ({user.regionalOffice})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={handleResetFilters}>
              Reset Filters
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <Card className="!p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, institute, city, PID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* 2. Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="all">All Regulatory Statuses</option>
              <option value="submitted">Submitted (Awaiting Initial Scrutiny)</option>
              <option value="under_scrutiny">Under Scrutiny</option>
              <option value="correction_required">Correction Required</option>
              <option value="resubmitted">Resubmitted (Awaiting Re-Scrutiny)</option>
              <option value="under_re_scrutiny">Under Re-Scrutiny</option>
              <option value="pending_evc">Pending EVC Inspection</option>
              <option value="evc_scheduled">EVC Scheduled</option>
              <option value="under_next_stage">Under Bureau Review</option>
              <option value="completed">Approved / Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* 3. Application Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                updateQueryParam('type', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Application Types</option>
              <option value="new_institution">New Technical Institution</option>
              <option value="extension_of_approval">Extension of Approval (EoA)</option>
              <option value="increase_in_intake">Increase in Intake / Courses</option>
              <option value="change_of_site">Change of Site / Location</option>
              <option value="closure_of_course">Closure of Course</option>
            </select>
          </div>

          {/* 4. Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value);
                updateQueryParam('urgency', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Priority Levels</option>
              <option value="critical">Critical Deadline</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal Window</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Jurisdiction State, Date Range & Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* State Jurisdiction */}
          <div>
            <select
              value={jurisdictionFilter}
              onChange={(e) => {
                setJurisdictionFilter(e.target.value);
                updateQueryParam('jurisdiction', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Authorised States</option>
              {user.jurisdictionStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Date Submitted From */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs focus:outline-none"
            />
          </div>

          {/* Date Submitted To */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent py-1.5 text-xs focus:outline-none font-medium"
            >
              <option value="deadline_asc">Sort: Nearest Deadline First</option>
              <option value="deadline_desc">Sort: Furthest Deadline</option>
              <option value="submitted_desc">Sort: Newest Submissions</option>
              <option value="app_number">Sort: Application #</option>
              <option value="institution_asc">Sort: College Name (A-Z)</option>
            </select>
          </div>
        </div>

        {specialFilter === 'overdue' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-rose-800 bg-rose-50/70 p-2 rounded">
            <span className="font-semibold">Filtered by Overdue Statutory Deadlines</span>
            <button onClick={() => setSpecialFilter('all')} className="underline hover:text-rose-950 text-[11px]">
              Show All Deadlines
            </button>
          </div>
        )}
      </Card>

      {/* Applications Table */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading assigned applications...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-xs text-rose-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry Loading</Button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">No matching applications found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                No institutional records in your authorized jurisdiction match the current filter criteria.
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filter Settings
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Application Details</th>
                    <th className="py-3 px-4">Institution & Jurisdiction</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Regulatory Status</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Statutory Deadline</th>
                    <th className="py-3 px-4">Assigned RO</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApplications.map((app: Application) => {
                    const deadlineInfo = calculateDeadlineDaysRemaining(app.deadlineDate);

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Application Number & PID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {app.applicationNumber}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            PID: <span className="font-mono">{app.institution.aictePermanentId}</span> • AY {app.academicYear}
                          </div>
                        </td>

                        {/* Institution Name & State */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate" title={app.institution.name}>
                            {app.institution.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>{app.institution.city}, {app.institution.state}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-600">
                              {app.institution.institutionType}
                            </span>
                          </div>
                        </td>

                        {/* Application Type */}
                        <td className="py-3.5 px-4 capitalize text-slate-700 font-medium">
                          {app.type.replace(/_/g, ' ')}
                        </td>

                        {/* Status Badge & Deficiency Count */}
                        <td className="py-3.5 px-4">
                          <Badge status={app.status} size="sm" />
                          {app.deficiencyCount > 0 && (
                            <div className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              <span>{app.deficiencyCount} deficiency active</span>
                            </div>
                          )}
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>

                        {/* Statutory Deadline with Accessible Indicators */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-medium text-slate-800">{app.deadlineDate}</div>
                          <div
                            className={`text-[10px] font-bold mt-0.5 ${
                              deadlineInfo.isOverdue
                                ? 'text-rose-700'
                                : deadlineInfo.severity === 'critical'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                            aria-label={deadlineInfo.accessibleText}
                            title={deadlineInfo.accessibleText}
                          >
                            {deadlineInfo.label}
                          </div>
                        </td>

                        {/* Assigned Officer */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800 text-[11px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[120px]">{app.assignedOfficerName || 'Unassigned'}</span>
                            </div>
                            {user.role === 'regional_officer' && (
                              <button
                                onClick={() => {
                                  setTargetAppForReassign(app);
                                  setReassignModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                                title="Reassign Case Desk"
                              >
                                <UserCog className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link to={`/regional-officer/applications/${app.id}`}>
                            <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                              Review Case
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                  <strong className="text-slate-900">{Math.min(totalItems, currentPage * pageSize)}</strong> of{' '}
                  <strong className="text-slate-900">{totalItems}</strong> applications
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="py-1 px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      currentPage === idx + 1
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="py-1 px-2.5"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Case Reassignment Confirmation Modal */}
      {reassignModalOpen && targetAppForReassign && (
        <ConfirmationModal
          isOpen={true}
          title={`Reassign Application: ${targetAppForReassign.applicationNumber}`}
          message={`Select an authorized AICTE Regional Officer within ${targetAppForReassign.institution.regionalOffice} to take over scrutiny responsibilities for this case.`}
          confirmLabel="Reassign Case"
          isLoading={isReassigning}
          onConfirm={handleConfirmReassignment}
          onCancel={() => setReassignModalOpen(false)}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Target Regional Scrutiny Officer
              </label>
              <select
                value={newOfficerName}
                onChange={(e) => setNewOfficerName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white"
              >
                <option value="Officer Amit Verma (WRO Desk 4)">Officer Amit Verma (WRO Desk 4 - Maharashtra)</option>
                <option value="Officer Sneha Kulkarni (WRO Desk 2)">Officer Sneha Kulkarni (WRO Desk 2 - Goa)</option>
                <option value="Officer Rajesh Patel (WRO Desk 1)">Officer Rajesh Patel (WRO Desk 1 - Gujarat)</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border">
              * Note: Reassignment will be recorded in the statutory audit log with actor ID and timestamp.
            </div>
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
