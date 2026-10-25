import { DocumentFull, DocumentPassportItem } from '../types';
import { mockDocumentsList } from '../data/mockDocuments';
import { api } from '../api/client';

export const documentsService = {
  /**
   * Retrieves documents with type and status filtering
   */
  async getDocuments(params?: {
    type?: string;
    status?: string;
    institutionId?: string;
  }): Promise<DocumentFull[]> {
    try {
      const data = await api.getDocuments(
        params?.type,
        params?.status === 'all' ? undefined : params?.status
      );
      if (data && data.length) return data;
    } catch {
      // fallback to mock service data
    }

    let result = [...mockDocumentsList];

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
  },

  /**
   * Retrieves single document detail
   */
  async getDocumentById(id: number): Promise<DocumentFull | null> {
    const doc = mockDocumentsList.find((d) => d.id === id);
    return doc || null;
  },

  /**
   * Uploads a new document
   */
  async uploadDocument(formData: FormData): Promise<DocumentFull> {
    try {
      const liveDoc = await api.uploadDocument(formData);
      if (liveDoc) return liveDoc;
    } catch {
      // fallback to mock creation
    }

    const docType = (formData.get('document_type') as string) || 'Statutory Certificate';
    const expiryDate = (formData.get('expiry_date') as string) || undefined;
    const file = formData.get('file') as File | null;

    const existingIndex = mockDocumentsList.findIndex((d) => d.document_type === docType);

    if (existingIndex >= 0) {
      // Replacement
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
      institution_id: 'INS001',
      document_type: docType,
      document_name: file?.name || `${docType.replace(/\s+/g, '_')}.pdf`,
      file_path: `uploads/INS001/${file?.name || 'doc.pdf'}`,
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
   * Replaces an existing document with a renewed version
   */
  async replaceDocument(
    documentId: number,
    file: File,
    expiryDate?: string
  ): Promise<DocumentFull> {
    const doc = mockDocumentsList.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

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
    try {
      const data = await api.getDocumentPassport();
      if (data && data.length) return data;
    } catch {
      // fallback
    }

    return mockDocumentsList;
  },
};
