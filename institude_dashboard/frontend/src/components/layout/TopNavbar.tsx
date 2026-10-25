import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Globe,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface TopNavbarProps {
  pageTitle: string;
  onOpenMobileSidebar: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  pageTitle,
  onOpenMobileSidebar,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleLogout = () => {
    logout();
    navigate('/institution/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="hidden md:block text-xs text-slate-500 font-medium">
            {t('welcome_back')},{' '}
            <span className="text-indigo-700 font-semibold">
              {user?.name || 'Government College of Engineering'}
            </span>
          </p>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Language, Institution Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowNotifMenu(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{currentLang.native}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    language === l.code ? 'font-semibold text-indigo-700 bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{l.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowLangMenu(false);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        !n.is_read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : n.severity === 'warning' ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.time_ago || 'recent'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 self-center shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  to="/institution/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View Notification Center &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Institution Badge & Profile Menu */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              GCE
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Govt College of Engg'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {user?.institutionCode || 'AICTE-INS-10245'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Government College of Engineering'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {user?.institutionCode || 'AICTE-INS-10245'}
                </p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                  Authenticated Session
                </span>
              </div>

              <div className="py-1 text-xs text-slate-700">
                <Link
                  to="/institution/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Institution Profile</span>
                </Link>
                <Link
                  to="/institution/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Portal Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
