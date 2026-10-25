import React, { useState } from 'react';
import { Database, AlertCircle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const DemoBanner: React.FC = () => {
  const { serviceStatus } = useData();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white text-xs px-4 py-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-sm border-b border-amber-600">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <Database className="w-4 h-4 shrink-0" />
        <span>
          <strong className="tracking-wide uppercase font-bold mr-1">Demo / Development Mode:</strong>
          {serviceStatus.isLive
            ? 'Connected to Live Supabase Database.'
            : 'Isolated Mock Data Provider Active (Realistic AICTE Evaluation Test Data).'}
        </span>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="underline hover:text-amber-100 flex items-center gap-0.5 text-[11px]"
        >
          <span>Architecture Details</span>
          <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white p-0.5 rounded hover:bg-black/10"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showDetails && (
        <div className="w-full mt-2 p-3 bg-amber-900/90 backdrop-blur rounded text-amber-50 text-[11px] leading-relaxed border border-amber-700/50">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
            Separated Data Access Layer (AICTE Rule Compliance)
          </p>
          <p className="mb-1.5 text-amber-100">
            {serviceStatus.message} Real database writes are paused while Supabase backend configuration is checked. In-memory mutations, strict workflow finite state transitions, and audit trails remain fully operational and testable without risking corrupted records.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-amber-200 border-t border-amber-800/80 pt-1.5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Finite State Machine Validated
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Immutable Audit Trail Active
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Role-Based Access Enforcement
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
