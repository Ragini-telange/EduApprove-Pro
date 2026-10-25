import React from 'react';
import type { 
  RegionalGeoMetric, 
  ApplicationRecord, 
  MapLayerId 
} from '../../types/authority';
import { 
  Building2, 
  UserCheck, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Filter
} from 'lucide-react';

interface RegionalDetailPanelProps {
  selectedMetric: RegionalGeoMetric | null;
  applications: ApplicationRecord[];
  activeLayer: MapLayerId;
  onSelectApplication: (app: ApplicationRecord) => void;
  onFilterByRegion: (regionName: string) => void;
}

export const RegionalDetailPanel: React.FC<RegionalDetailPanelProps> = ({
  selectedMetric,
  applications,
  activeLayer,
  onSelectApplication,
  onFilterByRegion,
}) => {
  if (!selectedMetric) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-700">No Region Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Click any regional pulse circle on the map above to view that regional jurisdiction’s case dossier, officer workload, and overdue alerts.
        </p>
      </div>
    );
  }

  // Filter applications belonging to this region
  const regionalApps = applications.filter(
    (app) => app.region.toLowerCase() === selectedMetric.regionName.toLowerCase()
  );

  const layerHealth = selectedMetric.layerHealth[activeLayer] || 'grey';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
      {/* Regional Office Banner */}
      <div className="p-5 bg-gradient-to-r from-aicte-900 via-aicte-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
              AICTE Regional Jurisdiction
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              layerHealth === 'green' ? 'bg-emerald-500 text-white' :
              layerHealth === 'amber' ? 'bg-amber-500 text-slate-950' :
              layerHealth === 'red' ? 'bg-rose-500 text-white' :
              'bg-slate-500 text-white'
            }`}>
              {layerHealth.toUpperCase()} ALERT LEVEL
            </span>
          </div>

          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <span>{selectedMetric.regionName} Regional Office</span>
            <span className="text-xs font-normal text-slate-300 font-mono">({selectedMetric.headquarters})</span>
          </h2>

          <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Jurisdiction: {selectedMetric.statesCovered.join(', ')}</span>
          </p>
        </div>

        {/* Assigned Officer Contact & Filter Shortcut */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs space-y-0.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedMetric.responsibleOfficer}</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{selectedMetric.officerEmail}</span>
            </div>
          </div>

          <button
            onClick={() => onFilterByRegion(selectedMetric.regionName)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Filter entire dashboard to only this region"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Dashboard</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="px-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Cases</div>
          <div className="text-xl font-bold text-slate-900">{selectedMetric.totalApplications}</div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-0.5">Pending Review</div>
          <div className="text-xl font-bold text-amber-900">{selectedMetric.pendingApplications}</div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-0.5">SLA Overdue</div>
          <div className="text-xl font-bold text-rose-700">{selectedMetric.overdueApplications}</div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 mb-0.5">EVC Delayed</div>
          <div className="text-xl font-bold text-purple-900">{selectedMetric.evcPendingOrDelayed}</div>
        </div>

        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-800 mb-0.5">Deficiencies</div>
          <div className="text-xl font-bold text-orange-900">{selectedMetric.complianceDeficiencies}</div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-0.5">Avg Days Cycle</div>
          <div className="text-xl font-bold text-emerald-900">{selectedMetric.avgProcessingDays} d</div>
        </div>
      </div>

      {/* Linked Case Applications Table */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-aicte-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Allocated Applications in {selectedMetric.regionName} Region ({regionalApps.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Click any row to open statutory case dossier
          </span>
        </div>

        {regionalApps.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
            No institutional applications on record for {selectedMetric.regionName} region under current filters.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Application Number</th>
                  <th className="py-2.5 px-3">Institution & State</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">SLA Health</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionalApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-aicte-900">
                      {app.applicationNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{app.institutionName}</div>
                      <div className="text-[11px] text-slate-500">{app.state} • Code: {app.instituteCode}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {app.applicationType}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded text-[11px]">
                        {app.currentStage}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        app.currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        app.currentStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        app.currentStatus === 'Pending HQ Approval' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.currentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.deadlineStatus === 'Overdue' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                        app.deadlineStatus === 'Approaching Deadline' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {app.deadlineStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectApplication(app);
                        }}
                        className="px-2.5 py-1 bg-aicte-900 hover:bg-aicte-800 text-white rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <span>Open Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
