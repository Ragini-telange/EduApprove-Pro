import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  Globe, 
  UserCheck, 
  RefreshCw
} from 'lucide-react';
import type { UserRole } from '../../types/authority';

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing = false }) => {
  const { user, role, setRole, isAuthorized } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-aicte-900 border-b border-aicte-800 text-white shadow-md">
      {/* Official Top Bar */}
      <div className="bg-slate-950 px-4 py-1 text-xs flex justify-between items-center text-slate-400 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-amber-400">GOVERNMENT OF INDIA</span>
          <span>•</span>
          <span>Ministry of Education • All India Council for Technical Education (AICTE)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            National Portal Live
          </span>
          <span className="hidden md:inline">Academic Year: 2026-2027</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md font-bold text-xl border border-amber-300">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  {t('portal.title')}
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">
                  HQ Central
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                {t('portal.subtitle')}
              </p>
            </div>
          </div>

          {/* Right Controls: Role Switcher (for testing), Lang, Notifications, User */}
          <div className="flex items-center space-x-3">
            {/* Quick Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={t('action.refresh')}
              className="p-2 rounded-lg bg-aicte-800 hover:bg-aicte-700 text-slate-200 transition-colors flex items-center text-xs font-medium space-x-1 border border-aicte-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">{t('action.refresh')}</span>
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center bg-aicte-800 rounded-lg border border-aicte-700 px-2 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              <select
                aria-label="Select Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-slate-900 text-white">English</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
                <option value="mr" className="bg-slate-900 text-white">मराठी (Marathi)</option>
              </select>
            </div>

            {/* Role Switcher Widget for Testing All Access States */}
            <div className="flex items-center bg-aicte-800/80 rounded-lg border border-aicte-700 p-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1.5" />
              <select
                aria-label="Switch User Role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
                title="Switch active session role to test authorized vs restricted states"
              >
                <option value="bureau_officer" className="bg-slate-900 text-white">
                  👑 Senior Authority / Bureau Officer
                </option>
                <option value="regional_officer" className="bg-slate-900 text-white">
                  🏛️ Ragini (Regional Officer)
                </option>
                <option value="institution_admin" className="bg-slate-900 text-white">
                  🏫 Sakshi (Institution Admin)
                </option>
              </select>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                className="p-2 rounded-lg bg-aicte-800 hover:bg-aicte-700 text-slate-200 relative transition-colors border border-aicte-700"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-aicte-900"></span>
              </button>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2 pl-2 border-l border-aicte-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow">
                JH
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-white flex items-center gap-1">
                  {user?.name}
                  {isAuthorized && <ShieldCheck className="w-3 h-3 text-amber-400 inline" />}
                </div>
                <div className="text-[10px] text-slate-300">
                  {user?.designation}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
