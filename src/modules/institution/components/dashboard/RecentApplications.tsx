import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { RecentApplication } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

interface RecentApplicationsProps {
  applications: RecentApplication[];
  onViewApplication?: (app: RecentApplication) => void;
}

export const RecentApplications: React.FC<RecentApplicationsProps> = ({
  applications,
  onViewApplication,
}) => {
  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'success';
      case 'correction required':
        return 'danger';
      case 'under scrutiny':
      case 'under review':
        return 'primary';
      case 'evc':
      case 'evc scheduled':
        return 'info';
      case 'submitted':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recent Applications</h3>
          <p className="text-xs text-slate-500">Latest active requests and approvals</p>
        </div>
        <Link
          to="/institution/applications"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View all applications &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-6">Application ID</th>
              <th className="py-3 px-6">Application Type</th>
              <th className="py-3 px-6">Submitted Date</th>
              <th className="py-3 px-6">Current Stage</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No applications found.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-indigo-900">
                    {app.application_number}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">{app.application_type}</td>
                  <td className="py-3.5 px-6 text-slate-600">{app.submitted_date || 'Draft'}</td>
                  <td className="py-3.5 px-6 text-slate-600">{app.current_stage}</td>
                  <td className="py-3.5 px-6">
                    <Badge variant={getStatusVariant(app.status)} dot>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {onViewApplication ? (
                      <button
                        onClick={() => onViewApplication(app)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        View
                      </button>
                    ) : (
                      <Link
                        to={`/institution/applications?id=${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
