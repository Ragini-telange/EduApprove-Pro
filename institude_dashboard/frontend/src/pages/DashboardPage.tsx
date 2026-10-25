import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  AlertTriangle,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { ConsolidatedDashboard } from '../types';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { ApplicationOverviewChart } from '../components/dashboard/ApplicationOverviewChart';
import { RecentApplications } from '../components/dashboard/RecentApplications';
import { ActionRequired } from '../components/dashboard/ActionRequired';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines';
import { DocumentPassportPreview } from '../components/dashboard/DocumentPassportPreview';
import { ComplianceOverview } from '../components/dashboard/ComplianceOverview';
import { EVCStatusCard } from '../components/dashboard/EVCStatusCard';
import { SmartAlertCenter } from '../components/dashboard/SmartAlertCenter';
import { InstitutionHealthScore } from '../components/dashboard/InstitutionHealthScore';
import { NotificationSummaryCard } from '../components/dashboard/NotificationSummaryCard';
import { AIAssistantCard } from '../components/dashboard/AIAssistantCard';
import { DocumentUploadModal } from '../components/forms/DocumentUploadModal';
import { NewApplicationModal } from '../components/forms/NewApplicationModal';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<ConsolidatedDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewAppOpen, setIsNewAppOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Connect through dashboardService architecture with current institution identifier
      const response = await dashboardService.getDashboardData(user?.id || user?.institutionCode);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-96 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-slate-200 rounded-lg" />
            <div className="h-10 w-36 bg-slate-200 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-white rounded-xl border border-rose-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Dashboard Synchronization Notice</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 6. Dashboard Header - Dynamic Institution Context */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{t('overview_title')}</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              AY {data.institution.current_academic_year || '2026-2027'} Active
            </span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {data.institution.code || data.institution.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{t('overview_desc')}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Upload className="w-4 h-4 text-slate-600" />}
          >
            {t('upload_document')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewAppOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
          >
            {t('new_application')}
          </Button>
        </div>
      </div>

      {/* 7. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title={t('total_applications')}
          value={data.summary.total_applications}
          icon={FileText}
          variant="indigo"
        />
        <SummaryCard
          title={t('under_scrutiny')}
          value={data.summary.under_scrutiny}
          icon={Search}
          variant="blue"
        />
        <SummaryCard
          title={t('correction_required')}
          value={data.summary.correction_required}
          icon={AlertTriangle}
          variant="orange"
        />
        <SummaryCard
          title={t('compliance_pending')}
          value={data.summary.compliance_pending}
          icon={Clock}
          variant="amber"
        />
        <SummaryCard
          title={t('documents_expiring')}
          value={data.summary.documents_expiring}
          icon={FolderOpen}
          variant="rose"
        />
        <SummaryCard
          title={t('expired_documents')}
          value={data.summary.expired_documents}
          icon={AlertCircle}
          variant="red"
        />
      </div>

      {/* Row 2: Application Overview (Donut Chart) + Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ApplicationOverviewChart data={data.application_summary} />
        </div>
        <div className="lg:col-span-7">
          <ActionRequired
            actions={data.action_required}
            onActionClick={(action) => {
              if (action.type.includes('Document')) {
                setIsUploadOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Row 3: Recent Applications Table */}
      <div>
        <RecentApplications applications={data.recent_applications} />
      </div>

      {/* Row 4: Smart Alert Center + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SmartAlertCenter alerts={data.alerts} />
        </div>
        <div className="lg:col-span-6">
          <UpcomingDeadlines deadlines={data.deadlines} />
        </div>
      </div>

      {/* Row 5: Smart Document Passport Preview + Institution Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DocumentPassportPreview documents={data.document_passport} />
        </div>
        <div className="lg:col-span-6">
          <InstitutionHealthScore healthScore={data.health_score} />
        </div>
      </div>

      {/* Row 6: Compliance Overview + EVC Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ComplianceOverview compliance={data.compliance} />
        </div>
        <div className="lg:col-span-6">
          <EVCStatusCard evc={data.evc} />
        </div>
      </div>

      {/* Row 7: Notification Summary + AI Assistant Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <NotificationSummaryCard notifications={data.notifications} />
        </div>
        <div className="lg:col-span-7">
          <AIAssistantCard />
        </div>
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <NewApplicationModal
        isOpen={isNewAppOpen}
        onClose={() => setIsNewAppOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
