import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileCheck2,
  Award,
  ClipboardList,
  CalendarCheck,
  Bell,
  Building,
  Settings,
  Scale,
  Search,
  Eye,
  History,
  MapPin,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const DynamicSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { role, user } = useAuth();
  const { t } = useLanguage();

  const institutionNavItems: NavItem[] = [
    { to: '/institution/dashboard', labelKey: 'dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard },
    { to: '/institution/applications', labelKey: 'applications', defaultLabel: 'Applications', icon: FileText },
    { to: '/institution/documents', labelKey: 'documents', defaultLabel: 'Documents', icon: FileCheck2 },
    { to: '/institution/passport', labelKey: 'passport', defaultLabel: 'Smart Passport', icon: Award, badge: 'New' },
    { to: '/institution/compliance', labelKey: 'compliance', defaultLabel: 'Compliance', icon: ClipboardList },
    { to: '/institution/evc', labelKey: 'evc', defaultLabel: 'EVC Visit', icon: CalendarCheck },
    { to: '/institution/notifications', labelKey: 'notifications', defaultLabel: 'Notifications', icon: Bell },
    { to: '/institution/profile', labelKey: 'profile', defaultLabel: 'Profile', icon: Building },
    { to: '/institution/settings', labelKey: 'settings', defaultLabel: 'Settings', icon: Settings },
  ];

  const regionalNavItems: NavItem[] = [
    { to: '/regional/dashboard', labelKey: 'dashboard', defaultLabel: 'Regional Dashboard', icon: LayoutDashboard },
    { to: '/regional/applications', labelKey: 'applications', defaultLabel: 'Scrutiny Queue', icon: Search },
    { to: '/regional/scrutiny-workspace', labelKey: 'nav.scrutiny_workspace', defaultLabel: 'Scrutiny Studio', icon: Eye, badge: 'AI' },
    { to: '/regional/evc', labelKey: 'nav.evc_management', defaultLabel: 'EVC Inspections', icon: CalendarCheck },
    { to: '/regional/compliance', labelKey: 'compliance', defaultLabel: 'Compliance & Undertakings', icon: ClipboardList },
    { to: '/regional/late-requests', labelKey: 'nav.late_requests', defaultLabel: 'Late Appeals & Condonation', icon: Scale },
    { to: '/regional/notifications', labelKey: 'notifications', defaultLabel: 'Officer Notices', icon: Bell },
    { to: '/regional/audit-logs', labelKey: 'nav.audit_ledger', defaultLabel: 'Audit Ledger', icon: History },
  ];

  const seniorNavItems: NavItem[] = [
    { to: '/senior/dashboard', labelKey: 'nav.dashboard', defaultLabel: 'National Oversight', icon: LayoutDashboard },
    { to: '/senior/regional-map', labelKey: 'nav.regional_analytics', defaultLabel: 'Regional Alert Map & GIS', icon: MapPin, badge: 'GIS' },
    { to: '/senior/applications', labelKey: 'applications', defaultLabel: 'All Applications', icon: FileText },
    { to: '/senior/escalations', labelKey: 'nav.action_centre', defaultLabel: 'Escalation Action Centre', icon: Flame, badge: 'Overdue' },
    { to: '/senior/reports', labelKey: 'nav.reports', defaultLabel: 'Statutory Reports', icon: FileSpreadsheet },
    { to: '/senior/audit-logs', labelKey: 'nav.audit_ledger', defaultLabel: 'National Audit Trail', icon: History },
  ];

  const activeNavItems =
    role === 'institution'
      ? institutionNavItems
      : role === 'regional_officer'
      ? regionalNavItems
      : seniorNavItems;

  const roleTheme = {
    institution: {
      bg: 'bg-blue-900',
      tag: 'College Admin Module',
      office: user?.institutionCode || 'AICTE-INS-10245',
    },
    regional_officer: {
      bg: 'bg-slate-900',
      tag: 'Regional Scrutiny Module',
      office: 'WRO - Pune Desk',
    },
    senior_authority: {
      bg: 'bg-[#0B1E36]',
      tag: 'Bureau Head Oversight',
      office: 'AICTE HQ - New Delhi',
    },
  }[role || 'institution'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 w-64 h-screen lg:h-[calc(100vh-4rem)] bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Module Subtitle Banner */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {roleTheme.tag}
          </div>
          <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
            {user?.regionalOffice || user?.designation || 'Statutory Portal'}
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-800" />
                  <span className="truncate">{t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Active Officer Identity Card at Bottom */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/70">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-aicte-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Officer'}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.designation || 'Signatory'}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-medium truncate">{roleTheme.office}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Statutory Session" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
