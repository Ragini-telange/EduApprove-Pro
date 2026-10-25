import React, { useState } from 'react';
import type { ApplicationRecord } from '../../types/authority';
import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  User, 
  ArrowUpDown, 
  ChevronRight
} from 'lucide-react';

interface ApplicationOverviewTableProps {
  applications: ApplicationRecord[];
  onSelectApplication: (app: ApplicationRecord) => void;
  isLoading?: boolean;
}

export const ApplicationOverviewTable: React.FC<ApplicationOverviewTableProps> = ({
  applications,
  onSelectApplication,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<keyof ApplicationRecord>('submittedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ApplicationRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Scrutiny':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Deficiency Communicated':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Pending HQ Approval':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse';
      case 'RO Recommended':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EVC Scheduled':
      case 'EVC Report Submitted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDeadlineBadge = (status: string, deadlineDate: string) => {
    if (status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          Overdue ({deadlineDate})
        </span>
      );
    }
    if (status === 'Approaching Deadline') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          Due Soon ({deadlineDate})
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-600">
        {deadlineDate}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded border border-slate-100"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-slate-900">
            Authoritative Applications Registry ({sortedApplications.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Click any row to open the complete case dossier & statutory action panel
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('applicationNumber')}>
                <div className="flex items-center gap-1">
                  Application ID <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('institutionName')}>
                <div className="flex items-center gap-1">
                  Institution & Region <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">Type</th>
              <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('currentStage')}>
                <div className="flex items-center gap-1">
                  Stage & Days <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">Assigned Officer</th>
              <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('submittedDate')}>
                <div className="flex items-center gap-1">
                  Submitted <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('deadlineDate')}>
                <div className="flex items-center gap-1">
                  Deadline Status <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-center">Status</th>
              <th className="py-3 px-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {sortedApplications.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No applications found</p>
                    <p className="text-xs text-slate-400">
                      Try relaxing your filter parameters or search term.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedApplications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className={`hover:bg-amber-50/40 transition-colors cursor-pointer group ${
                    app.isEscalated ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Application ID */}
                  <td className="py-3 px-3.5 font-mono font-semibold text-aicte-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {app.isEscalated && (
                        <span title="Case escalated to Central Bureau" className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                      )}
                      <span>{app.applicationNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block">
                      Code: {app.instituteCode}
                    </span>
                  </td>

                  {/* Institution & Region */}
                  <td className="py-3 px-3.5 max-w-[220px]">
                    <div className="font-semibold text-slate-900 truncate" title={app.institutionName}>
                      {app.institutionName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="font-medium text-slate-700">{app.region} Region</span>
                      <span>•</span>
                      <span>{app.state}</span>
                    </div>
                  </td>

                  {/* Application Type */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                      {app.applicationType}
                    </span>
                  </td>

                  {/* Current Stage */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{app.currentStage}</div>
                    <div className="text-[10px] text-slate-400">
                      {app.daysInCurrentStage} days at this stage
                    </div>
                  </td>

                  {/* Assigned Officer */}
                  <td className="py-3 px-3.5 text-slate-600 max-w-[150px]">
                    <div className="flex items-center gap-1 truncate" title={app.assignedOfficer}>
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{app.assignedOfficer}</span>
                    </div>
                    {app.responsibleTeam && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {app.responsibleTeam}
                      </span>
                    )}
                  </td>

                  {/* Submitted Date */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    {app.submittedDate}
                  </td>

                  {/* Deadline Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getDeadlineBadge(app.deadlineStatus, app.deadlineDate)}
                  </td>

                  {/* Current Status Badge */}
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(app.currentStatus)}`}>
                      {app.currentStatus}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectApplication(app);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-aicte-900 hover:text-white transition-all text-xs font-medium"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Showing {sortedApplications.length} of {applications.length} total applications
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Escalated Cases
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Approved Cases
          </span>
        </div>
      </div>
    </div>
  );
};
