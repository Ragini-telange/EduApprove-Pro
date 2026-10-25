import React, { useState, useEffect, useCallback } from 'react';
import { authorityApi } from '../../services/authorityApi';
import type { 
  ReportType, 
  ReportFilterState, 
  ApplicationRecord 
} from '../../types/authority';
import { 
  Download, 
  Printer, 
  Search, 
  RotateCcw, 
  BarChart3, 
  MapPin, 
  Clock, 
  CalendarCheck2, 
  ShieldAlert, 
  FileWarning, 
  History, 
  TrendingUp, 
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  LineChart, 
  Line,
  Legend
} from 'recharts';

interface ReportsModuleProps {
  applications?: ApplicationRecord[];
  onOpenCase?: (app: ApplicationRecord) => void;
}

const REPORT_TABS: { id: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'overall_pendency',
    label: 'Overall Pendency',
    icon: BarChart3,
    description: 'National overview of total applications, active pendency, and stage-by-stage distribution',
  },
  {
    id: 'region_workload',
    label: 'Region-wise Workload',
    icon: MapPin,
    description: 'Workload volume, delinquency ratios, and processing times across all 8 AICTE regional jurisdictions',
  },
  {
    id: 'stage_delays',
    label: 'Stage-wise Delays',
    icon: Clock,
    description: 'Stage latency analysis compared against Approval Process Handbook (APH 2026-27) SLA targets',
  },
  {
    id: 'evc_status',
    label: 'EVC Tracker',
    icon: CalendarCheck2,
    description: 'Expert Visiting Committee (EVC) scheduling, biometric report turnaround, and inspection bottlenecks',
  },
  {
    id: 'compliance_health',
    label: 'Compliance & Deficiencies',
    icon: ShieldAlert,
    description: 'Deficiency notifications, rectification turnaround, and statutory undertaking fulfillment',
  },
  {
    id: 'document_expiry',
    label: 'Document Expiry',
    icon: FileWarning,
    description: 'Critical statutory certificates (Fire NOC, Land Titles, Building Safety) expiring or overdue',
  },
  {
    id: 'escalation_history',
    label: 'Escalations & History',
    icon: History,
    description: 'Traceable chronological registry of all active and historical multi-level senior authority escalations',
  },
  {
    id: 'processing_performance',
    label: 'Performance Trends',
    icon: TrendingUp,
    description: 'Monthly intake vs disposal velocity, average processing cycle days, and SLA compliance percentages',
  },
];

const INITIAL_FILTERS: ReportFilterState = {
  region: 'All Regions',
  stage: 'All Stages',
  academicYear: 'All',
  dateRange: 'All',
  status: 'All Statuses',
  searchQuery: '',
};

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  applications = [],
  onOpenCase,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('overall_pendency');
  const [filters, setFilters] = useState<ReportFilterState>(INITIAL_FILTERS);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectCase = (appNumber: string) => {
    if (!onOpenCase) return;
    const found = applications.find(a => a.applicationNumber === appNumber);
    if (found) {
      onOpenCase(found);
    }
  };

  // Load report data
  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await authorityApi.getReportsData(activeReport, filters);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleFilterChange = (key: keyof ReportFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // CSV Export Functionality
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    const dateStr = new Date().toISOString().split('T')[0];
    let fileName = `AICTE_Report_${activeReport}_${dateStr}.csv`;

    switch (activeReport) {
      case 'overall_pendency': {
        const headers = ['Stage', 'Pending In-Flight Count', 'Total In Stage', 'Average Days', 'Percentage of Total'];
        const rows = (reportData.stageBreakdown || []).map((s: any) => [
          `"${s.stage}"`,
          s.count,
          s.totalInStage,
          s.avgDays,
          `${s.percentage}%`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'region_workload': {
        const headers = ['Region', 'Headquarters', 'Regional Officer', 'Total Applications', 'Pending Cases', 'Overdue Cases', 'Delinquency Rate', 'Avg Processing Days', 'Active Escalations'];
        const rows = (reportData.regions || []).map((r: any) => [
          `"${r.regionName}"`,
          `"${r.headquarters}"`,
          `"${r.assignedOfficer}"`,
          r.total,
          r.pending,
          r.overdue,
          `${r.delinquencyRate}%`,
          r.avgDays,
          r.activeEscalations
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'stage_delays': {
        const headers = ['Stage', 'In-Flight Cases', 'Average Days', 'Statutory SLA Target', 'Variance', 'SLA Breaches Count', 'Bottleneck Status'];
        const rows = (reportData.stages || []).map((st: any) => [
          `"${st.stage}"`,
          st.inFlightCount,
          st.avgDays,
          st.slaBenchmark,
          `"${st.variance}"`,
          st.slaBreachesCount,
          `"${st.bottleneckStatus}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'evc_status': {
        const headers = ['Application Reference', 'Institution', 'Region', 'EVC Status', 'Scheduled Date', 'Days Pending', 'Assigned Officer', 'Bottleneck Reason'];
        const rows = (reportData.delayedCases || []).map((c: any) => [
          `"${c.applicationNumber}"`,
          `"${c.institutionName}"`,
          `"${c.region}"`,
          `"${c.evcStatus}"`,
          `"${c.scheduledDate}"`,
          c.daysPending,
          `"${c.assignedOfficer}"`,
          `"${c.delayReason}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'compliance_health': {
        const headers = ['Application Reference', 'Institution', 'Region', 'Current Stage', 'Compliance Status', 'Deficiencies Count', 'Days in Stage', 'Assigned Officer'];
        const rows = (reportData.deficientCases || []).map((c: any) => [
          `"${c.applicationNumber}"`,
          `"${c.institutionName}"`,
          `"${c.region}"`,
          `"${c.currentStage}"`,
          `"${c.complianceStatus}"`,
          c.deficienciesCount,
          c.daysInStage,
          `"${c.assignedOfficer}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'document_expiry': {
        const headers = ['Institution', 'Application Reference', 'Region', 'Document Type', 'Issuing Authority', 'Expiry Date', 'Status', 'Days Remaining', 'Statutory Action'];
        const rows = (reportData.documentRegistry || []).map((d: any) => [
          `"${d.institutionName}"`,
          `"${d.applicationNumber}"`,
          `"${d.region}"`,
          `"${d.documentType}"`,
          `"${d.issuingAuthority}"`,
          `"${d.expiryDate}"`,
          `"${d.status}"`,
          d.daysRemaining,
          `"${d.statutoryAction}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'escalation_history': {
        const headers = ['Application Reference', 'Compliance Reference', 'Institution', 'Region', 'Stage', 'Escalation Level', 'Category', 'Days Overdue', 'Original Deadline', 'Resolution Status', 'Reason'];
        const rows = (reportData.escalations || []).map((e: any) => [
          `"${e.applicationNumber}"`,
          `"${e.complianceReference}"`,
          `"${e.institutionName}"`,
          `"${e.region}"`,
          `"${e.currentStage}"`,
          `"Level ${e.escalationLevel}"`,
          `"${e.escalationCategory}"`,
          e.daysOverdue,
          `"${e.originalDeadline}"`,
          `"${e.resolutionStatus}"`,
          `"${e.reason}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      case 'processing_performance': {
        const headers = ['Academic Month', 'Submitted Cases', 'Approved Cases', 'Rejected Cases', 'Avg Turnaround Days', 'SLA Adherence Rate'];
        const rows = (reportData.monthlyPerformance || []).map((m: any) => [
          `"${m.month}"`,
          m.submitted,
          m.approved,
          m.rejected,
          m.avgTurnaroundDays,
          `${m.slaCompliancePct}%`
        ]);
        csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        break;
      }

      default:
        csvContent = 'No data available';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export via native print layout
  const handleExportPDF = () => {
    window.print();
  };

  const activeTabMeta = REPORT_TABS.find(t => t.id === activeReport);

  return (
    <div className="space-y-6 printable-report">
      {/* 1. Header & Quick Export Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-aicte-900" />
              <span>Executive Statutory Reporting & Compliance Audits</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              APH 2026-27 Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {activeTabMeta?.description || 'Comprehensive data analysis, regional delinquency, and audit records.'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Download CSV for the active report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-aicte-900 hover:bg-aicte-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Generate Official AICTE PDF Report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Eight Dedicated Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                isActive
                  ? 'bg-aicte-900 text-white border-aicte-900 shadow-xs font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight line-clamp-2">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Multi-Dimensional Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, institute..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All Regions">All 8 AICTE Regions</option>
              <option value="Western">Western Region</option>
              <option value="Northern">Northern Region</option>
              <option value="Southern">Southern Region</option>
              <option value="Central">Central Region</option>
              <option value="South-Western">South-Western Region</option>
              <option value="Eastern">Eastern Region</option>
              <option value="North-Western">North-Western Region</option>
              <option value="South-Central">South-Central Region</option>
              <option value="North-Eastern">North-Eastern Region</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All Stages">All Processing Stages</option>
              <option value="Submission">Submission</option>
              <option value="Document Scrutiny">Document Scrutiny</option>
              <option value="Deficiency Rectification">Deficiency Rectification</option>
              <option value="EVC Inspection">EVC Inspection</option>
              <option value="Regional Committee (RC)">Regional Committee (RC)</option>
              <option value="Standing Appellate Committee (SAC)">Standing Appellate Committee (SAC)</option>
              <option value="Bureau HQ Final Review">Bureau HQ Final Review</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <select
              value={filters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All">All Academic Years</option>
              <option value="2026-2027">2026-2027 (Current)</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-aicte-900"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Scrutiny">Under Scrutiny</option>
              <option value="Deficiency Communicated">Deficiency Communicated</option>
              <option value="EVC Scheduled">EVC Scheduled</option>
              <option value="EVC Report Submitted">EVC Report Submitted</option>
              <option value="RO Recommended">RO Recommended</option>
              <option value="Pending HQ Approval">Pending HQ Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Active filter scope for: <strong>{activeTabMeta?.label}</strong></span>
          {(filters.searchQuery || filters.region !== 'All Regions' || filters.stage !== 'All Stages' || filters.status !== 'All Statuses' || filters.academicYear !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="text-aicte-800 hover:text-aicte-950 font-semibold flex items-center gap-1 underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Dynamic Report Content */}
      {isLoading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold">Generating statutory report data...</p>
        </div>
      ) : !reportData ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <p className="text-xs font-semibold">No data records found for current parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* REPORT 1: OVERALL PENDENCY */}
          {activeReport === 'overall_pendency' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Volume</span>
                  <div className="text-xl font-black text-slate-900">{reportData.total}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">In-Flight Pendency</span>
                  <div className="text-xl font-black text-amber-600">{reportData.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Statutory Approved</span>
                  <div className="text-xl font-black text-emerald-600">{reportData.approved}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-rose-600 font-bold uppercase block">Statutory Rejected</span>
                  <div className="text-xl font-black text-rose-600">{reportData.rejected}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Under Scrutiny</span>
                  <div className="text-xl font-black text-blue-600">{reportData.underScrutiny}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">SLA Overdue</span>
                  <div className="text-xl font-black text-rose-700">{reportData.overdue}</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Stage Breakdown Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Stage-wise Pending Applications Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.stageBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="stage" type="category" width={110} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1e3a8a" radius={[0, 4, 4, 0]} name="Pending Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Application Type Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Applications Breakdown by Type & Approval
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.typeBreakdown} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="type" tick={{ fontSize: 8 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="pending" fill="#d97706" name="Pending" stackId="a" />
                        <Bar dataKey="approved" fill="#059669" name="Approved" stackId="a" />
                        <Bar dataKey="rejected" fill="#dc2626" name="Rejected" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Detailed Stage-by-Stage Pendency Ledger
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Processing Stage</th>
                        <th className="py-2.5 px-4">Pending Cases</th>
                        <th className="py-2.5 px-4">Total In Stage</th>
                        <th className="py-2.5 px-4">Avg Days Elapsed</th>
                        <th className="py-2.5 px-4">Share of National Backlog</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.stageBreakdown.map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{s.stage}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{s.count}</td>
                          <td className="py-2.5 px-4 text-slate-600">{s.totalInStage}</td>
                          <td className="py-2.5 px-4 text-slate-700">{s.avgDays} days</td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-aicte-900 h-1.5 rounded-full" style={{ width: `${s.percentage}%` }}></div>
                              </div>
                              <span className="text-[11px] font-mono text-slate-600">{s.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 2: REGION-WISE WORKLOAD */}
          {activeReport === 'region_workload' && (
            <div className="space-y-6">
              {/* Regional Workload Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Regional Workload vs Overdue Cases Comparison
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.regions} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="regionName" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="total" fill="#1e3a8a" name="Total Applications" />
                      <Bar dataKey="pending" fill="#d97706" name="In-Flight Pending" />
                      <Bar dataKey="overdue" fill="#dc2626" name="Overdue Cases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regional Workload Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  AICTE 8 Regional Offices Workload & Delinquency Matrix
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Region</th>
                        <th className="py-2.5 px-4">Regional Officer</th>
                        <th className="py-2.5 px-4">Total Cases</th>
                        <th className="py-2.5 px-4">Pending</th>
                        <th className="py-2.5 px-4">Overdue</th>
                        <th className="py-2.5 px-4">Delinquency Rate</th>
                        <th className="py-2.5 px-4">Avg Days</th>
                        <th className="py-2.5 px-4">Active Escalations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.regions.map((r: any) => (
                        <tr key={r.regionId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {r.regionName}
                            <span className="block text-[10px] text-slate-400 font-normal">{r.headquarters}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">
                            <strong>{r.assignedOfficer}</strong>
                            <span className="block text-[10px] font-mono text-slate-400">{r.officerEmail}</span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{r.total}</td>
                          <td className="py-2.5 px-4 text-amber-700 font-semibold">{r.pending}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-700">{r.overdue}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.delinquencyRate > 20 
                                ? 'bg-rose-100 text-rose-800' 
                                : r.delinquencyRate > 0 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {r.delinquencyRate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">{r.avgDays} d</td>
                          <td className="py-2.5 px-4">
                            {r.activeEscalations > 0 ? (
                              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {r.activeEscalations} active
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 3: STAGE-WISE DELAYS */}
          {activeReport === 'stage_delays' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Stage Elapsed Days vs Statutory APH 2026-27 Benchmarks
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.stages} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="stage" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="avgDays" fill="#d97706" name="Average Elapsed Days" />
                      <Bar dataKey="slaBenchmark" fill="#1e3a8a" name="Statutory SLA Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Stage Latency & Bottleneck Diagnostic Register
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Processing Stage</th>
                        <th className="py-2.5 px-4">In-Flight Cases</th>
                        <th className="py-2.5 px-4">Avg Days Spent</th>
                        <th className="py-2.5 px-4">APH SLA Benchmark</th>
                        <th className="py-2.5 px-4">Variance</th>
                        <th className="py-2.5 px-4">SLA Breaches</th>
                        <th className="py-2.5 px-4">Bottleneck Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.stages.map((st: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{st.stage}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{st.inFlightCount}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700">{st.avgDays} days</td>
                          <td className="py-2.5 px-4 text-slate-600">{st.slaBenchmark} days</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{st.variance}</td>
                          <td className="py-2.5 px-4 text-rose-600 font-bold">{st.slaBreachesCount}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.bottleneckStatus === 'Critical Delay'
                                ? 'bg-rose-100 text-rose-900'
                                : st.bottleneckStatus === 'Moderate Delay'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {st.bottleneckStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 4: EVC TRACKER */}
          {activeReport === 'evc_status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {reportData.statusDistribution.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">{item.status}</span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{item.count}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Delayed or Pending EVC Inspections Roster</span>
                  <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {reportData.delayedCases.length} Delayed / Unsatisfied
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Application Reference</th>
                        <th className="py-2.5 px-4">Institution</th>
                        <th className="py-2.5 px-4">Region</th>
                        <th className="py-2.5 px-4">EVC Status</th>
                        <th className="py-2.5 px-4">Scheduled Date</th>
                        <th className="py-2.5 px-4">Days Stalled</th>
                        <th className="py-2.5 px-4">Delay Factor / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.delayedCases.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => handleSelectCase(c.applicationNumber)}
                              className="text-aicte-900 hover:text-aicte-700 hover:underline font-mono font-bold text-left"
                              title="Click to view full case dossier"
                            >
                              {c.applicationNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{c.institutionName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{c.region}</td>
                          <td className="py-2.5 px-4">
                            <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                              {c.evcStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 font-mono">{c.scheduledDate}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-600">{c.daysPending} days</td>
                          <td className="py-2.5 px-4 text-slate-700 text-[11px] max-w-xs">{c.delayReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 5: COMPLIANCE & DEFICIENCIES */}
          {activeReport === 'compliance_health' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {reportData.healthBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">{item.status}</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{item.count}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Applications with Outstanding Compliance Deficiencies
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Application Reference</th>
                        <th className="py-2.5 px-4">Institution</th>
                        <th className="py-2.5 px-4">Region</th>
                        <th className="py-2.5 px-4">Current Stage</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Deficiencies Count</th>
                        <th className="py-2.5 px-4">Days in Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.deficientCases.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => handleSelectCase(c.applicationNumber)}
                              className="text-aicte-900 hover:text-aicte-700 hover:underline font-mono font-bold text-left"
                              title="Click to view full case dossier"
                            >
                              {c.applicationNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{c.institutionName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{c.region}</td>
                          <td className="py-2.5 px-4 text-slate-700">{c.currentStage}</td>
                          <td className="py-2.5 px-4">
                            <span className="bg-orange-50 text-orange-900 font-semibold px-2 py-0.5 rounded border border-orange-200">
                              {c.complianceStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-black text-rose-600">{c.deficienciesCount}</td>
                          <td className="py-2.5 px-4 text-slate-600">{c.daysInStage} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 6: DOCUMENT EXPIRY */}
          {activeReport === 'document_expiry' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Expired Documents (Overdue)</span>
                  <div className="text-2xl font-black text-rose-700 mt-1">{reportData.expiredCount}</div>
                  <span className="text-[11px] text-rose-600">Immediate follow-up required</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Expiring within 30 Days</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{reportData.expiringSoonCount}</div>
                  <span className="text-[11px] text-amber-600">Provisional NOC required</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Statutory Docs Tracked</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{reportData.totalTracked}</div>
                  <span className="text-[11px] text-slate-400">Fire NOC, Land Title, NBC</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Statutory NOC & Certification Expiry Monitoring Ledger
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Institution</th>
                        <th className="py-2.5 px-4">Document Type</th>
                        <th className="py-2.5 px-4">Issuing Authority</th>
                        <th className="py-2.5 px-4">Expiry Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Required Statutory Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.documentRegistry.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {d.institutionName}
                            <span className="block font-mono text-[10px] text-slate-400">{d.applicationNumber}</span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{d.documentType}</td>
                          <td className="py-2.5 px-4 text-slate-600">{d.issuingAuthority}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{d.expiryDate}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.daysRemaining < 0
                                ? 'bg-rose-100 text-rose-900'
                                : d.daysRemaining <= 15
                                ? 'bg-orange-100 text-orange-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 text-[11px] max-w-xs">{d.statutoryAction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 7: ESCALATION HISTORY & AUDIT */}
          {activeReport === 'escalation_history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Escalations</span>
                  <div className="text-xl font-black text-slate-900 mt-1">{reportData.totalEscalations}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Active Escalations</span>
                  <div className="text-xl font-black text-rose-700 mt-1">{reportData.activeCount}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Resolved Cases</span>
                  <div className="text-xl font-black text-emerald-700 mt-1">{reportData.resolvedCount}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Level 1 Advisory</span>
                  <div className="text-xl font-black text-amber-700 mt-1">{reportData.level1Count}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-300">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block">Level 2 / 3 Alerts</span>
                  <div className="text-xl font-black text-rose-800 mt-1">{reportData.level2Count + reportData.level3Count}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Traceable Pan-India Escalation Registry & Resolution History
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Case Reference</th>
                        <th className="py-2.5 px-4">Institution</th>
                        <th className="py-2.5 px-4">Region</th>
                        <th className="py-2.5 px-4">Stage</th>
                        <th className="py-2.5 px-4">Escalation Level</th>
                        <th className="py-2.5 px-4">Days Overdue</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Action Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.escalations.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => handleSelectCase(e.applicationNumber)}
                              className="text-aicte-900 hover:text-aicte-700 hover:underline font-mono font-bold text-left block"
                              title="Click to view full case dossier"
                            >
                              {e.applicationNumber}
                            </button>
                            <span className="block font-sans text-[10px] text-slate-400">{e.complianceReference}</span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{e.institutionName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{e.region}</td>
                          <td className="py-2.5 px-4 text-slate-700">{e.currentStage}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.escalationLevel === 3
                                ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                : e.escalationLevel === 2
                                ? 'bg-orange-100 text-orange-950 border border-orange-300'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}>
                              Level {e.escalationLevel}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-rose-700">+{e.daysOverdue} d</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              e.resolutionStatus === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {e.resolutionStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {e.history.length} logged
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 8: PROCESSING PERFORMANCE */}
          {activeReport === 'processing_performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase block">National SLA Compliance Rate</span>
                  <div className="text-3xl font-black text-emerald-600 mt-1">{reportData.overallSlaCompliancePct}%</div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Within APH statutory turnaround targets</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase block">Average Cycle Time (Intake to Approval)</span>
                  <div className="text-3xl font-black text-aicte-900 mt-1">{reportData.avgOverallCycleDays} days</div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Citizen Charter target: 60 days</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Monthly Intake vs Disposal Performance Trend
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.monthlyPerformance} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="submitted" stroke="#1e3a8a" strokeWidth={2} name="Submitted Applications" />
                      <Line type="monotone" dataKey="approved" stroke="#059669" strokeWidth={2} name="Approved / Disposed" />
                      <Line type="monotone" dataKey="slaCompliancePct" stroke="#d97706" strokeWidth={2} name="SLA Compliance %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                  Monthly Performance & Turnaround Audit Register
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Academic Month</th>
                        <th className="py-2.5 px-4">Submitted</th>
                        <th className="py-2.5 px-4">Approved Orders</th>
                        <th className="py-2.5 px-4">Rejected Orders</th>
                        <th className="py-2.5 px-4">Avg Turnaround Days</th>
                        <th className="py-2.5 px-4">SLA Adherence %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.monthlyPerformance.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{m.month}</td>
                          <td className="py-2.5 px-4 text-slate-800 font-semibold">{m.submitted}</td>
                          <td className="py-2.5 px-4 text-emerald-700 font-bold">{m.approved}</td>
                          <td className="py-2.5 px-4 text-rose-600">{m.rejected}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{m.avgTurnaroundDays} days</td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {m.slaCompliancePct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
