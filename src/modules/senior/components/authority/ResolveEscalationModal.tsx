import React, { useState } from 'react';
import type { EscalationCase } from '../../types/authority';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileCheck, 
  ShieldAlert 
} from 'lucide-react';

interface ResolveEscalationModalProps {
  escalation: EscalationCase | null;
  onClose: () => void;
  onResolve: (escId: string, data: { notes: string; proofRef: string }) => Promise<{ success: boolean; message: string }>;
}

export const ResolveEscalationModal: React.FC<ResolveEscalationModalProps> = ({
  escalation,
  onClose,
  onResolve,
}) => {
  const [resolutionCategory, setResolutionCategory] = useState('Compliance Deficiency Rectification Verified');
  const [proofRef, setProofRef] = useState('');
  const [notes, setNotes] = useState('');
  const [certified, setCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!escalation) return null;

  const hasLingeringIssues = 
    escalation.deficienciesCount > 0 || 
    escalation.evcStatus === 'Delayed' || 
    escalation.evcStatus === 'Pending Scheduling';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!notes.trim() || notes.trim().length < 10) {
      setErrorMessage('A comprehensive formal justification (minimum 10 characters) is required to resolve this escalation.');
      return;
    }

    if (!proofRef.trim()) {
      setErrorMessage('A verified Statutory Clearance Order Reference or Document ID is mandatory.');
      return;
    }

    if (!certified) {
      setErrorMessage('You must certify that the underlying statutory deficiency or delay has been duly resolved.');
      return;
    }

    setIsSubmitting(true);
    const combinedNotes = `[${resolutionCategory}] ${notes.trim()}`;
    const res = await onResolve(escalation.id, { notes: combinedNotes, proofRef: proofRef.trim() });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Statutory Resolution of Escalation
              </h2>
              <p className="text-[11px] text-slate-300">
                Official Resolution Ledger & Verification Seal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">

          {/* Case Reference Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 text-xs">
                {escalation.applicationNumber}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {escalation.complianceReference}
              </span>
            </div>
            <p className="font-semibold text-slate-800">
              {escalation.institutionName} ({escalation.region} Region)
            </p>
            <p className="text-[11px] text-slate-500">
              Trigger Reason: <span className="text-slate-700">{escalation.reason}</span>
            </p>
          </div>

          {/* Verification Safeguard Warning if underlying issues exist */}
          {hasLingeringIssues && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Verification Guard: Lingering Issues Recorded</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This case currently records{' '}
                {escalation.deficienciesCount > 0 && <strong>{escalation.deficienciesCount} open deficiencies</strong>}
                {escalation.deficienciesCount > 0 && escalation.evcStatus === 'Delayed' && ' and '}
                {escalation.evcStatus === 'Delayed' && <strong>an overdue EVC inspection</strong>}
                . Under AICTE APH regulations, an escalation may only be closed if verified rectification evidence is explicitly certified below.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resolution Category */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resolution Grounds / Verification Category:
            </label>
            <select
              value={resolutionCategory}
              onChange={(e) => setResolutionCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-aicte-900"
            >
              <option value="Compliance Deficiency Rectification Verified">
                Compliance Deficiency Rectification Verified & Cleared
              </option>
              <option value="EVC Biometric Inspection Report Received & Accepted">
                EVC Biometric Inspection Report Received & Accepted by RO
              </option>
              <option value="Statutory Time Extension Granted by Competent Authority">
                Statutory Time Extension Granted by Competent Authority (Chairman/MS)
              </option>
              <option value="Document Renewal Verified with Issuing Department">
                Document Renewal Verified with Issuing Department (Fire/PWD/Revenue)
              </option>
              <option value="Appellate Speaking Order Issued & Enforced">
                Appellate Speaking Order Issued & Enforced
              </option>
              <option value="Administrative Clarification Accepted">
                Administrative Clarification Formally Accepted by Bureau
              </option>
            </select>
          </div>

          {/* Verification Proof Ref */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Statutory Verification Order / Clearance Document Reference: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AICTE/WRO/2026/VERIF-8901 or FireNOC/MH/2026/341"
              value={proofRef}
              onChange={(e) => setProofRef(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-aicte-900"
            />
            <span className="text-[10px] text-slate-400">
              Must reference an official government order, dispatch docket, or portal receipt number.
            </span>
          </div>

          {/* Detailed Justification Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Authorised Resolution Findings & Verification Summary: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Record exact findings: specify how the underlying deficiency was verified, date of receipt, and reason why the escalation is fully resolved..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-aicte-900"
            ></textarea>
            <span className="text-[10px] text-slate-400">
              Permanently preserved in the AICTE Statutory Audit Trail.
            </span>
          </div>

          {/* Mandatory Certification Checkbox */}
          <label className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-700 font-medium">
              I certify as an authorized official that the underlying deficiency, EVC report, or compliance issue has been duly resolved in compliance with AICTE APH 2026-27 norms.
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Closing...' : 'Confirm Resolution & Sign Off'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
