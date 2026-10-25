import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  Bell,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
  unreadCount = 0,
}) => {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/institution/login', { replace: true });
  };

  const navItems = [
    { name: t('dashboard'), to: '/institution/dashboard', icon: LayoutDashboard },
    { name: t('applications'), to: '/institution/applications', icon: FileText },
    { name: t('documents'), to: '/institution/documents', icon: FolderOpen },
    { name: t('passport'), to: '/institution/passport', icon: ShieldCheck },
    { name: t('compliance'), to: '/institution/compliance', icon: CheckCircle2 },
    { name: t('evc'), to: '/institution/evc', icon: CalendarDays },
    {
      name: t('notifications'),
      to: '/institution/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: t('profile'), to: '/institution/profile', icon: Building2 },
    { name: t('settings'), to: '/institution/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-wide text-white uppercase">
                  AICTE SmartAssist
                </span>
                <span className="text-xs text-indigo-300 font-medium">Institution Portal</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpenMobile(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500 text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Institutional Bottom Banner */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {!isCollapsed ? (
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || 'Government College of Engineering'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {t('institution_id')}:{' '}
                <span className="text-indigo-300 font-semibold">
                  {user?.institutionCode || 'AICTE-INS-10245'}
                </span>
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/80 text-center"
              title={`${user?.name || 'Government College of Engineering'} (${user?.institutionCode || 'AICTE-INS-10245'})`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mb-1" />
              <span className="text-[10px] font-mono text-indigo-300 font-bold">10245</span>
            </div>
          )}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Log out from Institution Portal"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
