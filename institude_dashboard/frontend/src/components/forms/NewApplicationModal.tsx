import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FilePlus, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [appType, setAppType] = useState('Extension of Approval');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applicationTypes = [
    'Extension of Approval',
    'Increase in Intake',
    'Course Extension',
    'Introduction of New Course (Robotics/AI)',
    'Conversion of Diploma to Degree',
    'Introduction of Supernumerary Seats',
    'Collaborative Program with Foreign University',
    'Establishment of Incubation Center',
    'Change of Name of Institution',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.createApplication({
        application_type: appType,
        remarks: remarks || `Initiated application for ${appType} (${academicYear}).`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New AICTE Application"
      subtitle="Academic Year 2026-2027 Workflow Automation"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Application Category / Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={appType}
            onChange={(e) => setAppType(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {applicationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Institutional Justification & Remarks
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Brief rationale, resolution reference or governing council note..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Initiate Draft
          </Button>
        </div>
      </form>
    </Modal>
  );
};
