import React, { useState, useEffect } from 'react';
import { documentsService } from '../services/documentsService';
import { DocumentPassportItem } from '../types';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DocumentUploadModal } from '../components/forms/DocumentUploadModal';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
  Calendar,
  Lock,
  ExternalLink,
  History,
  CheckCircle,
  FileText,
  Search,
  X,
  FileCheck,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PassportPage: React.FC = () => {
  const { user } = useAuth();
  const [passportDocs, setPassportDocs] = useState<DocumentPassportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | undefined>();
  const [historyModalDoc, setHistoryModalDoc] = useState<DocumentPassportItem | null>(null);

  const loadPassport = async () => {
    setIsLoading(true);
    try {
      const data = await documentsService.getDocumentPassport(user?.id || user?.institutionCode);
      setPassportDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, []);

  const getExpiryBadge = (
    status: DocumentPassportItem['expiry_status']
  ): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'Valid':
        return { label: 'Valid & Verified', variant: 'success' };
      case 'Expiring Soon':
        return { label: 'Expiring Soon', variant: 'warning' };
      case 'Critical':
        return { label: 'Critical Renewal Needed', variant: 'danger' };
      case 'Expired':
        return { label: 'Statutory Expired', variant: 'critical' };
      case 'Verification Pending':
        return { label: 'Verification Pending', variant: 'info' };
      default:
        return { label: status || 'Permanent Record', variant: 'info' };
    }
  };

  const getRenewalBadge = (
    status?: DocumentPassportItem['renewal_status'],
    expiryStatus?: DocumentPassportItem['expiry_status']
  ): { label: string; variant: BadgeVariant } => {
    if (status === 'Renewal Due' || expiryStatus === 'Critical' || expiryStatus === 'Expired') {
      return { label: 'Renewal Due', variant: 'danger' };
    }
    if (status === 'Renewal Submitted') {
      return { label: 'Renewal Submitted', variant: 'warning' };
    }
    if (status === 'Not Applicable' || expiryStatus === 'Permanent') {
      return { label: 'Permanent Record', variant: 'neutral' };
    }
    return { label: 'Up to Date', variant: 'success' };
  };

  const filteredDocs = passportDocs.filter((d) =>
    d.document_type.toLowerCase().includes(search.toLowerCase()) ||
    d.document_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.document_code && d.document_code.toLowerCase().includes(search.toLowerCase())) ||
    (d.application_number && d.application_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
            <ShieldCheck className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Smart Document Passport</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                AICTE Official Passport
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
              Institutional statutory credential passport with complete cryptographic audit trail,
              multi-cycle upload history, renewal status, and statutory verification logs.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedDocType(undefined);
            setIsUploadOpen(true);
          }}
          leftIcon={<Upload className="w-4 h-4" />}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          Renew Credential
        </Button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter passport by credential name, code, or application..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="px-2.5 py-1 bg-slate-100 rounded-md">Total: {passportDocs.length}</span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
            Verified: {passportDocs.filter(d => d.verification_status === 'Verified').length}
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md">
            Renewal Due: {passportDocs.filter(d => d.expiry_status === 'Critical' || d.expiry_status === 'Expired').length}
          </span>
        </div>
      </div>

      {/* Grid of Passport Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <p className="text-xs text-slate-400 p-8 col-span-3 text-center">Loading passport credentials...</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-xs text-slate-400 p-8 col-span-3 text-center">No passport credentials match the filter.</p>
        ) : (
          filteredDocs.map((doc) => {
            const expiryBadge = getExpiryBadge(doc.expiry_status);
            const renewalBadge = getRenewalBadge(doc.renewal_status, doc.expiry_status);
            const isCritical = doc.expiry_status === 'Critical' || doc.expiry_status === 'Expired';
            const uploadDate = doc.uploaded_at
              ? new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Initial Cycle';

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl border shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between ${
                  isCritical ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* 1. Document Identity Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {doc.document_code || `PASSPORT #${doc.id.toString().padStart(4, '0')}`}
                    </span>
                    <Badge variant={expiryBadge.variant} dot>
                      {expiryBadge.label}
                    </Badge>
                  </div>

                  {/* Title & Filename */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.document_type}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1 truncate">{doc.document_name}</p>

                  {/* 2. Application & 3. Upload Date details */}
                  <div className="mt-3 py-2 px-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Application:</span>
                    <span className="font-mono font-bold text-indigo-700 truncate max-w-[170px]">
                      {doc.application_number || doc.application_id || 'AICTE/2026-27/1-9382104921'}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    {/* Upload Date */}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Upload Date:</span>
                      <span className="font-medium text-slate-800">{uploadDate}</span>
                    </div>

                    {/* Expiry Date */}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expiry Date:</span>
                      <span className="font-mono text-slate-800">
                        {doc.expiry_date || 'Permanent (No Expiry)'}
                      </span>
                    </div>

                    {/* Verification Status */}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Status:</span>
                      <span
                        className={`font-semibold ${
                          doc.verification_status === 'Verified'
                            ? 'text-emerald-700'
                            : doc.verification_status === 'Expired'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {doc.verification_status}
                      </span>
                    </div>

                    {/* Renewal Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Renewal Status:</span>
                      <Badge variant={renewalBadge.variant} size="sm">
                        {renewalBadge.label}
                      </Badge>
                    </div>

                    {/* Days Remaining / Validity */}
                    {doc.days_remaining !== undefined && doc.days_remaining !== null && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Validity:</span>
                        <span
                          className={`font-bold ${
                            doc.days_remaining < 0
                              ? 'text-rose-600'
                              : doc.days_remaining <= 30
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {doc.days_remaining < 0
                            ? `Expired ${Math.abs(doc.days_remaining)} days ago`
                            : `${doc.days_remaining} days left`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 7. Document History Snippets */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <button
                        onClick={() => setHistoryModalDoc(doc)}
                        className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-semibold transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Version History ({doc.upload_history?.length || 1})</span>
                      </button>
                      <span className="text-slate-400 font-mono text-[10px]">
                        v{doc.upload_history?.length || 1}.0
                      </span>
                    </div>

                    {doc.verification_history && doc.verification_history.length > 0 && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audit Sign-off:</span>
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {doc.verification_history[0].verified_by.split(',')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={doc.file_url || `/api/institution/documents/download/${doc.id}`}
                    download
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Download
                  </a>

                  <button
                    onClick={() => {
                      setSelectedDocType(doc.document_type);
                      setIsUploadOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Upload Renewal
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document History Timeline Modal */}
      {historyModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  PASSPORT AUDIT TRAIL
                </span>
                <h3 className="text-base font-bold text-slate-900">{historyModalDoc.document_type}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{historyModalDoc.document_name}</p>
              </div>
              <button
                onClick={() => setHistoryModalDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Document Identity:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {historyModalDoc.document_code || `#PASSPORT-${historyModalDoc.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application:</span>
                <span className="font-mono font-semibold text-indigo-700">
                  {historyModalDoc.application_number || historyModalDoc.application_id || 'AICTE/2026-27/1-9382104921'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <span className="font-semibold text-slate-800">{historyModalDoc.verification_status}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Multi-Cycle Upload History
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
                {(historyModalDoc.upload_history || [
                  {
                    version: 1,
                    uploaded_at: historyModalDoc.uploaded_at || new Date().toISOString(),
                    uploaded_by: 'Institution Signatory',
                    file_name: historyModalDoc.document_name,
                    file_size_kb: 2048,
                    action: 'initial_upload',
                  }
                ]).map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Version {entry.version}.0</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        Uploaded by <span className="font-medium text-slate-800">{entry.uploaded_by}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {entry.file_name} ({entry.file_size_kb} KB) • Action: {entry.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {historyModalDoc.verification_history && historyModalDoc.verification_history.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Officer Verification Logs
                </h4>
                {historyModalDoc.verification_history.map((vh, i) => (
                  <div key={i} className="text-xs p-2.5 rounded bg-emerald-50 border border-emerald-100 space-y-1">
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>{vh.status}</span>
                      <span className="text-[10px] text-emerald-700 font-normal">{vh.verified_at}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">Officer: {vh.verified_by}</p>
                    {vh.remarks && <p className="text-[11px] text-emerald-700 italic">"{vh.remarks}"</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setHistoryModalDoc(null)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        </div>
      )}

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadPassport}
        defaultDocumentType={selectedDocType}
      />
    </div>
  );
};
