import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { AuditEvent, AuditEventOrigin, AuditEventSource } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  TestTube,
  Clock,
  ArrowRight,
  Server,
  User,
  X,
  Layers,
  ListFilter,
  FileCheck2,
  CalendarCheck2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { dataService, refreshKey } = useData();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'official' | 'simulated'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  useEffect(() => {
    setIsLoading(true);
    dataService.getAuditLogs().then((res) => {
      // Ensure chronological ordering: newest timestamp first
      const sorted = [...res].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sorted);
      setIsLoading(false);
    });
  }, [dataService, refreshKey]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.applicationNumber.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.remarks.toLowerCase().includes(q) ||
          log.affectedRecord.toLowerCase().includes(q) ||
          (log.source && log.source.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Origin Filter (Official vs Simulated)
      if (originFilter === 'official') {
        if (log.origin === 'simulated_demo') return false;
      } else if (originFilter === 'simulated') {
        if (log.origin !== 'simulated_demo') return false;
      }

      // 3. Action Filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // 4. Source Filter
      if (sourceFilter !== 'all' && log.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, originFilter, actionFilter, sourceFilter]);

  // Unique actions and sources for filters
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  const uniqueSources = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.source).filter(Boolean))) as string[];
  }, [logs]);

  const originCounts = useMemo(() => {
    const official = logs.filter((l) => l.origin !== 'simulated_demo').length;
    const simulated = logs.filter((l) => l.origin === 'simulated_demo').length;
    return { total: logs.length, official, simulated };
  }, [logs]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('STATUS')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (action.includes('DOCUMENT') || action.includes('VERIFIED')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (action.includes('DEFICIENCY') || action.includes('CORRECTION')) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (action.includes('EVC')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (action.includes('LATE')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (action.includes('SIMULATED') || action.includes('TEST')) return 'bg-slate-100 text-slate-700 border-slate-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Immutable Regulatory Audit Trail
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cryptographically Verified Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official System of Record • Append-Only Chronicle of Every Scrutiny Action, State Transition & Committee Decision
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabular Ledger
          </button>
        </div>
      </div>

      {/* 2. Mandatory Trust & Immutability Notice (Section C & D requirement) */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-blue-50/50 to-slate-50 border border-emerald-200 rounded-2xl text-xs text-slate-800 flex items-start gap-3.5 shadow-2xs">
        <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <strong className="text-slate-900 font-bold text-xs uppercase tracking-wider">
              Cryptographically Sealed Audit Ledger:
            </strong>
            <span className="bg-emerald-200/70 text-emerald-900 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-300">
              AICTE National Governance Standard
            </span>
          </div>
          <p className="leading-relaxed text-slate-600">
            Audit entries are automatically generated by trusted backend logic upon verified state transitions and officer determinations. To preserve regulatory chain-of-custody, <strong>client browsers have zero permission to modify, overwrite, or delete official audit logs</strong>. Official records and synthetic test events are partitioned for transparency.
          </p>
        </div>
      </div>

      {/* 3. Search and Multi-Faceted Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by actor, action, case #, affected record, or remarks..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Type Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Action Types ({uniqueActions.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Source Dropdown */}
          {uniqueSources.length > 0 && (
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {uniqueSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Origin Partition Pills (Section C Requirement) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 text-[11px]">Event Origin Partition:</span>
            <button
              onClick={() => setOriginFilter('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                originFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({originCounts.total})
            </button>
            <button
              onClick={() => setOriginFilter('official')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                originFilter === 'official'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              Official Regulatory Records ({originCounts.official})
            </button>
            <button
              onClick={() => setOriginFilter('simulated')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                originFilter === 'simulated'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TestTube className="w-3 h-3" />
              Simulated / Demo Events ({originCounts.simulated})
            </button>
          </div>

          <div className="text-slate-400 text-[11px]">
            Showing <strong>{filteredLogs.length}</strong> chronologically sorted entries
          </div>
        </div>
      </div>

      {/* 4. Audit Log View: Timeline or Table */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Reading immutable ledger from regional audit store...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">No audit records match filters</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search query or partition selection.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* CHRONOLOGICAL TIMELINE VIEW */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredLogs.map((log) => {
            const isOfficial = log.origin !== 'simulated_demo';
            const dateObj = new Date(log.timestamp);

            return (
              <div key={log.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                    isOfficial
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-slate-400 text-slate-500'
                  }`}
                >
                  {isOfficial ? <Lock className="w-3 h-3" /> : <TestTube className="w-3 h-3" />}
                </div>

                {/* Audit Card */}
                <Card className="p-4 sm:p-5 border-slate-200 shadow-2xs hover:border-slate-300 transition-all text-xs space-y-2.5">
                  {/* Top Bar: Action, Origin Badge, Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-mono font-bold px-2.5 py-0.5 rounded-md border text-xs ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>

                      {/* Origin Badge */}
                      {isOfficial ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Lock className="w-2.5 h-2.5 text-emerald-600" />
                          Official Regulatory Record
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                          <TestTube className="w-2.5 h-2.5 text-slate-500" />
                          Demo / Simulated Event
                        </span>
                      )}

                      {/* Source badge */}
                      {log.source && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Source: {log.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-sans">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dateObj.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actor and Affected Record Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Authorised Actor: <strong>{log.actorName}</strong> (
                        <span className="capitalize">{log.actorRole.replace(/_/g, ' ')}</span>)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Affected Record: </span>
                      <strong className="text-slate-800 font-mono text-[11px]">{log.affectedRecord}</strong>
                    </div>
                  </div>

                  {/* State Transition (if applicable) */}
                  {log.previousState && log.previousState !== 'none' && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">State Transition:</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {log.previousState}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                        {log.newState}
                      </span>
                    </div>
                  )}

                  {/* Officer Remarks / Substantive Justification */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 leading-relaxed font-sans">
                    <strong className="font-semibold text-slate-900 block mb-0.5">
                      Substantive Remarks / Determination:
                    </strong>
                    "{log.remarks}"
                  </div>

                  {/* IP Address and Case Number Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>IP Log: {log.ipAddress || 'Internal Microservice Gateway'}</span>
                    <span>Application: {log.applicationNumber || 'N/A'}</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABULAR LEDGER VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Origin & Source</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Affected Record</th>
                  <th className="py-3 px-4">Transition</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isOfficial = log.origin !== 'simulated_demo';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 text-[11px] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-bold">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[10px] border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isOfficial ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            Official
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <TestTube className="w-3 h-3 text-slate-400" />
                            Simulated
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono">{log.source || 'N/A'}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{log.actorRole.replace(/_/g, ' ')}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 max-w-xs truncate">
                        {log.affectedRecord}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px]">
                        {log.previousState && (
                          <>
                            <span className="text-slate-400">{log.previousState}</span>
                            <span className="text-slate-300 mx-1">&rarr;</span>
                          </>
                        )}
                        <span className="font-bold text-slate-800">{log.newState}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.remarks}>
                        {log.remarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
