import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Application, AppNotification } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Flame,
  FileCheck,
  Send,
  Eye,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey } = useData();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      dataService.getApplications(),
      dataService.getNotifications(user.role, user.id),
    ]).then(([apps, notifs]) => {
      setApplications(apps);
      setNotifications(notifs);
      setIsLoading(false);
    });
  }, [dataService, user.role, user.id, refreshKey]);

  // Compute KPI statistics
  const assignedCases = applications.filter(
    (a) => a.assignedOfficerId === user.id || !a.assignedOfficerId
  );
  const awaitingScrutiny = applications.filter((a) => a.status === 'submitted');
  const underScrutiny = applications.filter((a) => a.status === 'under_scrutiny');
  const correctionAwaiting = applications.filter((a) => a.status === 'correction_required');
  const awaitingReScrutiny = applications.filter((a) => a.status === 'resubmitted' || a.status === 'under_re_scrutiny');
  const pendingEVC = applications.filter((a) => a.status === 'pending_evc' || a.status === 'evc_scheduled');

  const upcomingDeadlines = applications.filter((a) => {
    const deadline = new Date(a.deadlineDate).getTime();
    const now = new Date('2026-10-22').getTime();
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && a.status !== 'completed' && a.status !== 'rejected';
  });

  return (
    <div className="space-y-6">
      {/* Officer Header / Welcome Banner */}
      <div className="bg-gradient-to-r from-aicte-navy via-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <FileCheck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {user.regionalOffice}
              </span>
              <span className="text-xs text-slate-300 font-mono">Desk #03 • Officer ID: {user.badgeNumber}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5">
              Welcome, Officer {user.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              AICTE Western Region Scrutiny Desk • Active academic scrutiny cycle for AY 2026-27. You have{' '}
              <strong className="text-white font-semibold">{awaitingScrutiny.length} new cases awaiting scrutiny</strong> and{' '}
              <strong className="text-amber-300 font-semibold">{upcomingDeadlines.length} approaching statutory deadlines</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/regional-officer/applications">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 shadow">
                <span>View Assigned Queue</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Assigned Cases</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{assignedCases.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{underScrutiny.length} in progress</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Awaiting Scrutiny</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{awaitingScrutiny.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending initial review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Correction Requests</span>
            <Send className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{correctionAwaiting.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">With institutions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Awaiting Re-Scrutiny</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{awaitingReScrutiny.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Resubmitted cases</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">EVC Pipeline</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600">{pendingEVC.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">1 scheduled, 1 rec.</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Urgent Deadlines</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{upcomingDeadlines.length}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">&lt; 7 days remaining</div>
        </div>
      </div>

      {/* Main Content Layout: Active Cases & Statutory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Applications Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Assigned Institutional Applications"
            subtitle="Western Regional Office Jurisdiction (Maharashtra, Goa, Gujarat)"
            action={
              <Link to="/regional-officer/applications">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <span>View All ({applications.length})</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            }
          >
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading assigned cases...</div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No applications assigned to your desk.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {app.applicationNumber}
                        </span>
                        <Badge status={app.status} size="sm" />
                        {app.priority === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            URGENT
                          </span>
                        )}
                        {app.priority === 'critical' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold animate-pulse">
                            CRITICAL
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{app.institution.name}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{app.institution.city}, {app.institution.state}</span>
                        <span>•</span>
                        <span className="capitalize">{app.type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" /> Deadline: {app.deadlineDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/regional-officer/applications/${app.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          <span>Scrutinize</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Workload & Delay Indicator Widget */}
          <div className="bg-slate-900 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <TrendingUp className="w-4 h-4" />
                <span>Statutory Compliance Monitor</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As per AICTE Approval Process Handbook (APH 2026-27), scrutiny reports must be concluded within 15 statutory working days of application assignment.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400">Regional On-Time Rate</div>
                <div className="text-lg font-bold text-emerald-400">96.4% Compliant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Statutory Alerts & Compliance Deadlines */}
        <div className="space-y-4">
          <Card title="Immediate Statutory Actions" subtitle="High priority alerts requiring officer intervention">
            <div className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border text-xs ${
                    n.severity === 'critical'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : n.severity === 'urgent'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      {n.severity === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      {n.severity === 'urgent' && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {n.title}
                    </span>
                    <span className="text-[10px] opacity-70 shrink-0 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed opacity-90">{n.message}</p>
                  {n.actionUrl && (
                    <div className="mt-2 text-right">
                      <Link to={n.actionUrl} className="font-semibold text-blue-600 hover:underline text-[11px]">
                        Take Action &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Documents Approaching Expiry */}
          <Card title="Expiring Document Warnings" subtitle="Institutional safety and NOC certificates">
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-900">Fire Safety NOC (PMC)</div>
                  <div className="text-[11px] text-amber-700">PIATR Pune • Expired 14 Oct 2026</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">Lapsed</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Structural Stability Certificate</div>
                  <div className="text-[11px] text-slate-600">PIATR Pune • Expiry: 15 Nov 2026</div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">Due 24d</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}
