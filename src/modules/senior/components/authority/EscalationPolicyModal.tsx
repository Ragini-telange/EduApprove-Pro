import React, { useState } from 'react';
import type { EscalationPolicyConfig } from '../../types/authority';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  X, 
  ShieldCheck, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface EscalationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: EscalationPolicyConfig;
  onSavePolicy: (newPolicy: Partial<EscalationPolicyConfig>) => Promise<void>;
  onResetPolicy: () => Promise<void>;
}

export const EscalationPolicyModal: React.FC<EscalationPolicyModalProps> = ({
  isOpen,
  onClose,
  policy,
  onSavePolicy,
  onResetPolicy,
}) => {
  const [formData, setFormData] = useState<EscalationPolicyConfig>({ ...policy });
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof EscalationPolicyConfig, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSavePolicy(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = async () => {
    setIsResetting(true);
    await onResetPolicy();
    setIsResetting(false);
    setFormData({ ...policy });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Escalation Timelines & SLA Threshold Configuration
              </h2>
              <p className="text-xs text-slate-300">
                AICTE Approval Process Handbook (APH 2026-27) Statutory Governance Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Escalation policy saved and backend scheduler updated successfully.</span>
            </div>
          )}

          {/* Section 1: Statutory Stage SLAs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-aicte-900" />
              <span>1. Statutory Stage SLAs (Turnaround Days)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Scrutiny SLA:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.scrutinySlaDays}
                    onChange={(e) => handleChange('scrutinySlaDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">APH Norm: 15 working days</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deficiency Rectification SLA:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.deficiencyRectificationSlaDays}
                    onChange={(e) => handleChange('deficiencyRectificationSlaDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">APH Norm: 10 working days</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  EVC Scheduling Threshold:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.evcSchedulingSlaDays}
                    onChange={(e) => handleChange('evcSchedulingSlaDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">Panel appointment limit</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  EVC Report Submission SLA:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.evcReportingSlaDays}
                    onChange={(e) => handleChange('evcReportingSlaDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">Biometric & report upload</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bureau HQ Final Review SLA:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.bureauReviewSlaDays}
                    onChange={(e) => handleChange('bureauReviewSlaDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">Approval Desk turnaround</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  General Inactivity Dormancy Limit:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.stageInactivityThresholdDays}
                    onChange={(e) => handleChange('stageInactivityThresholdDays', parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-aicte-900"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
                <span className="text-[10px] text-slate-400">Triggers dormant case alert</span>
              </div>
            </div>
          </div>

          {/* Section 2: Escalation Level Triggers */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Multi-Level Escalation Triggers (Days Overdue)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="font-bold text-amber-900 block mb-1">
                  Level 1: Regional Advisory
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.level1OverdueDays}
                    onChange={(e) => handleChange('level1OverdueDays', parseInt(e.target.value) || 1)}
                    className="w-16 p-2 bg-white border border-amber-300 rounded text-xs font-bold text-center text-slate-900"
                  />
                  <span className="text-[11px] text-amber-800 font-medium">day(s) overdue</span>
                </div>
                <p className="text-[10px] text-amber-700 mt-1">Dispatches notification to RO</p>
              </div>

              <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50">
                <span className="font-bold text-orange-950 block mb-1">
                  Level 2: Bureau Warning
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="2"
                    max="45"
                    value={formData.level2OverdueDays}
                    onChange={(e) => handleChange('level2OverdueDays', parseInt(e.target.value) || 5)}
                    className="w-16 p-2 bg-white border border-orange-300 rounded text-xs font-bold text-center text-slate-900"
                  />
                  <span className="text-[11px] text-orange-800 font-medium">days overdue</span>
                </div>
                <p className="text-[10px] text-orange-700 mt-1">Direct Bureau summon issued</p>
              </div>

              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="font-bold text-rose-950 block mb-1">
                  Level 3: Apex Committee
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={formData.level3OverdueDays}
                    onChange={(e) => handleChange('level3OverdueDays', parseInt(e.target.value) || 10)}
                    className="w-16 p-2 bg-white border border-rose-300 rounded text-xs font-bold text-center text-slate-900"
                  />
                  <span className="text-[11px] text-rose-800 font-medium">days overdue</span>
                </div>
                <p className="text-[10px] text-rose-700 mt-1">SAC referral & fast-track taskforce</p>
              </div>
            </div>
          </div>

          {/* Section 3: Deduplication & Expiry Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Automated Backend Rule Safeguards
            </h3>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Prevent Duplicate Alerts for Same Event
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically skips duplicate notifications if an active alert for the same case and event already exists.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoPreventDuplicates}
                  onChange={(e) => handleChange('autoPreventDuplicates', e.target.checked)}
                  className="w-4 h-4 text-aicte-900 rounded border-slate-300 focus:ring-aicte-900"
                />
              </label>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Document Expiry Advance Warning Window:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Days prior to Fire / Land / Building certificate expiry to flag follow-up requirement.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={formData.documentExpiryWarningDays}
                    onChange={(e) => handleChange('documentExpiryWarningDays', parseInt(e.target.value) || 30)}
                    className="w-16 p-1.5 bg-white border border-slate-300 rounded text-xs text-center font-bold"
                  />
                  <span className="text-slate-500">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Metadata */}
          <div className="text-[11px] text-slate-400 bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <span>Last Updated: {new Date(policy.lastUpdated).toLocaleString()}</span>
            <span>Authorized by: {policy.updatedBy}</span>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Resetting...' : 'Reset to APH 2026-27 Norms'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-aicte-900 hover:bg-aicte-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isSaving ? 'Updating...' : 'Save & Enforce Policy'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
