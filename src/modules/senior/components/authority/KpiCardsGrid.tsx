import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { KPICounters } from '../../types/authority';
import { 
  FileStack, 
  Clock, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarClock, 
  ShieldAlert, 
  FileWarning, 
  Flame 
} from 'lucide-react';

interface KpiCardsGridProps {
  kpis: KPICounters;
  onSelectKpiFilter?: (filterType: string, value: string) => void;
  activeFilterKey?: string;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ 
  kpis, 
  onSelectKpiFilter,
  activeFilterKey 
}) => {
  const { t } = useLanguage();

  const cards = [
    {
      id: 'total',
      title: t('kpi.total'),
      value: kpis.totalApplications,
      icon: FileStack,
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-700',
      textColor: 'text-blue-950',
      subtext: 'AY 2026-27 filings',
      filterType: 'all',
      filterValue: 'all',
    },
    {
      id: 'pending',
      title: t('kpi.pending'),
      value: kpis.applicationsPending,
      icon: Clock,
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-700',
      textColor: 'text-amber-950',
      subtext: 'Active in pipeline',
      filterType: 'status_not_completed',
      filterValue: 'pending',
    },
    {
      id: 'scrutiny',
      title: t('kpi.scrutiny'),
      value: kpis.applicationsUnderScrutiny,
      icon: Search,
      bgColor: 'bg-indigo-50/70',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-700',
      textColor: 'text-indigo-950',
      subtext: 'Document evaluation',
      filterType: 'status',
      filterValue: 'Under Scrutiny',
    },
    {
      id: 'correction',
      title: t('kpi.correction'),
      value: kpis.applicationsRequiringCorrection,
      icon: AlertCircle,
      bgColor: 'bg-orange-50/70',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-700',
      textColor: 'text-orange-950',
      subtext: 'Deficiency communicated',
      filterType: 'status',
      filterValue: 'Deficiency Communicated',
    },
    {
      id: 'overdue',
      title: t('kpi.overdue'),
      value: kpis.overdueApplications,
      icon: AlertTriangle,
      bgColor: 'bg-red-50/70',
      borderColor: 'border-red-200',
      iconColor: 'text-red-700',
      textColor: 'text-red-950',
      subtext: 'Statutory deadline breached',
      filterType: 'deadlineStatus',
      filterValue: 'Overdue',
    },
    {
      id: 'completed',
      title: t('kpi.completed'),
      value: kpis.completedApplications,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-700',
      textColor: 'text-emerald-950',
      subtext: 'Final orders issued',
      filterType: 'status',
      filterValue: 'Approved',
    },
    {
      id: 'evc_pending',
      title: t('kpi.evc_pending'),
      value: kpis.pendingEVCSchedulingOrReporting,
      icon: CalendarClock,
      bgColor: 'bg-purple-50/70',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-700',
      textColor: 'text-purple-950',
      subtext: 'Inspection committee visit',
      filterType: 'evcStatus',
      filterValue: 'Pending Scheduling',
    },
    {
      id: 'compliance_pending',
      title: t('kpi.compliance_pending'),
      value: kpis.pendingComplianceSubmissions,
      icon: ShieldAlert,
      bgColor: 'bg-yellow-50/70',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-700',
      textColor: 'text-yellow-950',
      subtext: 'Affidavits & approvals pending',
      filterType: 'complianceStatus',
      filterValue: 'Pending Submission',
    },
    {
      id: 'expiring_docs',
      title: t('kpi.expiring_docs'),
      value: kpis.documentsExpiringSoon,
      icon: FileWarning,
      bgColor: 'bg-rose-50/70',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-700',
      textColor: 'text-rose-950',
      subtext: 'Land/NOC within 30 days',
      filterType: 'complianceStatus',
      filterValue: 'Documents Expiring Soon',
    },
    {
      id: 'escalations',
      title: t('kpi.escalations'),
      value: kpis.overdueEscalations,
      icon: Flame,
      bgColor: 'bg-red-100/60',
      borderColor: 'border-red-300',
      iconColor: 'text-red-700',
      textColor: 'text-red-950',
      subtext: 'High-priority HQ focus',
      filterType: 'escalated',
      filterValue: 'true',
    },
  ];

  return (
    <section aria-label="Key Performance Indicators">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilterKey === card.id;

          return (
            <div
              key={card.id}
              onClick={() => onSelectKpiFilter && onSelectKpiFilter(card.filterType, card.filterValue)}
              className={`p-3.5 rounded-xl border ${card.borderColor} ${card.bgColor} transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                isSelected ? 'ring-2 ring-aicte-900 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-600 line-clamp-1" title={card.title}>
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-white shadow-xs ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-extrabold tracking-tight ${card.textColor}`}>
                  {card.value.toLocaleString()}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 mt-1 font-medium truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
