import { supabase, isSupabaseConfigured } from '../supabase/client';
import { CanonicalDocument } from '../../types/canonical';
import { mapSupabaseToCanonicalDocument } from '../data/mappers';
import { FALLBACK_DOCUMENTS } from '../data/fallbackStore';

let inMemoryDocuments: CanonicalDocument[] = [...FALLBACK_DOCUMENTS];

export interface UploadDocumentPayload {
  applicationId: string;
  file: File | { name: string; size: number; type: string };
  category: string;
  code: string;
  name?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface DocumentVerificationOfficer {
  id: string;
  name: string;
}

export const documents = {
  /**
   * documents.upload()
   * Statutory document upload with cloud storage and database index
   */
  async upload(payload: UploadDocumentPayload): Promise<CanonicalDocument> {
    const fileName = payload.file.name;
    const fileSize = `${(payload.file.size / (1024 * 1024)).toFixed(1)} MB`;
    const fileType = payload.file.type || 'application/pdf';
    const storagePath = `${payload.applicationId}/${payload.code}_v1_${Date.now()}_${fileName}`;
    const now = new Date().toISOString();

    let previewUrl: string | undefined = undefined;

    // Supabase Storage upload
    if (isSupabaseConfigured && supabase) {
      try {
        if (payload.file instanceof File) {
          const { error: storageError } = await supabase.storage
            .from('application-documents')
            .upload(storagePath, payload.file, { upsert: true });

          if (!storageError) {
            const { data: urlData } = supabase.storage
              .from('application-documents')
              .getPublicUrl(storagePath);
            previewUrl = urlData?.publicUrl;
          }
        }

        // Database record insert
        const { data, error } = await supabase
          .from('application_documents')
          .insert({
            application_id: payload.applicationId,
            name: payload.name || fileName,
            category: payload.category || 'Land & Building',
            code: payload.code,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            version: 1,
            storage_path: storagePath,
            preview_url: previewUrl,
            status: 'pending',
            issue_date: payload.issueDate || null,
            expiry_date: payload.expiryDate || null,
          })
          .select('*')
          .single();

        if (!error && data) {
          const doc = mapSupabaseToCanonicalDocument(data);
          inMemoryDocuments.unshift(doc);
          return doc;
        }
      } catch (err) {
        console.warn('Supabase document upload failed, using fallback:', err);
      }
    }

    // Fallback store
    const newDoc: CanonicalDocument = {
      id: `doc-${Date.now()}`,
      applicationId: payload.applicationId,
      name: payload.name || fileName,
      category: payload.category || 'Land & Building',
      code: payload.code,
      fileName,
      fileSize,
      fileType,
      version: 1,
      storagePath,
      previewUrl: previewUrl || undefined,
      status: 'pending',
      issueDate: payload.issueDate,
      expiryDate: payload.expiryDate,
      uploadedAt: now,
    };

    inMemoryDocuments.unshift(newDoc);
    return newDoc;
  },

  /**
   * documents.getForApplication()
   * Retrieves all verified or pending statutory documents attached to an application
   */
  async getForApplication(applicationId: string): Promise<CanonicalDocument[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('application_documents')
          .select('*')
          .eq('application_id', applicationId)
          .order('uploaded_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalDocument);
        }
      } catch (err) {
        console.warn('Supabase getForApplication failed, using fallback:', err);
      }
    }

    return inMemoryDocuments.filter((d) => d.applicationId === applicationId);
  },

  /**
   * documents.verifyDocument()
   * Regional Officer document verification, deficiency tagging, and remark recording
   */
  async verifyDocument(
    documentId: string,
    status: 'pending' | 'verified' | 'correction_required' | 'rejected',
    observations: string,
    deficiencyReason?: string,
    officer?: DocumentVerificationOfficer
  ): Promise<{ success: boolean; document?: CanonicalDocument; error?: string }> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('application_documents')
          .update({
            status,
            observations,
            deficiency_reason: deficiencyReason || null,
            deficiency_remarks: observations,
            verified_by: officer?.id || null,
            verified_at: now,
            updated_at: now,
          })
          .eq('id', documentId)
          .select('*')
          .single();

        if (!error && data) {
          const canonical = mapSupabaseToCanonicalDocument(data);
          inMemoryDocuments = inMemoryDocuments.map((d) =>
            d.id === documentId ? canonical : d
          );
          return { success: true, document: canonical };
        }
      } catch (err) {
        console.warn('Supabase verifyDocument failed, using memory state:', err);
      }
    }

    const existing = inMemoryDocuments.find((d) => d.id === documentId);
    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    const updated: CanonicalDocument = {
      ...existing,
      status,
      observations,
      deficiencyReason,
      deficiencyRemarks: observations,
      verifiedBy: officer?.id,
      verifiedAt: now,
    };

    inMemoryDocuments = inMemoryDocuments.map((d) =>
      d.id === documentId ? updated : d
    );

    return { success: true, document: updated };
  },
};
