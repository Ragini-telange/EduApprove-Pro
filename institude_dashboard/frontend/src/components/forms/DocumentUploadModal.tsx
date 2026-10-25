import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDocumentType?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDocumentType = '',
}) => {
  const [docType, setDocType] = useState(defaultDocumentType || 'Lease Agreement');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = [
    'Lease Agreement',
    'Building Completion Certificate',
    'Fire Safety Certificate',
    'Affiliation Certificate',
    'Land Ownership Document',
    'Infrastructure Certificate',
    'Faculty Related Documents',
    'Anti-Ragging Committee Notification',
    'Other AICTE Required Documents',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Size check 15MB
      if (selected.size > 15 * 1024 * 1024) {
        setError('File size exceeds maximum allowed size of 15MB');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      if (expiryDate) {
        formData.append('expiry_date', expiryDate);
      }
      formData.append('file', file);

      await api.uploadDocument(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Institutional Document"
      subtitle="Secure AICTE SmartAssist Document Repository"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Document Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Certificate Expiry Date (if applicable)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">
            Leave blank for permanent statutory sanction letters.
          </p>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document File (PDF, JPG, PNG &bull; Max 15MB) <span className="text-rose-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <UploadCloud className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{file.name}</span>
                  <span className="text-slate-400 font-normal">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-indigo-700">Click to browse file</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports official scanned PDF documents with digital signature
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
