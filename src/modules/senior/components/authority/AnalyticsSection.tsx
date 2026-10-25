import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { ApplicationRecord } from '../../types/authority';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

interface AnalyticsSectionProps {
  applications: ApplicationRecord[];
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ applications }) => {
  const { t } = useLanguage();

  // 1. Applications by processing stage
  const stageCounts: Record<string, number> = {};
  applications.forEach((app) => {
    stageCounts[app.currentStage] = (stageCounts[app.currentStage] || 0) + 1;
  });
  const stageData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage.replace('Committee', 'Comm.').replace('Rectification', 'Rect.'),
    count,
  }));

  // 2. Pending vs Completed Trends
  const monthlyData = [
    { month: 'May 2026', pending: 12, completed: 8, total: 20 },
    { month: 'Jun 2026', pending: 24, completed: 18, total: 42 },
    { month: 'Jul 2026', pending: 45, completed: 32, total: 77 },
    { month: 'Aug 2026', pending: 68, completed: 54, total: 122 },
    { month: 'Sep 2026', pending: 82, completed: 78, total: 160 },
    { month: 'Oct 2026 (Live)', pending: applications.filter(a => a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected').length, completed: applications.filter(a => a.currentStatus === 'Approved' || a.currentStatus === 'Rejected').length, total: applications.length },
  ];

  // 3. Overdue cases by regional office
  const regionOverdueMap: Record<string, { total: number; overdue: number }> = {};
  applications.forEach((app) => {
    if (!regionOverdueMap[app.region]) {
      regionOverdueMap[app.region] = { total: 0, overdue: 0 };
    }
    regionOverdueMap[app.region].total += 1;
    if (app.deadlineStatus === 'Overdue') {
      regionOverdueMap[app.region].overdue += 1;
    }
  });
  const regionData = Object.entries(regionOverdueMap).map(([region, stat]) => ({
    region: `${region}`,
    total: stat.total,
    overdue: stat.overdue,
  }));

  // 4. EVC scheduling & reporting status
  const evcCounts: Record<string, number> = {};
  applications.forEach((app) => {
    evcCounts[app.evcStatus] = (evcCounts[app.evcStatus] || 0) + 1;
  });
  const evcData = Object.entries(evcCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b'];

  // 5. Compliance & Document Expiry Summaries
  const compliantCount = applications.filter(a => a.complianceStatus === 'Compliant').length;
  const pendingSubmissionCount = applications.filter(a => a.complianceStatus === 'Pending Submission').length;
  const criticalDeficiencyCount = applications.filter(a => a.complianceStatus === 'Critical Deficiency').length;
  const expiringDocsCount = applications.reduce((sum, a) => sum + (a.expiringDocumentsCount || 0), 0);

  // 6. Processing Time Trends by Application Type
  const processingTypeMap: Record<string, { sumDays: number; count: number }> = {};
  applications.forEach((app) => {
    if (app.processingTimeDays) {
      if (!processingTypeMap[app.applicationType]) {
        processingTypeMap[app.applicationType] = { sumDays: 0, count: 0 };
      }
      processingTypeMap[app.applicationType].sumDays += app.processingTimeDays;
      processingTypeMap[app.applicationType].count += 1;
    }
  });
  const processingTimeData = Object.entries(processingTypeMap).map(([type, stat]) => ({
    type: type.replace('Technical Institution', 'Inst.').replace('Extension of Approval', 'EoA'),
    avgDays: Math.round(stat.sumDays / stat.count),
    statutoryNorm: 45,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Stage Distribution & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-aicte-800" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.stages_title')}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Pipeline Distribution</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#132e50" radius={[4, 4, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.trends_title')}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Monthly Workload Trend</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="pending" stroke="#d97706" fillOpacity={1} fill="url(#colorPending)" name="Active Pipeline" />
                <Area type="monotone" dataKey="completed" stroke="#059669" fillOpacity={1} fill="url(#colorCompleted)" name="Completed / Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Overdue by Region & EVC Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.regional_overdue')}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Regional SLA Tracking</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Regional Volume" />
                <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overdue Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <PieIcon className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.evc_breakdown')}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Expert Visiting Committee inspection stages across active applications.
            </p>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={evcData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {evcData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-2 border-t border-slate-100">
            {evcData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                <span className="truncate">{entry.name}: <strong className="text-slate-800">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Compliance Health Cards & Processing Time by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.compliance_summary')}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Mandatory Oversight
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">100% Fully Compliant</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{compliantCount} Institutions</div>
              <p className="text-[10px] text-slate-400 mt-0.5">All land & safety NOCs certified</p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200">
              <span className="text-xs text-amber-800 font-medium">Pending Submissions</span>
              <div className="text-xl font-bold text-amber-800 mt-1">{pendingSubmissionCount} Applications</div>
              <p className="text-[10px] text-amber-600 mt-0.5">Deficiency notice response awaited</p>
            </div>

            <div className="bg-red-50/70 p-3 rounded-lg border border-red-200">
              <span className="text-xs text-rose-800 font-medium">Critical Deficiencies</span>
              <div className="text-xl font-bold text-rose-800 mt-1">{criticalDeficiencyCount} Flagged</div>
              <p className="text-[10px] text-rose-600 mt-0.5">Fire safety / Land title discrepancy</p>
            </div>

            <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200">
              <span className="text-xs text-purple-800 font-medium">Expiring Documents</span>
              <div className="text-xl font-bold text-purple-800 mt-1">{expiringDocsCount} Expiring Soon</div>
              <p className="text-[10px] text-purple-600 mt-0.5">Renewals due within 30 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('analytics.processing_time')}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Statutory Target: 45 Days</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgDays" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual Avg Days" />
                <Bar dataKey="statutoryNorm" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Statutory Norm (Days)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
