import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ApplicationRecord } from '../../types/authority';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award
} from 'lucide-react';

interface ApplicationDetailsModalProps {
  application: ApplicationRecord | null;
  onClose: () => void;
  onExecuteDecision: (appId: string, decision: 'Approved' | 'Rejected', remarks: string) => Promise<boolean>;
  onRefreshData: () => void;
}

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  onClose,
  onExecuteDecision,
  onRefreshData,
}) => {
  const { canApprove } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'evc' | 'decision'>('overview');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionStatusMsg, setDecisionStatusMsg] = useState<string | null>(null);

  if (!application) return null;

  const handleDecision = async (decision: 'Approved' | 'Rejected') => {
    if (!decisionRemarks.trim()) {
      alert('Please enter statutory remarks or justification before recording the decision.');
      return;
    }
    setIsSubmittingDecision(true);
    const success = await onExecuteDecision(application.id, decision, decisionRemarks);
    setIsSubmittingDecision(false);
    if (success) {
      setDecisionStatusMsg(`Statutory decision (${decision}) officially recorded for ${application.applicationNumber}.`);
      onRefreshData();
      setTimeout(() => {
        setDecisionStatusMsg(null);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 bg-aicte-900 text-white rounded-t-2xl flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                AY {application.academicYear}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-300">
                {application.applicationNumber}
              </span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">
                Code: {application.instituteCode}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {application.institutionName}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {application.region} Region • {application.state}
              </span>
              <span>•</span>
              <span>Type: <strong>{application.applicationType}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-aicte-900 text-aicte-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dossier Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-aicte-900 text-aicte-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Documents & Compliance ({application.deficienciesCount} Deficiencies)
          </button>
          <button
            onClick={() => setActiveTab('evc')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'evc'
                ? 'border-aicte-900 text-aicte-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            EVC Inspection Findings ({application.evcStatus})
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'decision'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Statutory Decision Desk
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {decisionStatusMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg flex items-center gap-2 font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {decisionStatusMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Pipeline Stage</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{application.currentStage}</div>
                  <span className="text-[11px] text-slate-500">{application.daysInCurrentStage} days at this milestone</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Statutory Status</span>
                  <div className="text-sm font-bold text-aicte-900 mt-1">{application.currentStatus}</div>
                  <span className="text-[11px] text-slate-500">Deadline: {application.deadlineDate}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Scrutinizer</span>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">{application.assignedOfficer}</div>
                  <span className="text-[11px] text-slate-500">{application.responsibleTeam || 'Regional Office'}</span>
                </div>
              </div>

              {/* Programs and Applied Intake */}
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Academic Programs & Applied Seat Intake
                </h4>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Applied Student Intake:</span>
                  <span className="font-bold text-slate-900 text-sm">{application.intakeApplied} Seats</span>
                </div>
                <div className="py-2">
                  <span className="text-slate-600 block mb-1.5 font-medium">Applied Disciplines / Programs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {application.programs.map((p) => (
                      <span key={p} className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-[11px] font-semibold border border-blue-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                  Statutory Milestone Trail (APH Guidelines)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 font-semibold">
                    1. Application Filing ✓
                  </div>
                  <div className={`p-2 rounded font-semibold ${
                    ['Document Scrutiny', 'Deficiency Rectification', 'EVC Inspection', 'Bureau HQ Final Review'].includes(application.currentStage)
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}>
                    2. Document Scrutiny
                  </div>
                  <div className={`p-2 rounded font-semibold ${
                    ['EVC Inspection', 'Regional Committee (RC)', 'Bureau HQ Final Review'].includes(application.currentStage)
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}>
                    3. EVC Inspection
                  </div>
                  <div className={`p-2 rounded font-semibold ${
                    application.currentStage === 'Bureau HQ Final Review'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}>
                    4. Central Bureau Review
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <span className="font-semibold">Compliance Summary: </span>
                {application.deficienciesCount === 0 ? (
                  <span>All statutory documents verified against AICTE Approval Process Handbook standards. Zero outstanding deficiencies.</span>
                ) : (
                  <span>{application.deficienciesCount} pending deficiency items communicated to applicant institute. Resolution pending statutory review.</span>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Land Title & Non-Encumbrance Certificate</div>
                      <span className="text-[10px] text-slate-500">Verified by Sub-Registrar • 12.5 Acres contiguous campus</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">National Building Code (NBC) Fire Safety Certificate</div>
                      <span className="text-[10px] text-slate-500">State Fire Services Department Clearance</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    application.deficienciesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {application.deficienciesCount > 0 ? 'Clarification Required' : 'Certified'}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">AICTE Affidavits 1, 2 & 3 (Anti-Ragging & Faculty Roster)</div>
                      <span className="text-[10px] text-slate-500">Notarized on ₹100 Stamp Paper with Cadre Ratio calculations</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVC INSPECTION */}
          {activeTab === 'evc' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">EVC Inspection Status:</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-xs">
                    {application.evcStatus}
                  </span>
                </div>
                <div className="text-slate-600">
                  <span>Scheduled / Visited Date: <strong>{application.evcScheduledDate || 'Not Scheduled Yet'}</strong></span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  All EVC inspections require GPS geotagged photo capture, biometric verification of faculty attendance, and real-time laboratory verification.
                </p>
              </div>

              {application.evcStatus === 'Report Submitted' && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  <div className="font-bold mb-1">EVC Convenor Recommendation: RECOMMENDED</div>
                  <p className="text-[11px]">
                    Inspection Committee verified instructional area (8,420 sq.m), administrative area, computational facilities (1:4 computer-to-student ratio), and laboratory equipment. Recommendation forwarded for Central Bureau statutory sign-off.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATUTORY DECISION DESK */}
          {activeTab === 'decision' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 text-amber-950">
                <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                  <Award className="w-4 h-4 text-amber-700" />
                  Statutory Approval Authority (Regulation 2026/APH)
                </div>
                <p className="text-[11px] text-amber-800">
                  As Central Bureau Officer / Senior Authority, recording an approval issues an official AICTE Statutory Approval Letter bearing your digital verification seal. Rejection requires statutory grounds under AICTE Act 1987.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Statutory Order Findings & Executive Remarks:
                </label>
                <textarea
                  rows={4}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Record formal statutory remarks."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aicte-900"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={!canApprove || isSubmittingDecision}
                  onClick={() => handleDecision('Rejected')}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>

                <button
                  type="button"
                  disabled={!canApprove || isSubmittingDecision}
                  onClick={() => handleDecision('Approved')}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingDecision ? 'Executing Seal...' : 'Grant Statutory Approval (AICTE APH)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 rounded-b-2xl border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            AICTE Record Reference: {application.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
