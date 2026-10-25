import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertItem } from '../../types';

interface SmartAlertCenterProps {
  alerts: AlertItem[];
  onDismiss?: (id: number) => void;
}

export const SmartAlertCenter: React.FC<SmartAlertCenterProps> = ({ alerts, onDismiss }) => {
  const [filter, setFilter] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => [...prev, id]);
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          tag: 'Critical',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      case 'high priority':
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-900',
          dot: 'bg-orange-500',
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          tag: 'High',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          dot: 'bg-amber-500',
          icon: Clock,
          iconColor: 'text-amber-600',
          tag: 'Medium',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'upcoming':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          dot: 'bg-sky-500',
          icon: Info,
          iconColor: 'text-sky-600',
          tag: 'Upcoming',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
        };
    }
  };

  const visibleAlerts = alerts
    .filter((a) => !dismissedIds.includes(a.id) && !a.is_dismissed)
    .filter((a) => {
      if (filter === 'all') return true;
      if (filter === 'high') {
        return a.severity.toLowerCase() === 'high' || a.severity.toLowerCase() === 'high priority';
      }
      return a.severity.toLowerCase() === filter;
    });

  const severityCounts = {
    all: alerts.filter((a) => !dismissedIds.includes(a.id) && !a.is_dismissed).length,
    critical: alerts.filter(
      (a) => !dismissedIds.includes(a.id) && !a.is_dismissed && a.severity.toLowerCase() === 'critical'
    ).length,
    high: alerts.filter(
      (a) =>
        !dismissedIds.includes(a.id) &&
        !a.is_dismissed &&
        (a.severity.toLowerCase() === 'high' || a.severity.toLowerCase() === 'high priority')
    ).length,
    medium: alerts.filter(
      (a) => !dismissedIds.includes(a.id) && !a.is_dismissed && a.severity.toLowerCase() === 'medium'
    ).length,
    upcoming: alerts.filter(
      (a) => !dismissedIds.includes(a.id) && !a.is_dismissed && a.severity.toLowerCase() === 'upcoming'
    ).length,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            Smart Alert Center
          </h3>
          <p className="text-xs text-slate-500">Automated prioritized institutional alerts</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'upcoming'] as const).map((sev) => {
            const count = severityCounts[sev];
            if (sev !== 'all' && count === 0) return null;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilter(sev)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded capitalize transition-colors ${
                  filter === sev
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {visibleAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No active alerts in this category</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All regulatory benchmarks are currently nominal</p>
          </div>
        ) : (
          visibleAlerts.map((al) => {
            const badge = getSeverityBadge(al.severity);
            const Icon = badge.icon;

            return (
              <div
                key={al.id}
                className={`p-3.5 rounded-lg border transition-all ${badge.bg} flex items-start gap-3 justify-between group`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <Icon className={`w-4 h-4 ${badge.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-xs ${badge.badgeClass}`}
                      >
                        {badge.tag}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{al.title}</h4>
                    </div>
                    <p className="text-xs mt-1 text-slate-700 leading-relaxed">{al.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {al.action_url && (
                    <Link
                      to={al.action_url}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 border border-slate-200 shadow-xs text-slate-800 inline-flex items-center gap-1 transition-colors"
                      title={al.action_label || 'View'}
                    >
                      <span>{al.action_label || 'View'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDismiss(al.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded transition-colors text-xs"
                    title="Dismiss alert"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
