import { DocumentFull, DocumentPassportItem } from '../types';
import { mockDocumentsList } from '../data/mockDocuments';
import { api } from '../api/client';
import { documents } from '../../../services/documents/documentsService';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import { FALLBACK_DOCUMENTS } from '../../../services/data/fallbackStore';

export const documentsService = {
  /**
   * Retrieves documents with type and status filtering
   */
  async getDocuments(params?: {
    type?: string;
    status?: string;
    institutionId?: string;
  }): Promise<DocumentFull[]> {
    // 1. Live Supabase lookup
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('application_documents')
          .select('*, application:applications(*)')
          .order('uploaded_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: DocumentFull[] = data.map((d: any, idx: number) => {
            const daysRemaining = d.expiry_date
              ? Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : undefined;

            let expiryStatus: DocumentPassportItem['expiry_status'] = 'Valid';
            let renewalStatus: DocumentPassportItem['renewal_status'] = 'Up to Date';
            if (daysRemaining !== undefined) {
              if (daysRemaining < 0) {
                expiryStatus = 'Expired';
                renewalStatus = 'Renewal Due';
              } else if (daysRemaining <= 15) {
                expiryStatus = 'Critical';
                renewalStatus = 'Renewal Due';
              } else if (daysRemaining <= 60) {
                expiryStatus = 'Expiring Soon';
                renewalStatus = 'Renewal Due';
              }
            } else {
              expiryStatus = 'Permanent';
              renewalStatus = 'Not Applicable';
            }

            return {
              id: typeof d.id === 'number' ? d.id : idx + 101,
              institution_id: params?.institutionId || 'inst_wro_01',
              document_type: d.name || d.category || 'Statutory Document',
              document_name: d.file_name || 'document.pdf',
              document_code: d.code || `DOC-${(d.name || d.category || 'GEN').slice(0, 3).toUpperCase()}-${idx + 101}`,
              application_id: d.application_id || 'app-wro-2026-001',
              application_number: d.application?.application_number || 'APP-2026-WRO-001',
              file_path: d.storage_path || 'uploads/doc.pdf',
              file_url: d.preview_url || `/api/documents/preview/${d.id}`,
              uploaded_at: d.uploaded_at || new Date().toISOString(),
              expiry_date: d.expiry_date || undefined,
              expiry_status: expiryStatus,
              renewal_status: renewalStatus,
              verification_status:
                d.status === 'verified'
                  ? 'Verified'
                  : d.status === 'correction_required'
                  ? 'Correction Required'
                  : 'Verification Pending',
              file_size_kb: parseInt(d.file_size) || 2048,
              mime_type: d.file_type || 'application/pdf',
              days_remaining: daysRemaining,
              created_at: d.created_at || new Date().toISOString(),
              updated_at: d.updated_at || new Date().toISOString(),
              upload_history: [
                {
                  version: d.version || 1,
                  uploaded_at: d.uploaded_at || new Date().toISOString(),
                  uploaded_by: 'Institution Signatory',
                  file_name: d.file_name || 'doc.pdf',
                  file_size_kb: 2048,
                  action: 'initial_upload',
                },
              ],
            };
          });

          let result = mapped;
          if (params?.type && params.type.trim()) {
            const typeLower = params.type.toLowerCase();
            result = result.filter((d) => d.document_type.toLowerCase().includes(typeLower));
          }
          if (params?.status && params.status !== 'all') {
            const statusLower = params.status.toLowerCase();
            result = result.filter(
              (d) =>
                d.verification_status.toLowerCase() === statusLower ||
                d.expiry_status.toLowerCase() === statusLower
            );
          }
          if (result.length > 0) return result;
        }
      } catch (err) {
        console.warn('Supabase documents query failed, using fallback:', err);
      }
    }

    // 2. Canonical fallback store
    if (FALLBACK_DOCUMENTS.length > 0) {
      // Map fallback store
      const mappedFallbacks: DocumentFull[] = FALLBACK_DOCUMENTS.map((d, i) => {
        const daysRemaining = d.expiryDate
          ? Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined;

        let expiryStatus: DocumentPassportItem['expiry_status'] = 'Valid';
        let renewalStatus: DocumentPassportItem['renewal_status'] = 'Up to Date';
        if (daysRemaining !== undefined) {
          if (daysRemaining < 0) {
            expiryStatus = 'Expired';
            renewalStatus = 'Renewal Due';
          } else if (daysRemaining <= 15) {
            expiryStatus = 'Critical';
            renewalStatus = 'Renewal Due';
          } else if (daysRemaining <= 60) {
            expiryStatus = 'Expiring Soon';
            renewalStatus = 'Renewal Due';
          }
        } else {
          expiryStatus = 'Permanent';
          renewalStatus = 'Not Applicable';
        }

        return {
          id: i + 1,
          institution_id: 'inst_wro_01',
          document_type: d.category || 'Statutory Certificate',
          document_name: d.name,
          document_code: d.code || `DOC-${(d.category || 'GEN').slice(0, 3).toUpperCase()}-${i + 1}`,
          application_id: d.applicationId || 'app-wro-2026-001',
          application_number: 'AICTE/2026-27/1-9382104921',
          file_path: d.storagePath,
          file_url: d.previewUrl || `/api/documents/preview/${d.id}`,
          uploaded_at: d.uploadedAt,
          expiry_date: d.expiryDate,
          expiry_status: expiryStatus,
          renewal_status: renewalStatus,
          verification_status:
            d.status === 'verified'
              ? 'Verified'
              : d.status === 'correction_required'
              ? 'Correction Required'
              : 'Verification Pending',
          file_size_kb: parseInt(d.fileSize) * 1024 || 2048,
          mime_type: d.fileType,
          days_remaining: daysRemaining,
          created_at: d.uploadedAt,
          updated_at: d.uploadedAt,
          upload_history: [
            {
              version: d.version,
              uploaded_at: d.uploadedAt,
              uploaded_by: 'Institution Signatory',
              file_name: d.fileName,
              file_size_kb: 2048,
              action: 'initial_upload',
            },
          ],
        };
      });

      let result = [...mappedFallbacks, ...mockDocumentsList];
      if (params?.type && params.type.trim()) {
        const typeLower = params.type.toLowerCase();
        result = result.filter((d) => d.document_type.toLowerCase().includes(typeLower));
      }
      if (params?.status && params.status !== 'all') {
        const statusLower = params.status.toLowerCase();
        result = result.filter(
          (d) =>
            d.verification_status.toLowerCase() === statusLower ||
            d.expiry_status.toLowerCase() === statusLower
        );
      }
      return result;
    }

    // 3. Fallback mock list
    return mockDocumentsList;
  },

  /**
   * Retrieves single document detail
   */
  async getDocumentById(id: number): Promise<DocumentFull | null> {
    const list = await this.getDocuments();
    const doc = list.find((d) => d.id === id);
    return doc || null;
  },

  /**
   * Uploads a new document
   */
  async uploadDocument(formData: FormData): Promise<DocumentFull> {
    const docType = (formData.get('document_type') as string) || 'Statutory Certificate';
    const expiryDate = (formData.get('expiry_date') as string) || undefined;
    const file = formData.get('file') as File | null;

    // Call shared canonical documents service
    if (file) {
      try {
        await documents.upload({
          applicationId: 'app-wro-2026-001',
          file,
          category: docType,
          code: `DOC-${docType.slice(0, 3).toUpperCase()}-01`,
          name: docType,
          expiryDate,
        });
      } catch (err) {
        console.warn('Canonical documents.upload failed:', err);
      }
    }

    const existingIndex = mockDocumentsList.findIndex((d) => d.document_type === docType);

    if (existingIndex >= 0) {
      const current = mockDocumentsList[existingIndex];
      const newVersion = (current.upload_history?.length || 1) + 1;

      current.document_name = file?.name || current.document_name;
      current.expiry_date = expiryDate;
      current.expiry_status = 'Valid';
      current.verification_status = 'Verification Pending';
      current.uploaded_at = new Date().toISOString();
      current.file_size_kb = file ? Math.round(file.size / 1024) : 2100;

      if (!current.upload_history) current.upload_history = [];
      current.upload_history.push({
        version: newVersion,
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'Institution Admin',
        file_name: current.document_name,
        file_size_kb: current.file_size_kb,
        action: 'renewal_replacement',
      });

      return current;
    }

    const newDoc: DocumentFull = {
      id: Date.now(),
      institution_id: 'inst_wro_01',
      document_type: docType,
      document_name: file?.name || `${docType.replace(/\s+/g, '_')}.pdf`,
      file_path: `uploads/inst_wro_01/${file?.name || 'doc.pdf'}`,
      file_url: `/api/institution/documents/download/${Date.now()}`,
      uploaded_at: new Date().toISOString(),
      expiry_date: expiryDate,
      expiry_status: 'Valid',
      verification_status: 'Verification Pending',
      file_size_kb: file ? Math.round(file.size / 1024) : 1850,
      mime_type: file?.type || 'application/pdf',
      upload_history: [
        {
          version: 1,
          uploaded_at: new Date().toISOString(),
          uploaded_by: 'Institution Admin',
          file_name: file?.name || 'document.pdf',
          file_size_kb: file ? Math.round(file.size / 1024) : 1850,
          action: 'initial_upload',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDocumentsList.unshift(newDoc);
    return newDoc;
  },

  /**
   * Replaces an existing document with a renewed version (Renewal Workflow)
   */
  async replaceDocument(
    documentId: number,
    file: File,
    expiryDate?: string
  ): Promise<DocumentFull> {
    const list = await this.getDocuments();
    const doc = list.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    try {
      await documents.upload({
        applicationId: 'app-wro-2026-001',
        file,
        category: doc.document_type,
        code: `DOC-REN-${documentId}`,
        name: doc.document_type,
        expiryDate,
      });
    } catch (err) {
      console.warn('Canonical document replacement upload failed:', err);
    }

    const newVersion = (doc.upload_history?.length || 1) + 1;
    doc.document_name = file.name;
    doc.uploaded_at = new Date().toISOString();
    doc.file_size_kb = Math.round(file.size / 1024);
    doc.verification_status = 'Verification Pending';
    if (expiryDate) {
      doc.expiry_date = expiryDate;
      doc.expiry_status = 'Valid';
    }

    if (!doc.upload_history) doc.upload_history = [];
    doc.upload_history.push({
      version: newVersion,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'Institution Admin',
      file_name: file.name,
      file_size_kb: doc.file_size_kb,
      action: 'renewal_replacement',
    });

    return doc;
  },

  /**
   * Retrieves Smart Document Passport items
   */
  async getDocumentPassport(institutionId?: string): Promise<DocumentPassportItem[]> {
    const docs = await this.getDocuments({ institutionId });
    return docs;
  },
};
