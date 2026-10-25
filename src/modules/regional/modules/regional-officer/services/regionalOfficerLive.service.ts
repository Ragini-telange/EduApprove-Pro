import {
  ApplicationFilterOptions,
  TransitionActionPayload,
  DocumentVerificationActionPayload,
} from './regionalOfficerApi.interface';
import {
  Application,
  ApplicationDocument,
} from '../types';
import { applications } from '../../../../../services/applications/applicationsService';
import { documents } from '../../../../../services/documents/documentsService';
import { canonicalToRegionalApplication } from '../../../../../services/data/mappers';
import { RegionalOfficerMockService } from './regionalOfficerMock.service';

export class RegionalOfficerLiveService extends RegionalOfficerMockService {
  override getProviderStatus() {
    return {
      isMock: false,
      providerName: 'Live Supabase Statutory Gateway',
      description: 'Connected to shared Supabase project with RLS enforcement and automatic fallback.',
    };
  }

  override async getApplications(filters?: ApplicationFilterOptions): Promise<Application[]> {
    try {
      const canonicalApps = await applications.getForOfficer();
      if (canonicalApps && canonicalApps.length > 0) {
        let mapped = canonicalApps.map(canonicalToRegionalApplication);
        if (filters?.status) {
          mapped = mapped.filter((a) => a.status === filters.status);
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to fetch from live applications service, falling back to mock:', err);
    }
    return super.getApplications(filters);
  }

  override async getApplicationById(id: string): Promise<Application | null> {
    try {
      const canonical = await applications.getById(id);
      if (canonical) {
        return canonicalToRegionalApplication(canonical);
      }
    } catch (err) {
      console.warn('Failed to fetch application by ID from live service:', err);
    }
    return super.getApplicationById(id);
  }

  override async executeWorkflowTransition(payload: TransitionActionPayload): Promise<{
    success: boolean;
    application: Application;
    error?: string;
  }> {
    try {
      const res = await applications.updateStatus(
        payload.applicationId,
        payload.targetStatus,
        payload.remarks,
        {
          id: payload.officerId,
          name: payload.officerName,
          role: 'regional_officer',
        }
      );
      if (res.success && res.application) {
        return {
          success: true,
          application: canonicalToRegionalApplication(res.application),
        };
      }
      if (res.error) {
        return {
          success: false,
          application: null as any,
          error: res.error,
        };
      }
    } catch (err: any) {
      console.warn('Workflow transition live failure, trying fallback:', err);
    }
    return super.executeWorkflowTransition(payload);
  }

  override async submitCorrectionRequest(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string,
    rectificationDeadline: string
  ) {
    const res = await super.submitCorrectionRequest(
      applicationId,
      officerId,
      officerName,
      remarks,
      rectificationDeadline
    );

    if (res.success) {
      try {
        await applications.updateStatus(
          applicationId,
          'correction_required',
          remarks,
          {
            id: officerId,
            name: officerName,
            role: 'regional_officer',
          }
        );
      } catch (err) {
        console.warn('Live service: Failed to synchronize status with canonical applications:', err);
      }
    }

    return res;
  }

  override async getDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    try {
      const canonicalDocs = await documents.getForApplication(applicationId);
      if (canonicalDocs && canonicalDocs.length > 0) {
        return canonicalDocs.map((d) => ({
          id: d.id,
          applicationId: d.applicationId,
          name: d.name,
          category: d.category as any,
          code: d.code,
          fileName: d.fileName,
          fileSize: d.fileSize,
          fileType: d.fileType,
          version: d.version,
          uploadedAt: d.uploadedAt,
          storagePath: d.storagePath,
          previewUrl: d.previewUrl,
          status: d.status,
          observations: d.observations,
          deficiencyReason: d.deficiencyReason,
          deficiencyRemarks: d.deficiencyRemarks,
          verifiedBy: d.verifiedBy,
          verifiedAt: d.verifiedAt,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch documents from live service:', err);
    }
    return super.getDocuments(applicationId);
  }

  override async verifyDocument(payload: DocumentVerificationActionPayload): Promise<{
    success: boolean;
    document: ApplicationDocument;
    error?: string;
  }> {
    try {
      const res = await documents.verifyDocument(
        payload.documentId,
        payload.status,
        payload.observations,
        payload.deficiencyReason,
        { id: payload.officerName, name: payload.officerName }
      );
      if (res.success && res.document) {
        return {
          success: true,
          document: {
            id: res.document.id,
            applicationId: res.document.applicationId,
            name: res.document.name,
            category: res.document.category as any,
            code: res.document.code,
            fileName: res.document.fileName,
            fileSize: res.document.fileSize,
            fileType: res.document.fileType,
            version: res.document.version,
            uploadedAt: res.document.uploadedAt,
            storagePath: res.document.storagePath,
            previewUrl: res.document.previewUrl,
            status: res.document.status,
            observations: res.document.observations,
            deficiencyReason: res.document.deficiencyReason,
            deficiencyRemarks: res.document.deficiencyRemarks,
            verifiedBy: res.document.verifiedBy,
            verifiedAt: res.document.verifiedAt,
          },
        };
      }
    } catch (err) {
      console.warn('Failed to verify document via live service:', err);
    }
    return super.verifyDocument(payload);
  }
}
