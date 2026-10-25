import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Application, ApplicationStatus, ApplicationType } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Search,
  Filter,
  Eye,
  Building,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const ApplicationListView: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    setIsLoading(true);
    dataService.getApplications().then((apps) => {
      setApplications(apps);
      setIsLoading(false);
    });
  }, [dataService, refreshKey]);

  // Client filter
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (typeFilter !== 'all' && app.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && app.priority !== priorityFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNum = app.applicationNumber.toLowerCase().includes(q);
      const matchInst = app.institution.name.toLowerCase().includes(q);
      const matchCity = app.institution.city.toLowerCase().includes(q);
      const matchPermId = app.institution.aictePermanentId.toLowerCase().includes(q);
      if (!matchNum && !matchInst && !matchCity && !matchPermId) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Application Scrutiny Management
            </h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {filteredApps.length} Cases
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Western Regional Office Queue • Scrutiny, Deficiencies, and Compliance Review
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => triggerRefresh()}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, institute name, PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            >
              <option value="all">All Regulatory Statuses</option>
              <option value="submitted">Submitted (Awaiting Initial Scrutiny)</option>
              <option value="under_scrutiny">Under Scrutiny</option>
              <option value="correction_required">Correction Required (With College)</option>
              <option value="resubmitted">Resubmitted (Awaiting Re-Scrutiny)</option>
              <option value="under_re_scrutiny">Under Re-Scrutiny</option>
              <option value="pending_evc">Pending EVC Visit</option>
              <option value="evc_scheduled">EVC Scheduled</option>
              <option value="under_next_stage">Under Bureau Review</option>
              <option value="completed">Completed / Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Application Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            >
              <option value="all">All Application Types</option>
              <option value="new_institution">Establishment of New Institution</option>
              <option value="extension_of_approval">Extension of Approval (EoA)</option>
              <option value="increase_in_intake">Increase in Intake / Additional Course</option>
              <option value="change_of_site">Change of Site / Location</option>
              <option value="closure_of_course">Closure of Course</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            >
              <option value="all">All Priority Levels</option>
              <option value="critical">Critical Deadline</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No applications found</h4>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Application Details</th>
                  <th className="py-3 px-4">Institution & Region</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Statutory Deadline</th>
                  <th className="py-3 px-4">Assigned RO</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-900">{app.applicationNumber}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>PID: {app.institution.aictePermanentId}</span>
                        <span>•</span>
                        <span>AY {app.academicYear}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={app.institution.name}>
                        {app.institution.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>{app.institution.city}, {app.institution.state}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                          {app.institution.institutionType}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize text-slate-700 font-medium">
                        {app.type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={app.status} size="sm" />
                      {app.deficiencyCount > 0 && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-1">
                          {app.deficiencyCount} deficiency recorded
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-medium text-slate-800">{app.deadlineDate}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {app.priority === 'urgent' && <span className="text-amber-600 font-semibold">Priority Case</span>}
                        {app.priority === 'critical' && <span className="text-rose-600 font-bold">Urgent Review</span>}
                        {app.priority === 'normal' && <span>Standard 15-day window</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{app.assignedOfficerName || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/regional-officer/applications/${app.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          <span>Review Case</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
