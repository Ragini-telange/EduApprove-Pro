import React from 'react';
import { Activity, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { HealthScoreData } from '../../types';

interface InstitutionHealthScoreProps {
  healthScore: HealthScoreData;
  className?: string;
}

export const InstitutionHealthScore: React.FC<InstitutionHealthScoreProps> = ({
  healthScore,
  className = '',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (score >= 60) return { ring: 'text-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' };
    if (score >= 40) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
    return { ring: 'text-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' };
  };

  const colors = getScoreColor(healthScore.score);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Institution Health Score</h3>
            <p className="text-xs text-slate-500">Comprehensive readiness &amp; compliance metric</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Circular / Score Header */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50/70 border border-slate-100 mb-4">
          <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-200"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={201}
                strokeDashoffset={201 - (201 * healthScore.score) / 100}
                className={colors.ring}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-900">{healthScore.score}</span>
              <span className="text-[10px] text-slate-400 font-bold">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Status:
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {healthScore.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your institution exhibits good compliance hygiene. Resolving critical certificate renewals
              will elevate the indicator to Excellent (&gt;85).
            </p>
          </div>
        </div>

        {/* 4 Pillars Breakdown as required */}
        <div className="space-y-3">
          {/* Pillar 1: Application Compliance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Application compliance</span>
              <span className="font-semibold text-slate-900">
                {healthScore.breakdown.application_compliance}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${healthScore.breakdown.application_compliance}%` }}
              />
            </div>
          </div>

          {/* Pillar 2: Document Validity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Document validity</span>
              <span className="font-semibold text-slate-900">
                {healthScore.breakdown.document_validity}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all"
                style={{ width: `${healthScore.breakdown.document_validity}%` }}
              />
            </div>
          </div>

          {/* Pillar 3: Compliance Completion */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Compliance completion</span>
              <span className="font-semibold text-slate-900">
                {healthScore.breakdown.undertaking_compliance}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${healthScore.breakdown.undertaking_compliance}%` }}
              />
            </div>
          </div>

          {/* Pillar 4: Pending Actions */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Pending actions</span>
              <span className="font-semibold text-slate-900">
                {healthScore.breakdown.pending_actions}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${healthScore.breakdown.pending_actions}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Display */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 bg-slate-50/60 p-2.5 rounded-lg">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 font-medium leading-snug">
          {healthScore.disclaimer || 'AICTE SmartAssist Institutional Health Indicator. Not an official AICTE score.'}
        </p>
      </div>
    </div>
  );
};
