import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { DocumentPassportItem } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

interface DocumentPassportPreviewProps {
  documents: DocumentPassportItem[];
}

export const DocumentPassportPreview: React.FC<DocumentPassportPreviewProps> = ({ documents }) => {
  const getExpiryBadge = (
    status: DocumentPassportItem['expiry_status']
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
      case 'Permanent':
        return { label: 'Permanent', variant: 'info' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  // Select key representative documents for dashboard preview
  const previewDocs = documents.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Smart Document Passport</h3>
            <p className="text-xs text-slate-500">Institutional statutory credentials preview</p>
          </div>
        </div>
        <Link
          to="/institution/passport"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View Full Passport &rarr;
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {previewDocs.map((doc) => {
          const badge = getExpiryBadge(doc.expiry_status);

          return (
            <div
              key={doc.id}
              className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{doc.document_type}</h4>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span className="font-mono text-indigo-700 font-semibold truncate max-w-[130px]">
                    {doc.application_number || 'AICTE/2026-27/1-9382104921'}
                  </span>
                  <span>•</span>
                  <span>
                    Verification:{' '}
                    <span
                      className={
                        doc.verification_status === 'Verified'
                          ? 'text-emerald-700 font-semibold'
                          : doc.verification_status === 'Expired'
                          ? 'text-rose-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      {doc.verification_status}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    Expiry:{' '}
                    <span className="font-mono text-slate-700">
                      {doc.expiry_date || 'Permanent'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Badge variant={badge.variant} dot>
                  {badge.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          to="/institution/passport"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <span>View Document Passport</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
