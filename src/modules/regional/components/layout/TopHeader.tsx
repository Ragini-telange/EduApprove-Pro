import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { RoleSwitcher } from './RoleSwitcher';
import { Bell, Search, ShieldCheck, MapPin, BadgeCheck, CheckCircle } from 'lucide-react';
import { AppNotification } from '../../types';

export const TopHeader: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey } = useData();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    dataService.getNotifications(user.role, user.id).then((items) => {
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    });
  }, [user.role, user.id, dataService, refreshKey]);

  const handleMarkAsRead = async (id: string) => {
    await dataService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-aicte-navy via-slate-800 to-blue-700 flex items-center justify-center text-white shadow-sm font-black text-sm tracking-tighter">
            EA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                EduApprove <span className="text-blue-600 font-semibold">Pro</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                AICTE Regulatory Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              All India Council for Technical Education • Statutory Scrutiny Portal
            </p>
          </div>
        </div>

        {/* Center - Role Switcher */}
        <div className="hidden md:flex items-center">
          <RoleSwitcher />
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="hidden lg:flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search application # or college..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Statutory alerts and deadlines"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Statutory Alerts ({unreadCount} new)
                  </h4>
                  <span className="text-[11px] text-slate-400">{user.regionalOffice}</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No active alerts.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                          <span className="font-mono text-blue-600">{n.applicationNumber}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs border border-blue-200">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                <span>{user.name}</span>
                {user.role === 'regional_officer' && (
                  <span title="Authorized AICTE Regional Officer">
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[130px]">{user.regionalOffice.split('(')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
