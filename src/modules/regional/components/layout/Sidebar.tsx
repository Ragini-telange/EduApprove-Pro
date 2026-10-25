import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  CalendarCheck,
  ShieldAlert,
  ClockAlert,
  History,
  Building,
  Landmark,
  Scale,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const roNavItems = [
    {
      to: '/regional-officer/dashboard',
      label: 'RO Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: '6 Active',
    },
    {
      to: '/regional-officer/applications',
      label: 'Case Scrutiny & Queue',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: '3 Due',
    },
    {
      to: '/regional-officer/evc',
      label: 'EVC Visit Tracking',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: '2 Scheduled',
    },
    {
      to: '/regional-officer/compliance',
      label: 'Compliance Monitoring',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: '1 Overdue',
    },
    {
      to: '/regional-officer/late-requests',
      label: 'Late Requests & Appeals',
      icon: <ClockAlert className="w-4 h-4" />,
      badge: '1 Pending',
    },
    {
      to: '/regional-officer/audit-logs',
      label: 'Regulatory Audit Trail',
      icon: <History className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Officer badge header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Scale className="w-4 h-4 text-blue-400" />
          <span>Statutory Authority</span>
        </div>
        <div className="mt-1.5 font-medium text-white text-xs truncate">
          {user.role === 'regional_officer'
            ? 'Regional Officer Workspace'
            : user.role === 'institution_admin'
            ? 'Institution Admin Module'
            : 'AICTE Senior Authority (Bureau)'}
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {user.regionalOffice}
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Regional Officer Operations
        </div>

        {roNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/90 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* AICTE Regulatory Norms Reference */}
        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Teammate Workspaces
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500 rounded-lg bg-slate-950/20 border border-slate-800/40">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">Institution Admin (Part 1)</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500 rounded-lg bg-slate-950/20 border border-slate-800/40">
            <Landmark className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">Bureau Approval (Part 3)</span>
          </div>
        </div>
      </div>

      {/* Bottom statutory disclaimer */}
      <div className="p-3 m-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1 font-semibold text-slate-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>AICTE APH 2026-27</span>
        </div>
        <p className="leading-relaxed">
          AI suggestions assist human verification only. All statutory approvals require formal officer determination.
        </p>
      </div>
    </aside>
  );
};
