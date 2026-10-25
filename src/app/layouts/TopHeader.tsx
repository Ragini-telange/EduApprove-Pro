import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Globe2, 
  Bell, 
  Menu, 
  ChevronDown, 
  ShieldCheck, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth, UserRole } from '../providers/AuthProvider';
import { useLanguage, Language } from '../providers/LanguageProvider';
import { useToast } from '../providers/ToastProvider';
import { getRoleDashboardPath, getRoleDisplayName } from '../../types/auth';

interface TopHeaderProps {
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { info, success } = useToast();
  const navigate = useNavigate();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const personas: { role: UserRole; name: string; title: string; badge: string; color: string }[] = [
    {
      role: 'institution',
      name: 'Sakshi Sharma',
      title: 'Institution Admin (Principal)',
      badge: 'College Desk',
      color: 'bg-blue-600',
    },
    {
      role: 'regional_officer',
      name: 'Ragini Telange',
      title: 'Regional Officer (WRO Pune)',
      badge: 'RO Desk',
      color: 'bg-emerald-600',
    },
    {
      role: 'senior_authority',
      name: 'Dr. Janhavi Hinganghatkar',
      title: 'AICTE Bureau Officer / Advisor',
      badge: 'National HQ',
      color: 'bg-purple-600',
    },
  ];

  const handleRoleSelect = async (newRole: UserRole) => {
    await switchRole(newRole);
    setIsRoleDropdownOpen(false);
    const targetDashboard = getRoleDashboardPath(newRole);
    navigate(targetDashboard);
    info('Statutory Role Updated', `Active workspace switched to ${getRoleDisplayName(newRole)}`);
  };

  const handleLangSelect = (newLang: Language) => {
    setLanguage(newLang);
    setIsLangDropdownOpen(false);
    info('Language Updated', `Display language set to ${newLang.toUpperCase()}`);
  };

  const handleLogout = async () => {
    await logout();
    success('Logged Out', 'Your statutory session has ended securely.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      {/* SIH Demonstration Prototype Disclaimer Ribbon */}
      <div className="bg-slate-900 text-amber-300 text-[10px] sm:text-[11px] font-medium px-4 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 mx-auto text-center">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>
            <strong>SIH Prototype Demonstration:</strong> Realistic simulated regulatory dataset &bull; Sandbox Mode &bull; Not connected to live production AICTE systems.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Mobile Toggle & AICTE National Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aicte-navy to-aicte-blue flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                  AICTE SmartAssist
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Unified Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                National Regulatory Approval & Compliance System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Teammate Role Switcher, Language Switcher, Alerts & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persona Switcher Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
                setIsLangDropdownOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline text-slate-500 font-normal">Active Role:</span>
              <span className="font-bold text-slate-900">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/80 text-slate-700">
                {role === 'institution' ? 'Institution' : role === 'regional_officer' ? 'Regional' : 'Bureau HQ'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Switch Teammate Persona</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Test role-based access across all 3 modules</p>
                </div>
                {personas.map((p) => {
                  const isSelected = role === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => handleRoleSelect(p.role)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors mb-1 ${
                        isSelected ? 'bg-blue-50/80 text-blue-900 font-bold border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.title}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] text-white font-medium ${p.color}`}>
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangDropdownOpen(!isLangDropdownOpen);
                setIsRoleDropdownOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              title="Change Language"
            >
              <Globe2 className="w-4 h-4 text-slate-500" />
              <span className="uppercase font-bold">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { code: 'en', label: 'English (EN)' },
                  { code: 'hi', label: 'हिन्दी (HI)' },
                  { code: 'mr', label: 'मराठी (MR)' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleLangSelect(item.code as Language)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      language === item.code ? 'bg-slate-100 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => info('Notification Ledger', '5 Active regulatory compliance alerts requiring attention.')}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Officer Details & Logout Dropdown */}
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsRoleDropdownOpen(false);
                setIsLangDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-aicte-navy text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  <div className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {role ? getRoleDisplayName(role) : 'Officer'}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out of AICTE Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
