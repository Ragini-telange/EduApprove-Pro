import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import {
  Bell,
  ShieldCheck,
  Key,
  Check,
  User,
  Globe,
  Monitor,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsUrgent, setSmsUrgent] = useState(true);
  const [evcReminders, setEvcReminders] = useState(true);

  // Account Settings State
  const [liaisonName, setLiaisonName] = useState('Dr. R. K. Sharma');
  const [liaisonPhone, setLiaisonPhone] = useState('+91 98230 11425');
  const [officialEmail, setOfficialEmail] = useState('principal@gcepune.ac.in');

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Display Preferences State
  const [compactTables, setCompactTables] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage('New password and confirm password do not match.');
      return;
    }

    setSecurityMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Portal Settings &amp; Preferences</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your institutional profile contact, notification channels, password security, and display options.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences saved!
            </span>
          )}
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save All Preferences
          </Button>
        </div>
      </div>

      {/* 1. Account & Liaison Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          Institutional Account &amp; Liaison Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Registered Institutional Email
            </label>
            <input
              type="email"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Used for AICTE statutory communications &amp; notices</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              AICTE Liaison Officer Name
            </label>
            <input
              type="text"
              value={liaisonName}
              onChange={(e) => setLiaisonName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Authorized representative for regional scrutiny</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Liaison Emergency Contact Number
            </label>
            <input
              type="text"
              value={liaisonPhone}
              onChange={(e) => setLiaisonPhone(e.target.value)}
              className="w-full max-w-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Registered for instant SMS dispatches and EVC visit alerts</p>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          Alerts &amp; Notification Preferences
        </h3>

        <div className="space-y-3 divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-slate-800">Deficiency &amp; Scrutiny Email Notifications</p>
              <p className="text-slate-500 text-[11px]">
                Receive immediate email notifications when the Regional Scrutiny Committee notes corrections.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-slate-800">Critical Expiry SMS Dispatches</p>
              <p className="text-slate-500 text-[11px]">
                Alert the Principal and Liaison Officer via SMS when certificates enter the critical 7-day expiry window.
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsUrgent}
              onChange={(e) => setSmsUrgent(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-slate-800">EVC Inspection &amp; Compliance Reminders</p>
              <p className="text-slate-500 text-[11px]">
                Periodic dashboard reminders for upcoming Expert Visiting Committee dates and compliance submissions.
              </p>
            </div>
            <input
              type="checkbox"
              checked={evcReminders}
              onChange={(e) => setEvcReminders(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Language & Regional Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          Language &amp; Regional Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Portal Interface Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="en">English (Official)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Changes interface text and statutory labels across the portal</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Academic Calendar Cycle
            </label>
            <input
              type="text"
              value="AY 2026-2027 (National Approval Cycle)"
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">Governed by the AICTE National Approval Process Handbook</p>
          </div>
        </div>
      </div>

      {/* 4. Password & Security Credentials */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-600" />
          Password &amp; Security Credentials
        </h3>

        {securityMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold ${
              securityMessage.includes('successfully')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {securityMessage}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-3 max-w-lg text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pr-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pr-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button variant="outline" size="sm" type="submit">
              Update Password
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-800">Two-Factor OTP Verification</p>
              <p className="text-slate-500 text-[11px]">
                Require an SMS/Email OTP verification when uploading regulatory documents or submitting applications.
              </p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorAuth}
              onChange={(e) => setTwoFactorAuth(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Display & Accessibility Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-indigo-600" />
          Display &amp; Workflow Preferences
        </h3>

        <div className="space-y-3 divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-slate-800">Compact Data Tables</p>
              <p className="text-slate-500 text-[11px]">
                Display application lists and document rosters in high-density compact row format.
              </p>
            </div>
            <input
              type="checkbox"
              checked={compactTables}
              onChange={(e) => setCompactTables(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-slate-800">High Contrast Audit View</p>
              <p className="text-slate-500 text-[11px]">
                Enhance visual contrast on status badges and compliance requirement tables.
              </p>
            </div>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" /> Preferences saved!
          </span>
        )}
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save All Preferences
        </Button>
      </div>
    </div>
  );
};
