import React from 'react';
import { AlertCircle, Clock, FileWarning, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionRequiredItem } from '../../types';

interface ActionRequiredProps {
  actions: ActionRequiredItem[];
  onActionClick?: (action: ActionRequiredItem) => void;
}

export const ActionRequired: React.FC<ActionRequiredProps> = ({ actions, onActionClick }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 shadow-sm">
        <p className="text-sm">No immediate actions required. All items are in good standing!</p>
      </div>
    );
  }

  const getSeverityTheme = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/20',
          badge: 'bg-rose-100 text-rose-700',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'high':
        return {
          border: 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/20',
          badge: 'bg-amber-100 text-amber-800',
          icon: Clock,
          iconColor: 'text-amber-600',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          border: 'border-l-4 border-l-blue-500 border-blue-200 bg-blue-50/20',
          badge: 'bg-blue-100 text-blue-700',
          icon: FileWarning,
          iconColor: 'text-blue-600',
          btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            Action Required
          </h3>
          <p className="text-xs text-slate-500">Urgent deficiencies and renewal obligations</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
          {actions.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {actions.map((act) => {
          const theme = getSeverityTheme(act.severity);
          const Icon = theme.icon;

          return (
            <div
              key={act.id}
              className={`rounded-lg border p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.border}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <Icon className={`w-5 h-5 ${theme.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${theme.badge}`}>
                      {act.type}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">{act.description}</p>
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0">
                {onActionClick ? (
                  <button
                    onClick={() => onActionClick(act)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors ${theme.btn}`}
                  >
                    <span>{act.button_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    to={act.button_action}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors ${theme.btn}`}
                  >
                    <span>{act.button_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
