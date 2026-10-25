import React, { useState, useEffect } from 'react';
import { complianceService } from '../services/complianceService';
import { ComplianceRequirement, ComplianceSummaryData } from '../types';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  Calendar,
  Filter,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CompliancePage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ComplianceSummaryData | null>(null);
  const [reqs, setReqs] = useState<ComplianceRequirement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [submittingReq, setSubmittingReq] = useState<ComplianceRequirement | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumData, reqsData] = await Promise.all([
        complianceService.getComplianceSummary(user?.id || user?.institutionCode),
        complianceService.getComplianceRequirements({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          institutionId: user?.id || user?.institutionCode,
        }),
      ]);
      setSummary(sumData);
      setReqs(reqsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingReq) return;

    setIsSubmitting(true);
    try {
      await complianceService.submitComplianceRequirement(submittingReq.id, remarks);
      setSubmittingReq(null);
      setRemarks('');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['all', 'Faculty', 'Infrastructure', 'Academic', 'Governance', 'Finance'];

  const getStatusBadge = (status: string): BadgeVariant => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'success';
      case 'submitted':
        return 'info';
      case 'overdue':
        return 'critical';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overall Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">AICTE Regulatory Compliance Center</h2>
            <p className="text-xs text-slate-500 mt-1">
              Statutory institutional undertakings, faculty-to-student ratios, NDLI digital library and anti-ragging compliances.
            </p>
          </div>

          {summary && (
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Completed Progress</span>
                <p className="text-lg font-extrabold text-indigo-700">
                  {summary.completed_requirements} / {summary.total_requirements} ({summary.progress_percentage}%)
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-700 bg-white shadow-xs">
                {Math.round(summary.progress_percentage)}%
              </div>
            </div>
          )}
        </div>

        {/* 4 Metrics Badges: Total, Completed, Pending, Overdue */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
            <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {summary.total_requirements}
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Total Requirements</p>
                <p className="text-[11px] text-indigo-700">AICTE Handbook</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {summary.completed_requirements}
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">Completed &amp; Verified</p>
                <p className="text-[11px] text-emerald-700">In full compliance</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                {summary.pending_requirements}
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">Pending Submission</p>
                <p className="text-[11px] text-amber-700">Upcoming cycle</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                {summary.overdue_requirements}
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950">Overdue Obligations</p>
                <p className="text-[11px] text-rose-700">Action immediately</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Requirements' : cat}
          </button>
        ))}
      </div>

      {/* Compliance Requirements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Requirement Name</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Statutory Due Date</th>
                <th className="py-3 px-6">Submission Status</th>
                <th className="py-3 px-6">Remarks / Council Notes</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading compliance requirements...
                  </td>
                </tr>
              ) : reqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No requirements found for this category.
                  </td>
                </tr>
              ) : (
                reqs.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 max-w-sm">
                      {req.requirement_name}
                      {req.description && (
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{req.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {req.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.due_date}</span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          req.days_remaining < 0
                            ? 'text-rose-600 font-bold'
                            : req.days_remaining <= 7
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {req.days_remaining < 0
                          ? `Overdue by ${Math.abs(req.days_remaining)} days`
                          : `${req.days_remaining} days remaining`}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={getStatusBadge(req.status)} dot>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate">
                      {req.remarks || <span className="text-slate-400 italic">No deficiency remarks</span>}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {req.status === 'Verified' ? (
                        <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Complied
                        </span>
                      ) : (
                        <button
                          onClick={() => setSubmittingReq(req)}
                          className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          Submit Proof
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Undertaking Modal */}
      {submittingReq && (
        <Modal
          isOpen={Boolean(submittingReq)}
          onClose={() => setSubmittingReq(null)}
          title="Submit Compliance Undertaking"
          subtitle={submittingReq.requirement_name}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Undertaking / Evidence Reference <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter council order reference, portal synchronization stamp, or committee sign-off details..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Attach Supporting PDF Certificate (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
              By submitting, the institution declares that the provided statutory compliance proof conforms to
              AICTE Approval Process Handbook (APH) norms.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setSubmittingReq(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Submit to Bureau
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
