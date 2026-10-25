import React, { useState, useEffect } from 'react';
import { documentsService } from '../services/documentsService';
import { DocumentFull } from '../types';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { DocumentUploadModal } from '../components/forms/DocumentUploadModal';
import {
  Upload,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [replacingDoc, setReplacingDoc] = useState<DocumentFull | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementExpiry, setReplacementExpiry] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // View detail modal
  const [viewingDoc, setViewingDoc] = useState<DocumentFull | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const data = await documentsService.getDocuments({
        type: search,
        status: statusFilter,
        institutionId: user?.id || user?.institutionCode,
      });
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingDoc || !replacementFile) {
      setReplaceError('Please select a replacement file.');
      return;
    }

    setIsReplacing(true);
    setReplaceError(null);
    try {
      await documentsService.replaceDocument(
        replacingDoc.id,
        replacementFile,
        replacementExpiry || undefined
      );
      setReplacingDoc(null);
      setReplacementFile(null);
      setReplacementExpiry('');
      await loadDocs();
    } catch (err: any) {
      setReplaceError(err.message || 'Failed to replace document.');
    } finally {
      setIsReplacing(false);
    }
  };

  const getExpiryBadge = (
    status: DocumentFull['expiry_status']
  ): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'Valid':
        return { label: 'Valid', variant: 'success' };
      case 'Expiring Soon':
        return { label: 'Expiring Soon', variant: 'warning' };
      case 'Critical':
        return { label: 'Critical Expiry', variant: 'danger' };
      case 'Expired':
        return { label: 'Expired', variant: 'critical' };
      case 'Verification Pending':
        return { label: 'Verification Pending', variant: 'info' };
      default:
        return { label: status || 'Permanent', variant: 'info' };
    }
  };

  // Warning metrics
  const expiredCount = docs.filter((d) => d.expiry_status === 'Expired').length;
  const criticalCount = docs.filter((d) => d.expiry_status === 'Critical').length;
  const expiringSoonCount = docs.filter((d) => d.expiry_status === 'Expiring Soon').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Institutional Document Repository</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {docs.length} Documents Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage statutory certificates, land title deeds, building completion NOCs, and AICTE mandatory records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/institution/documents/passport"
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Smart Document Passport</span>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Prominent Expiry Warning Banner (If any expired or critical documents) */}
      {(expiredCount > 0 || criticalCount > 0) && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-rose-950">
                Action Required: Urgent Document Renewal Alert
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                You have <strong>{expiredCount} expired certificate(s)</strong> and{' '}
                <strong>{criticalCount} certificate(s)</strong> within the critical 7-day expiration window.
                Unrenewed statutory certificates may impact institutional approval standing.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('Expired')}
            className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            View Urgent Documents
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document type, title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status / State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Documents</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon (&le;30 days)</option>
            <option value="Critical">Critical (&le;7 days)</option>
            <option value="Expired">Expired</option>
            <option value="Verification Pending">Verification Pending</option>
            <option value="Verified">Verified</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadDocs} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Document Type</th>
                <th className="py-3 px-6">File Name</th>
                <th className="py-3 px-6">Uploaded Date</th>
                <th className="py-3 px-6">Expiry Date</th>
                <th className="py-3 px-6">Expiry Status</th>
                <th className="py-3 px-6">Verification</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading institutional documents...
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No documents found matching the selected filters.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const expBadge = getExpiryBadge(doc.expiry_status);
                  const isExpired = doc.expiry_status === 'Expired';
                  const isCritical = doc.expiry_status === 'Critical';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired
                          ? 'bg-red-50/20'
                          : isCritical
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="hover:text-indigo-700 hover:underline text-left block"
                        >
                          {doc.document_type}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-600 truncate max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.document_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {new Date(doc.uploaded_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">
                        {doc.expiry_date || (
                          <span className="text-slate-400 italic font-normal">Permanent</span>
                        )}
                        {doc.days_remaining !== undefined && doc.days_remaining !== null && (
                          <span
                            className={`block text-[10px] mt-0.5 ${
                              doc.days_remaining < 0
                                ? 'text-rose-600 font-bold'
                                : doc.days_remaining <= 7
                                ? 'text-red-600 font-bold'
                                : doc.days_remaining <= 30
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {doc.days_remaining < 0
                              ? `Expired ${Math.abs(doc.days_remaining)}d ago`
                              : `${doc.days_remaining}d remaining`}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={expBadge.variant} dot>
                          {expBadge.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge
                          variant={
                            doc.verification_status === 'Verified'
                              ? 'success'
                              : doc.verification_status === 'Expired'
                              ? 'critical'
                              : doc.verification_status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {doc.verification_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Replace / Renew Document button */}
                          <button
                            onClick={() => {
                              setReplacingDoc(doc);
                              setReplacementExpiry(doc.expiry_date || '');
                              setReplaceError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Replace or renew document"
                          >
                            <RotateCw className="w-3 h-3 text-slate-500" />
                            <span>Replace</span>
                          </button>

                          {/* Download / View action */}
                          <a
                            href={doc.file_url || `/api/institution/documents/download/${doc.id}`}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replace Document Modal */}
      {replacingDoc && (
        <Modal
          isOpen={Boolean(replacingDoc)}
          onClose={() => setReplacingDoc(null)}
          title={`Replace Document — ${replacingDoc.document_type}`}
          subtitle="Upload updated statutory renewal certificate"
          maxWidth="md"
        >
          <form onSubmit={handleReplaceSubmit} className="space-y-4 text-xs">
            {replaceError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{replaceError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Existing Version</span>
              <p className="font-semibold text-slate-800">{replacingDoc.document_name}</p>
              <p className="text-[11px] text-slate-500">
                Uploaded: {new Date(replacingDoc.uploaded_at).toLocaleDateString('en-GB')} &bull; Status:{' '}
                {replacingDoc.verification_status}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Certificate Expiry Date
              </label>
              <input
                type="date"
                value={replacementExpiry}
                onChange={(e) => setReplacementExpiry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Upload New File (PDF, JPG, PNG &bull; Max 15MB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReplacementFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setReplacingDoc(null)}
                disabled={isReplacing}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isReplacing}>
                Upload Replacement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Detail Modal */}
      {viewingDoc && (
        <Modal
          isOpen={Boolean(viewingDoc)}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.document_type}
          subtitle={`Credential File: ${viewingDoc.document_name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Validity State</span>
                <span className="mt-1 inline-block">
                  <Badge variant={getExpiryBadge(viewingDoc.expiry_status).variant} dot>
                    {getExpiryBadge(viewingDoc.expiry_status).label}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Verification Authority</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {viewingDoc.verified_by || 'Verification Pending'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Expiry Date</span>
                <span className="font-semibold text-slate-800 block mt-1 font-mono">
                  {viewingDoc.expiry_date || 'Permanent (No Expiry)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">File Size</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {viewingDoc.file_size_kb} KB
                </span>
              </div>
            </div>

            {/* Version History snippet */}
            {viewingDoc.upload_history && viewingDoc.upload_history.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  Version Upload History
                </h4>
                <div className="space-y-1.5">
                  {viewingDoc.upload_history.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">Version {h.version}</span>
                        <span className="text-slate-400 mx-1.5">&bull;</span>
                        <span className="font-mono text-slate-600">{h.file_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(h.uploaded_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDocs}
      />
    </div>
  );
};
