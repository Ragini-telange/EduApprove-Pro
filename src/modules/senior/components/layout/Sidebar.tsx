import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  AlertOctagon, 
  CalendarCheck2, 
  ShieldAlert, 
  FileCheck2, 
  ScrollText,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  escalationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  escalationCount = 0 
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'applications',
      label: t('nav.applications'),
      icon: FileText,
      badge: null,
    },
    {
      id: 'analytics',
      label: t('nav.regional_analytics'),
      icon: MapPin,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    },
    {
      id: 'action_centre',
      label: t('nav.action_centre'),
      icon: AlertOctagon,
      badge: escalationCount > 0 ? `${escalationCount}` : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'reports',
      label: 'Executive Reports & Audits',
      icon: FileSpreadsheet,
      badge: '8 Reports',
      badgeColor: 'bg-aicte-100 text-aicte-900 font-bold border border-aicte-200',
    },
    {
      id: 'evc_monitoring',
      label: t('nav.evc_monitoring'),
      icon: CalendarCheck2,
      badge: null,
    },
    {
      id: 'compliance',
      label: t('nav.compliance_alerts'),
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'approvals',
      label: 'Statutory Approvals Queue',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'audit_logs',
      label: t('nav.audit_logs'),
      icon: ScrollText,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-sm min-h-[calc(100vh-4rem)]">
      {/* Navigation List */}
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Executive Operations
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-aicte-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info / Links */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 space-y-3">
        <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 text-xs">
          <div className="font-semibold text-amber-900 flex items-center justify-between">
            <span>AICTE Approval Handbook</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            APH 2026-27 statutory norms & timeline regulations are active.
          </p>
        </div>

        <div className="bg-gradient-to-r from-aicte-900 to-slate-900 text-white rounded-lg p-2.5 border border-amber-400/40 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AICTE Copilot
            </span>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
              Voice + Text
            </span>
          </div>
          <p className="text-[10px] text-slate-300 mt-1">
            Multilingual assistant for Senior Authorities, ROs, and Colleges.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Support Desk
          </span>
          <span className="font-mono text-[10px] text-slate-400">v2.4-SIH</span>
        </div>
      </div>
    </aside>
  );
};
