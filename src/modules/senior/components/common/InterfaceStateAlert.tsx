import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StateAlertProps {
  type: 'loading' | 'empty' | 'error' | 'permission_denied' | 'success_refresh' | 'data_source_badge';
  message?: string;
  onRetry?: () => void;
  onResetFilters?: () => void;
  dataSource?: 'supabase' | 'authoritative_fallback';
}

export const InterfaceStateAlert: React.FC<StateAlertProps> = ({
  type,
  message,
  onRetry,
  dataSource,
}) => {
  const { role, setRole } = useAuth();

  if (type === 'data_source_badge') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
        <Database className="w-3.5 h-3.5 text-aicte-900" />
        <span className="text-slate-600">Active Source:</span>
        {dataSource === 'supabase' ? (
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            Live Supabase Cluster
          </span>
        ) : (
          <span className="font-semibold text-blue-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            Authoritative AICTE Records (Synchronized)
          </span>
        )}
      </div>
    );
  }

  if (type === 'permission_denied') {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-rose-950">
          Access Restricted — Senior Authority Role Required
        </h3>
        <p className="text-xs text-rose-800 mt-2 leading-relaxed">
          The Senior Authority Dashboard contains sensitive pan-India institutional records, statutory approval seals, and regional escalation directives. Your active role ({role}) does not have Central Bureau clearance.
        </p>
        <div className="mt-4 pt-3 border-t border-rose-200 flex justify-center gap-3">
          <button
            onClick={() => setRole('bureau_officer')}
            className="px-4 py-2 bg-aicte-900 text-white rounded-lg text-xs font-semibold hover:bg-aicte-800 transition-colors shadow"
          >
            Switch to Senior Authority (Janhavi) Role
          </button>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{message || 'Unable to retrieve records from backend. Please verify network or Supabase credentials.'}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-white border border-red-300 hover:bg-red-100 rounded text-red-800 font-semibold transition-colors"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (type === 'success_refresh') {
    return (
      <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-800 flex items-center space-x-2 animate-subtle">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">{message || 'Dashboard state refreshed successfully with latest authoritative records.'}</span>
      </div>
    );
  }

  return null;
};
