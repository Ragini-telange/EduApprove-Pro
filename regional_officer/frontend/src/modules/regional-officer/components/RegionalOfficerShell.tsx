import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { AppNotification } from '../../../types';
import { getRegionalOfficerService } from '../services';
import {
  LayoutDashboard,
  FileCheck2,
  FileSearch,
  CalendarCheck,
  ShieldAlert,
  ClockAlert,
  History,
  Bell,
  Search,
  Scale,
  Sparkles,
  MapPin,
  BadgeCheck,
  Database,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

export const RegionalOfficerShell: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const service = getRegionalOfficerService();
  const providerStatus = service.getProviderStatus();

  // Load notifications for top bar
  useEffect(() => {
    dataService.getNotifications(user.role, user.id).then((items) => {
      setNotifications(items);
    });
  }, [dataService, refreshKey, user.role, user.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (n: AppNotification) => {
    setNotifMenuOpen(false);
    if (!n.isRead) {
      const res = await dataService.markNotificationAsRead(n.id);
      if (res.success) {
        triggerRefresh();
      }
    }
    if (n.actionUrl) {
      navigate(n.actionUrl);
    } else {
      navigate('/regional-officer/notifications');
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await dataService.markAllNotificationsAsRead(user.role, user.id);
    if (res.success) {
      triggerRefresh();
    }
  };

  // Generate breadcrumbs from location
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[1] || 'dashboard';

  const navItems = [
    { to: '/regional-officer/dashboard', label: 'RO Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/regional-officer/applications', label: 'Assigned Applications', icon: <FileCheck2 className="w-4 h-4" /> },
    { to: '/regional-officer/scrutiny-workspace', label: 'Scrutiny Workspace', icon: <FileSearch className="w-4 h-4" /> },
    { to: '/regional-officer/evc', label: 'EVC Visit Tracking', icon: <CalendarCheck className="w-4 h-4" /> },
    { to: '/regional-officer/compliance', label: 'Compliance & Undertakings', icon: <ShieldAlert className="w-4 h-4" /> },
    { to: '/regional-officer/late-requests', label: 'Late Requests & Appeals', icon: <ClockAlert className="w-4 h-4" /> },
    { to: '/regional-officer/notifications', label: 'Notification Center', icon: <Bell className="w-4 h-4" /> },
    { to: '/regional-officer/audit-logs', label: 'Regulatory Audit Trail', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Inter',sans-serif]">
      {/* 1. Development Data Indicator */}
      {providerStatus.isMock && (
        <aside aria-label="Development environment notice" className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-amber-800 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong className="uppercase font-bold tracking-wider mr-1">Development Data Active:</strong>
              {providerStatus.description}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-amber-100">
            <span>Provider: {providerStatus.providerName}</span>
          </div>
        </aside>
      )}

      {/* 2. Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/regional-officer/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-aicte-navy text-white flex items-center justify-center font-black text-xs tracking-tighter shadow-xs">
                EA
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base">
                  EduApprove <span className="text-blue-600 font-semibold">Pro</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                  Regional Officer Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex items-center relative flex-1 max-w-xs mx-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search application # or college..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Right Header Navigation & Profile */}
          <div className="flex items-center gap-3">
            {/* Interactive Top-Bar Notification Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
                title="Notifications Menu"
                aria-label={`Notifications, ${unreadCount} unread`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No notifications right now.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start gap-3 ${
                              !n.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                !n.isRead ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 leading-snug line-clamp-1">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] pt-0.5">
                                <span className="font-semibold text-slate-500 capitalize bg-slate-100 px-1.5 py-0.2 rounded">
                                  {n.category.replace(/_/g, ' ')}
                                </span>
                                {n.applicationNumber && (
                                  <span className="font-mono text-blue-700">
                                    {n.applicationNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                      <Link
                        to="/regional-officer/notifications"
                        onClick={() => setNotifMenuOpen(false)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 block py-1"
                      >
                        Open Notification Center & Escalation Queue →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Menu using Existing Auth/Profile Contract */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs border border-blue-200">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                  <span>{user.name}</span>
                  <span title="Authorized AICTE Regional Officer">
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  <span className="truncate max-w-[120px]">{user.regionalOffice.split('(')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3. Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'block fixed inset-0 z-50 pt-16' : 'hidden'
          } md:block md:static w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800`}
        >
          {/* Officer badge header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Scale className="w-4 h-4 text-blue-400" />
              <span>Statutory Scrutiny</span>
            </div>
            <div className="mt-1 font-semibold text-white text-xs truncate">
              {user.designation}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Badge: <span className="font-mono text-slate-300">{user.badgeNumber}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Regional Officer Workspace
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Teammate Perspectives (Demo Simulation)
            </div>

            <div className="space-y-1">
              <button
                onClick={() => switchRole('institution_admin')}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg flex items-center justify-between"
                title="Simulate Institution Admin role (tests RoleGuard access restriction)"
              >
                <span>Institution Admin (Part 1)</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => switchRole('senior_authority')}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg flex items-center justify-between"
                title="Simulate AICTE Bureau Head role (tests RoleGuard access restriction)"
              >
                <span>AICTE Bureau Head (Part 3)</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </nav>

          {/* AICTE Statutory Disclaimer */}
          <div className="p-3 m-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AICTE Handbook 2026-27</span>
            </div>
            <p className="leading-relaxed">
              Decisions must be made by an authorized officer. AI suggestions are strictly assistive.
            </p>
          </div>
        </aside>

        {/* 4. Main Content Area with Page Heading and Breadcrumbs */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500">
              <Link to="/regional-officer/dashboard" className="hover:text-blue-600 transition-colors">
                EduApprove Pro
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link to="/regional-officer/dashboard" className="hover:text-blue-600 transition-colors">
                Regional Officer
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800 capitalize">
                {currentSection.replace(/-/g, ' ')}
              </span>
            </nav>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
