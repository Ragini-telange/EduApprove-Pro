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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PassportPage: React.FC = () => {
  const { user } = useAuth();
  const [passportDocs, setPassportDocs] = useState<DocumentPassportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | undefined>();
  const [selectedDocDetails, setSelectedDocDetails] = useState<DocumentPassportItem | null>(null);

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

  const filteredDocs = passportDocs.filter((d) =>
    d.document_type.toLowerCase().includes(search.toLowerCase()) ||
    d.document_name.toLowerCase().includes(search.toLowerCase())
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
              multi-cycle upload history, and verification logs.
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter passport by statutory credential name..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grid of Passport Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <p className="text-xs text-slate-400 p-8 col-span-3 text-center">Loading passport credentials...</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-xs text-slate-400 p-8 col-span-3 text-center">No passport credentials match the filter.</p>
        ) : (
          filteredDocs.map((doc) => {
            const badge = getExpiryBadge(doc.expiry_status);
            const isCritical = doc.expiry_status === 'Critical' || doc.expiry_status === 'Expired';

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl border shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between ${
                  isCritical ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Passport Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      PASSPORT #{doc.id.toString().padStart(4, '0')}
                    </span>
                    <Badge variant={badge.variant} dot>
                      {badge.label}
                    </Badge>
                  </div>

                  {/* Document Title */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.document_type}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1 truncate">{doc.document_name}</p>

                  {/* Details Card */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">AICTE Verification:</span>
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

                    <div className="flex justify-between">
                      <span className="text-slate-500">Expiry Date:</span>
                      <span className="font-mono text-slate-800">
                        {doc.expiry_date || 'Permanent (No Expiry)'}
                      </span>
                    </div>

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

                  {/* Upload & Verification History Snippets */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload History:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {doc.upload_history?.length || 1} Version(s)
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
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Upload Renewal
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadPassport}
        defaultDocumentType={selectedDocType}
      />
    </div>
  );
};
