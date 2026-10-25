import React, { useState, useEffect } from 'react';
import { applicationsService } from '../services/applicationsService';
import { ApplicationFull } from '../types';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { NewApplicationModal } from '../components/forms/NewApplicationModal';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<ApplicationFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationFull | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Correction submission state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const loadApps = async () => {
    setIsLoading(true);
    try {
      const data = await applicationsService.getApplications({
        status: statusFilter,
        search,
        institutionId: user?.id || user?.institutionCode,
      });
      setApps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApps();
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setIsSubmittingCorrection(true);
    try {
      const updated = await applicationsService.submitCorrection(selectedApp.id, correctionNotes);
      setSelectedApp(updated);
      setIsCorrectionModalOpen(false);
      setCorrectionNotes('');
      await loadApps();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'success';
      case 'correction required':
        return 'danger';
      case 'under scrutiny':
        return 'primary';
      case 'evc':
      case 'evc scheduled':
        return 'info';
      case 'document verification':
        return 'warning';
      case 'sac/shc review':
        return 'primary';
      case 'submitted':
        return 'warning';
      case 'rejected':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  const getDaysUntilDeadline = (deadlineStr?: string): number | null => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Application Management</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {apps.length} Total Applications
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track, verify, and submit AICTE statutory applications, course additions, and expansion requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Application
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, program or remarks..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Stage / Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Stages</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Scrutiny">Under Scrutiny</option>
            <option value="Correction Required">Correction Required</option>
            <option value="Document Verification">Document Verification</option>
            <option value="EVC Scheduled">EVC Scheduled</option>
            <option value="SAC/SHC Review">SAC/SHC Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadApps} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Application ID</th>
                <th className="py-3 px-6">Application Type</th>
                <th className="py-3 px-6">Submitted Date</th>
                <th className="py-3 px-6">Current Stage</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Correction / Deadline</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No applications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                apps.map((app) => {
                  const daysLeft = getDaysUntilDeadline(app.correction_deadline);
                  const isCorrection = app.status === 'Correction Required';

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCorrection ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6 font-mono font-bold text-indigo-900">
                        {app.application_number}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {app.application_type}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : <span className="text-slate-400 italic">Draft Preparation</span>}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">
                        {app.current_stage}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={getStatusVariant(app.status)} dot>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6">
                        {isCorrection && daysLeft !== null ? (
                          <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Due Today'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            isCorrection
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {isCorrection ? 'Review Deficiencies' : 'View Dossier'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Application Dossier Modal with Interactive Timeline */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Application Dossier — ${selectedApp.application_number}`}
          subtitle={selectedApp.application_type}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <span className="mt-1 inline-block">
                  <Badge variant={getStatusVariant(selectedApp.status)} dot>
                    {selectedApp.status}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stage</span>
                <span className="font-semibold text-slate-800 block mt-1 truncate">
                  {selectedApp.current_stage}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Cycle</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {selectedApp.academic_year}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted On</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {selectedApp.submitted_at
                    ? new Date(selectedApp.submitted_at).toLocaleDateString('en-GB')
                    : 'Draft'}
                </span>
              </div>
            </div>

            {/* Prominent Correction Required Alert & Deadline Banner */}
            {selectedApp.status === 'Correction Required' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Correction Required — Scrutiny Deficiency</span>
                  </div>
                  {selectedApp.correction_deadline && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-200 text-rose-900">
                      Deadline: {new Date(selectedApp.correction_deadline).toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-800 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-rose-200/60 font-medium">
                  {selectedApp.remarks}
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Submit Rectified Documents
                  </Button>
                </div>
              </div>
            )}

            {/* Remarks / Notes (when not in correction required) */}
            {selectedApp.status !== 'Correction Required' && selectedApp.remarks && (
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-slate-700">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">
                  Officer Remarks &amp; Updates
                </span>
                <p>{selectedApp.remarks}</p>
              </div>
            )}

            {/* Application Timeline Component */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">
                Application Workflow Timeline
              </h4>
              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(selectedApp.timeline || [
                  { stage: 'Draft Preparation', status: 'completed', date: 'Initiated' },
                  { stage: 'Scrutiny Committee Review', status: 'current', date: 'In Progress' },
                  { stage: 'Document Verification', status: 'pending' },
                  { stage: 'Final Sanction', status: 'pending' },
                ]).map((step, idx) => {
                  const isDone = step.status === 'completed';
                  const isCurrent = step.status === 'current';
                  const isAction = step.status === 'action_required';
                  const isRejected = step.status === 'rejected';

                  return (
                    <div key={idx} className="relative flex items-start gap-3">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ring-4 ring-white shrink-0 mt-0.5 z-10 ${
                          isDone
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-indigo-600 animate-pulse'
                            : isAction
                            ? 'bg-rose-500'
                            : isRejected
                            ? 'bg-red-600'
                            : 'bg-slate-300'
                        }`}
                      />
                      <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${
                              isDone
                                ? 'text-slate-800'
                                : isCurrent
                                ? 'text-indigo-700 font-bold'
                                : isAction
                                ? 'text-rose-700 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            {step.stage}
                          </span>
                          {step.date && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {step.date}
                            </span>
                          )}
                        </div>
                        {step.notes && (
                          <p className="text-[11px] text-slate-600 mt-1">{step.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit Correction Modal */}
      {isCorrectionModalOpen && selectedApp && (
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title={`Upload Correction — ${selectedApp.application_number}`}
          subtitle="Respond to Regional Scrutiny Deficiency"
          maxWidth="md"
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Correction Description &amp; Upload Reference <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Detail the corrections made, revised endorsement dates, or document reference numbers..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Attach Rectified Document (PDF &bull; Max 15MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                disabled={isSubmittingCorrection}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                isLoading={isSubmittingCorrection}
              >
                Submit Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={loadApps}
      />
    </div>
  );
};
