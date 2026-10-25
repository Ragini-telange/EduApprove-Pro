import React, { useState } from 'react';
import type { 
  RuleBasedRiskIndicator, 
  ApplicationRecord 
} from '../../types/authority';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Info
} from 'lucide-react';

interface PredictiveRiskSectionProps {
  indicators: RuleBasedRiskIndicator[];
  onSelectApplication: (app: ApplicationRecord) => void;
  applications: ApplicationRecord[];
}

export const PredictiveRiskSection: React.FC<PredictiveRiskSectionProps> = ({
  indicators,
  onSelectApplication,
  applications,
}) => {
  const { t } = useLanguage();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filteredIndicators = indicators.filter(item => {
    if (severityFilter === 'all') return true;
    return item.severity === severityFilter;
  });

  const handleOpenApp = (appId: string) => {
    const found = applications.find(a => a.id === appId || a.applicationNumber === appId);
    if (found) {
      onSelectApplication(found);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t('risk.title')}</span>
              <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Deterministic Rule Engine (Non-ML)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {t('risk.subtitle')}
            </p>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Filter Severity:</span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              severityFilter === 'all'
                ? 'bg-aicte-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({indicators.length})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              severityFilter === 'high'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            High Risk ({indicators.filter(i => i.severity === 'high').length})
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              severityFilter === 'medium'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Medium ({indicators.filter(i => i.severity === 'medium').length})
          </button>
        </div>
      </div>

      {/* Notice on Explainability */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Statutory Transparency Notice:</span> In strict accordance with AICTE administrative guidelines, all risk assessments shown below are calculated using deterministic, published rules from the <em>Approval Process Handbook (APH 2026-27)</em>. These indicators do not generate automated approvals or rejections; formal statutory determinations are reserved exclusively for authorized officers.
        </div>
      </div>

      {/* Risk Items List */}
      <div className="space-y-3">
        {filteredIndicators.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl text-xs">
            No risk conditions detected under current severity filter.
          </div>
        ) : (
          filteredIndicators.map((item) => (
            <div
              key={item.ruleId}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              {/* Row 1: Badges & Identifiers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.severity === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    item.severity === 'medium' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {item.severity} Severity
                  </span>

                  <span className="font-mono text-xs font-bold text-aicte-900">
                    {item.applicationNumber}
                  </span>

                  <span className="text-slate-400 text-xs">•</span>

                  <span className="text-xs font-semibold text-slate-800">
                    {item.institutionName}
                  </span>

                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.region} Region
                  </span>
                </div>

                <button
                  onClick={() => handleOpenApp(item.applicationId)}
                  className="px-3 py-1 bg-aicte-900 hover:bg-aicte-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 shrink-0 self-start sm:self-auto"
                >
                  <span>Review Case Record</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Row 2: Risk Factor Identified */}
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <AlertTriangle className={`w-4 h-4 ${
                  item.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                }`} />
                <span>{item.riskFactor}</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (Stage: <strong>{item.currentStage}</strong> • Status: <strong>{item.currentStatus}</strong>)
                </span>
              </div>

              {/* Row 3: Traceable Data Evidence & Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Traceable Data Evidence
                  </div>
                  <p className="text-slate-700">
                    {item.traceableDataEvidence}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Responsible RO: <strong>{item.assignedOfficer}</strong>
                  </div>
                </div>

                <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    Explainable Statutory Guidance
                  </div>
                  <p className="text-blue-950 font-medium">
                    {item.recommendation}
                  </p>
                  <div className="text-[10px] text-blue-600 pt-1">
                    Guideline Source: APH 2026-27 Clause 4.12
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
