import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { DashboardFilters } from '../../types/authority';
import { 
  Search, 
  RotateCcw, 
  SlidersHorizontal,
  Calendar,
  X
} from 'lucide-react';

interface FiltersBarProps {
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

const REGIONS = [
  'All Regions',
  'Western',
  'Northern',
  'Southern',
  'Central',
  'South-Western',
  'Eastern',
  'North-Western',
  'South-Central',
  'North-Eastern',
];

const APPLICATION_TYPES = [
  'All Types',
  'Extension of Approval (EoA)',
  'Increase in Intake',
  'New Technical Institution',
  'Introduction of New Course',
  'Closure of Course/Institute',
  'Change of Site/Location',
];

const STAGES = [
  'All Stages',
  'Submission',
  'Document Scrutiny',
  'Deficiency Rectification',
  'EVC Inspection',
  'Regional Committee (RC)',
  'Standing Appellate Committee (SAC)',
  'Bureau HQ Final Review',
];

const STATUSES = [
  'All Statuses',
  'Submitted',
  'Under Scrutiny',
  'Deficiency Communicated',
  'EVC Scheduled',
  'EVC Report Submitted',
  'RO Recommended',
  'Pending HQ Approval',
  'Approved',
  'Rejected',
];

const DEADLINE_STATUSES = ['All', 'Normal', 'Approaching Deadline', 'Overdue'];
const EVC_STATUSES = ['All', 'Not Required', 'Pending Scheduling', 'Scheduled', 'Inspection Completed', 'Report Submitted', 'Delayed'];
const COMPLIANCE_STATUSES = ['All', 'Compliant', 'Pending Submission', 'Under Review', 'Critical Deficiency', 'Documents Expiring Soon'];

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
}) => {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (!val) return false;
    if (key === 'region' && val === 'All Regions') return false;
    if (key === 'applicationType' && val === 'All Types') return false;
    if (key === 'stage' && val === 'All Stages') return false;
    if (key === 'status' && val === 'All Statuses') return false;
    if (['deadlineStatus', 'evcStatus', 'complianceStatus'].includes(key) && val === 'All') return false;
    return true;
  }).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
      {/* Primary Row: Search + Essential Quick Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder={t('action.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aicte-900 focus:bg-white transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {/* Region */}
          <select
            aria-label="Filter by Regional Office"
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-aicte-900"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Application Type */}
          <select
            aria-label="Filter by Application Type"
            value={filters.applicationType}
            onChange={(e) => onFilterChange('applicationType', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-aicte-900"
          >
            {APPLICATION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status */}
          <select
            aria-label="Filter by Approval Status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-aicte-900"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Toggle Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              showAdvanced || activeFiltersCount > 0
                ? 'bg-aicte-50 border-aicte-200 text-aicte-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-aicte-900 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              title={t('action.reset')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg text-xs">
          {/* Stage */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Processing Stage
            </label>
            <select
              value={filters.stage}
              onChange={(e) => onFilterChange('stage', e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Deadline Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Deadline Status
            </label>
            <select
              value={filters.deadlineStatus}
              onChange={(e) => onFilterChange('deadlineStatus', e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            >
              {DEADLINE_STATUSES.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Deadlines' : d}</option>
              ))}
            </select>
          </div>

          {/* EVC Inspection Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              EVC Inspection Status
            </label>
            <select
              value={filters.evcStatus}
              onChange={(e) => onFilterChange('evcStatus', e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            >
              {EVC_STATUSES.map((evc) => (
                <option key={evc} value={evc}>{evc === 'All' ? 'All EVC Stages' : evc}</option>
              ))}
            </select>
          </div>

          {/* Compliance Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Compliance & Document Health
            </label>
            <select
              value={filters.complianceStatus}
              onChange={(e) => onFilterChange('complianceStatus', e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            >
              {COMPLIANCE_STATUSES.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Compliance States' : c}</option>
              ))}
            </select>
          </div>

          {/* Date Range: Start */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Submitted After
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            />
          </div>

          {/* Date Range: End */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Submitted Before
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-aicte-900"
            />
          </div>
        </div>
      )}

      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div>
          Showing <span className="font-semibold text-slate-900">{totalFilteredCount}</span> application records matching criteria
        </div>
        {activeFiltersCount > 0 && (
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
            {activeFiltersCount} active filter parameters applied
          </span>
        )}
      </div>
    </div>
  );
};
