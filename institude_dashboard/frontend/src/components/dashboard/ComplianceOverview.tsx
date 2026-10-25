import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ComplianceSummaryData } from '../../types';

interface ComplianceOverviewProps {
  compliance: ComplianceSummaryData;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ compliance }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Compliance Overview</h3>
            <p className="text-xs text-slate-500">Statutory and handbook regulations</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Big ratio and progress */}
        <div className="mt-2">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold text-slate-900">
              {compliance.completed_requirements} / {compliance.total_requirements}
            </span>
            <span className="text-sm font-bold text-indigo-700">
              {compliance.progress_percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Requirements Completed</p>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${(compliance.completed_requirements / (compliance.total_requirements || 1)) * 100}%`,
              }}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{
                width: `${(compliance.pending_requirements / (compliance.total_requirements || 1)) * 100}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${(compliance.overdue_requirements / (compliance.total_requirements || 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Breakdown chips */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-base font-bold text-emerald-800">{compliance.completed_requirements}</p>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase">Completed</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-base font-bold text-amber-800">{compliance.pending_requirements}</p>
            <p className="text-[10px] font-semibold text-amber-700 uppercase">Pending</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
            <p className="text-base font-bold text-rose-800">{compliance.overdue_requirements}</p>
            <p className="text-[10px] font-semibold text-rose-700 uppercase">Overdue</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          to="/institution/compliance"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <span>View Compliance Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
