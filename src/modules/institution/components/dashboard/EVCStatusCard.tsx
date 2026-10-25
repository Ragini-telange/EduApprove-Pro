import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { EVCStatusData } from '../../types';
import { Badge } from '../common/Badge';

interface EVCStatusCardProps {
  evc: EVCStatusData;
}

export const EVCStatusCard: React.FC<EVCStatusCardProps> = ({ evc }) => {
  if (!evc.is_applicable) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">EVC Visit Status</h3>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
            Not Applicable
          </span>
        </div>
        <p className="text-xs text-slate-500 py-6 text-center">
          No Expert Visiting Committee (EVC) visits are scheduled for your active applications.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">EVC Visit Status</h3>
            <p className="text-xs text-slate-500">Expert Visiting Committee Inspection</p>
          </div>
          <Badge variant="primary" dot>
            {evc.status || 'Scheduled'}
          </Badge>
        </div>

        {/* Visit Highlights */}
        <div className="bg-indigo-50/50 rounded-lg p-3.5 border border-indigo-100/80 mb-3">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{evc.formatted_date || '20 Nov 2026'}</span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {evc.visit_time || '10:30 AM'}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Committee Visit ({evc.committee_members_count || 3} members)</span>
          </div>

          {evc.application_number && (
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Ref: <span className="font-semibold text-slate-700">{evc.application_number}</span>
            </div>
          )}
        </div>

        {/* Readiness progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Preparation Status</span>
            <span className="font-bold text-indigo-700">
              {evc.preparation_status_pct || 75}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${evc.preparation_status_pct || 75}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          to="/institution/evc"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <span>View EVC Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
