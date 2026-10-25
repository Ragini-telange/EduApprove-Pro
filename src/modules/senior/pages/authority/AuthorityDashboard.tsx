import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authorityApi } from '../../services/authorityApi';
import type { 
  ApplicationRecord, 
  KPICounters, 
  DashboardFilters, 
  AuditLogItem 
} from '../../types/authority';

import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { KpiCardsGrid } from '../../components/authority/KpiCardsGrid';
import { FiltersBar } from '../../components/authority/FiltersBar';
import { ApplicationOverviewTable } from '../../components/authority/ApplicationOverviewTable';
import { AnalyticsSection } from '../../components/authority/AnalyticsSection';
import { ActionCentre } from '../../components/authority/ActionCentre';
import { ApplicationDetailsModal } from '../../components/authority/ApplicationDetailsModal';
import { InterfaceStateAlert } from '../../components/common/InterfaceStateAlert';
import { RegionalIntelligenceDashboard } from '../../components/regional/RegionalIntelligenceDashboard';
import { ReportsModule } from '../../components/authority/ReportsModule';
import { ChatbotWidget } from '../../components/chatbot/ChatbotWidget';

import { 
  ScrollText, 
  FileCheck2, 
  CalendarCheck2, 
  ShieldAlert, 
  Download, 
  ArrowRight,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';

const INITIAL_FILTERS: DashboardFilters = {
  searchQuery: '',
  region: 'All Regions',
  applicationType: 'All Types',
  stage: 'All Stages',
  status: 'All Statuses',
  deadlineStatus: 'All',
  evcStatus: 'All',
  complianceStatus: 'All',
  startDate: '',
  endDate: '',
};

export const AuthorityDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthorized, user, role } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [kpis, setKpis] = useState<KPICounters>({
    totalApplications: 0,
    applicationsPending: 0,
    applicationsUnderScrutiny: 0,
    applicationsRequiringCorrection: 0,
    overdueApplications: 0,
    completedApplications: 0,
    pendingEVCSchedulingOrReporting: 0,
    pendingComplianceSubmissions: 0,
    documentsExpiringSoon: 0,
    overdueEscalations: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRefreshMsg, setSuccessRefreshMsg] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'authoritative_fallback'>('authoritative_fallback');
  const [activeKpiKey, setActiveKpiKey] = useState<string>('all');

  // Load applications data
  const loadData = useCallback(async (currentFilters?: DashboardFilters) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await authorityApi.getApplications(currentFilters || filters);
      setApplications(response.data);
      setKpis(response.kpis);
      setDataSource(response.dataSource);

      const logs = await authorityApi.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with Supabase/API backend.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Deep-linking from AICTE Chrome Extension companion
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'applications', 'analytics', 'action_centre', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const caseId = searchParams.get('caseId');
    const appNumber = searchParams.get('appNumber');
    if (caseId || appNumber) {
      authorityApi.getApplications().then(res => {
        const found = res.data.find(a => a.id === caseId || a.applicationNumber === appNumber || a.applicationNumber === caseId);
        if (found) {
          setSelectedApplication(found);
        }
      });
    }
  }, [searchParams]);

  // Broadcast session updates to official AICTE Extension companion
  useEffect(() => {
    if (user) {
      window.postMessage({
        type: 'AICTE_SMARTASSIST_SESSION_SYNC',
        payload: {
          user,
          role,
          isAuthorized,
          syncedAt: new Date().toISOString()
        }
      }, window.location.origin);
    }
  }, [user, role, isAuthorized]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    setSuccessRefreshMsg('Statutory records refreshed with latest data.');
    setTimeout(() => setSuccessRefreshMsg(null), 3000);
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    loadData(updated);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setActiveKpiKey('all');
    loadData(INITIAL_FILTERS);
  };

  // Click on KPI card to quickly filter
  const handleKpiFilterClick = (filterType: string, filterValue: string) => {
    setActiveKpiKey(filterType);
    if (filterType === 'all') {
      handleResetFilters();
      return;
    }
    if (filterType === 'status_not_completed') {
      handleFilterChange('status', 'All Statuses');
      return;
    }
    if (filterType === 'status') {
      handleFilterChange('status', filterValue);
    } else if (filterType === 'deadlineStatus') {
      handleFilterChange('deadlineStatus', filterValue);
    } else if (filterType === 'evcStatus') {
      handleFilterChange('evcStatus', filterValue);
    } else if (filterType === 'complianceStatus') {
      handleFilterChange('complianceStatus', filterValue);
    } else if (filterType === 'escalated') {
      setActiveTab('action_centre');
    }
  };

  // Reassignment Action
  const handleReassign = async (appId: string, newOfficer: string, reason: string): Promise<boolean> => {
    const res = await authorityApi.reassignOfficer(appId, newOfficer, reason);
    if (res) loadData();
    return res;
  };

  // Follow-Up Action
  const handleFollowUp = async (appId: string, note: string): Promise<boolean> => {
    const res = await authorityApi.sendOfficialFollowUp(appId, note);
    if (res) loadData();
    return res;
  };

  // Statutory Final Decision Action
  const handleExecuteDecision = async (
    appId: string, 
    decision: 'Approved' | 'Rejected', 
    remarks: string
  ): Promise<boolean> => {
    const res = await authorityApi.executeStatutoryDecision(appId, decision, remarks);
    if (res) loadData();
    return res;
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = ['Application ID', 'Institution', 'Region', 'Stage', 'Status', 'Assigned Officer', 'Submitted', 'Deadline'];
    const rows = applications.map(a => [
      a.applicationNumber,
      `"${a.institutionName}"`,
      a.region,
      a.currentStage,
      a.currentStatus,
      `"${a.assignedOfficer}"`,
      a.submittedDate,
      a.deadlineDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Approval_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          escalationCount={kpis.overdueEscalations} 
        />

        {/* Dynamic Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
          
          {/* Permission Denied Guard State */}
          {!isAuthorized ? (
            <InterfaceStateAlert 
              type="permission_denied" 
            />
          ) : (
            <>
              {/* Header Banner: Title, Active Filters & Data Source */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {t('nav.dashboard')}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-aicte-100 text-aicte-900 border border-aicte-200">
                      National Oversight
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Central Bureau monitoring of regional office scrutiny, visiting committees, and final statutory approvals.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <InterfaceStateAlert 
                    type="data_source_badge" 
                    dataSource={dataSource} 
                  />

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('action.export')}</span>
                  </button>
                </div>
              </div>

              {/* Success / Error Alerts */}
              {errorMessage && (
                <InterfaceStateAlert 
                  type="error" 
                  message={errorMessage} 
                  onRetry={handleManualRefresh} 
                />
              )}
              {successRefreshMsg && (
                <InterfaceStateAlert 
                  type="success_refresh" 
                  message={successRefreshMsg} 
                />
              )}

              {/* Requirement 1: 10 KPI CARDS GRID */}
              <KpiCardsGrid 
                kpis={kpis} 
                onSelectKpiFilter={handleKpiFilterClick}
                activeFilterKey={activeKpiKey}
              />

              {/* Requirement 5: SEARCH & MULTI-DIMENSIONAL FILTERS */}
              <FiltersBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                totalFilteredCount={applications.length}
              />

              {/* TAB 1: EXECUTIVE DASHBOARD (OVERVIEW TABLE + ANALYTICS) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Action Centre Callout if Escalations Exist */}
                  {kpis.overdueEscalations > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
                        <div>
                          <div className="text-xs font-bold text-rose-950">
                            {kpis.overdueEscalations} Critical Institutional Cases Require Senior Authority Action
                          </div>
                          <p className="text-[11px] text-rose-800">
                            Unresolved deficiencies, delayed EVC visit reports, and imminent statutory SLA breaches.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('action_centre')}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                      >
                        <span>Open Action Centre</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Phase 3: Regional Alert Map Quick Access Banner */}
                  <div className="bg-gradient-to-r from-aicte-900 to-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-aicte-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Regional Alert Map & Delay Intelligence Active</span>
                          <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                            Leaflet GIS Live
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Inspect OpenStreetMap regional risk layers, stage latency diagnosis, and explainable rule-based risk indicators.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                        <span>Executive Reports</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                      >
                        <span>Regional Alert Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Requirement 2: APPLICATION OVERVIEW TABLE */}
                  <ApplicationOverviewTable
                    applications={applications}
                    onSelectApplication={(app) => setSelectedApplication(app)}
                    isLoading={isLoading}
                  />

                  {/* Requirement 3: INTEGRATED RECHARTS ANALYTICS */}
                  <AnalyticsSection applications={applications} />
                </div>
              )}

              {/* TAB 2: APPLICATIONS ONLY */}
              {activeTab === 'applications' && (
                <ApplicationOverviewTable
                  applications={applications}
                  onSelectApplication={(app) => setSelectedApplication(app)}
                  isLoading={isLoading}
                />
              )}

              {/* TAB 3: REGIONAL ALERT MAP & DELAY INTELLIGENCE */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <RegionalIntelligenceDashboard
                    applications={applications}
                    onSelectApplication={(app) => setSelectedApplication(app)}
                    onFilterByRegion={(regionName) => {
                      handleFilterChange('region', regionName);
                      setActiveTab('applications');
                    }}
                  />
                  <div className="pt-4 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-4">
                      Comprehensive Regional Trends & Stage Analytics
                    </h2>
                    <AnalyticsSection applications={applications} />
                  </div>
                </div>
              )}

              {/* TAB 4: ESCALATION & ACTION CENTRE */}
              {activeTab === 'action_centre' && (
                <ActionCentre
                  applications={applications}
                  onReassign={handleReassign}
                  onFollowUp={handleFollowUp}
                  onOpenCase={(app) => setSelectedApplication(app)}
                  onRefreshData={loadData}
                />
              )}

              {/* TAB: EXECUTIVE STATUTORY REPORTS & AUDITS (PHASE 4) */}
              {activeTab === 'reports' && (
                <ReportsModule
                  applications={applications}
                  onOpenCase={(app) => setSelectedApplication(app)}
                />
              )}

              {/* TAB 5: STATUTORY APPROVALS QUEUE */}
              {activeTab === 'approvals' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileCheck2 className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-900">
                          Central Bureau Final Statutory Approval Desk
                        </h2>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">
                        {applications.filter(a => a.currentStatus === 'Pending HQ Approval').length} cases waiting for Chairman / Member Secretary seal
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      Applications shown here have cleared regional scrutiny and EVC verification and are awaiting formal digital approval orders under AICTE Approval Process Handbook guidelines.
                    </p>

                    <ApplicationOverviewTable
                      applications={applications.filter(a => a.currentStatus === 'Pending HQ Approval')}
                      onSelectApplication={(app) => setSelectedApplication(app)}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: EVC INSPECTION MONITORING */}
              {activeTab === 'evc_monitoring' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <CalendarCheck2 className="w-5 h-5 text-purple-600" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Expert Visiting Committee (EVC) Tracker
                      </h2>
                    </div>
                    <ApplicationOverviewTable
                      applications={applications.filter(a => a.evcStatus !== 'Not Required')}
                      onSelectApplication={(app) => setSelectedApplication(app)}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: COMPLIANCE HEALTH */}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Compliance Deficiencies & Document Expiry Health
                      </h2>
                    </div>
                    <ApplicationOverviewTable
                      applications={applications.filter(a => a.deficienciesCount > 0 || a.expiringDocumentsCount > 0)}
                      onSelectApplication={(app) => setSelectedApplication(app)}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* TAB 8: STATUTORY AUDIT TRAIL */}
              {activeTab === 'audit_logs' && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <ScrollText className="w-5 h-5 text-aicte-900" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Statutory Audit Trail & Cryptographic Verification Log
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Immutable Log Storage
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-aicte-800 bg-aicte-50 px-2 py-0.5 rounded border border-aicte-200">
                              {log.action}
                            </span>
                            <span className="font-mono text-slate-400 text-[10px]">
                              {log.applicationId}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium pt-0.5">
                            {log.details}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Authorized Officer: <strong>{log.actor}</strong> ({log.role})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Case Details Dossier Modal */}
              <ApplicationDetailsModal
                application={selectedApplication}
                onClose={() => setSelectedApplication(null)}
                onExecuteDecision={handleExecuteDecision}
                onRefreshData={loadData}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};
