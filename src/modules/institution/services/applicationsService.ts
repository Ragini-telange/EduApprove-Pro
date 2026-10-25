import { ApplicationFull } from '../types';
import { mockApplicationsList } from '../data/mockApplications';
import { api } from '../api/client';
import { applications } from '../../../services/applications/applicationsService';
import { canonicalToInstitutionApplication } from '../../../services/data/mappers';

export const applicationsService = {
  /**
   * Retrieves applications with filter and search criteria
   */
  async getApplications(params?: {
    status?: string;
    search?: string;
    institutionId?: string;
  }): Promise<ApplicationFull[]> {
    // 1. Try Shared Canonical Supabase Service
    try {
      const canonicalApps = await applications.getForInstitution(
        params?.institutionId || 'inst_wro_01'
      );
      if (canonicalApps && canonicalApps.length > 0) {
        let list: ApplicationFull[] = canonicalApps.map(canonicalToInstitutionApplication);
        if (params?.status && params.status !== 'all') {
          const s = params.status.toLowerCase();
          list = list.filter((a) => a.status.toLowerCase().includes(s));
        }
        if (params?.search && params.search.trim()) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (a) =>
              a.application_number.toLowerCase().includes(q) ||
              a.application_type.toLowerCase().includes(q)
          );
        }
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn('Canonical applications service fallback:', e);
    }

    // 2. Try REST API
    try {
      const data = await api.getApplications(
        params?.status === 'all' ? undefined : params?.status,
        params?.search
      );
      if (data && data.length) return data;
    } catch (apiErr) {
      console.warn('REST api.getApplications fallback:', apiErr);
    }

    // 3. Fallback to mock list
    let result = [...mockApplicationsList];

    if (params?.status && params.status !== 'all') {
      const statusLower = params.status.toLowerCase();
      result = result.filter((a) => a.status.toLowerCase() === statusLower);
    }

    if (params?.search && params.search.trim()) {
      const query = params.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.application_number.toLowerCase().includes(query) ||
          a.application_type.toLowerCase().includes(query) ||
          (a.remarks && a.remarks.toLowerCase().includes(query))
      );
    }

    return result;
  },

  /**
   * Retrieves single application details
   */
  async getApplicationById(id: number | string): Promise<ApplicationFull | null> {
    try {
      const canonical = await applications.getById(String(id));
      if (canonical) {
        return canonicalToInstitutionApplication(canonical);
      }
    } catch (canErr) {
      console.warn('Canonical applications.getById fallback:', canErr);
    }

    try {
      const data = await api.getApplicationById(Number(id));
      if (data) return data;
    } catch (apiErr) {
      console.warn('REST api.getApplicationById fallback:', apiErr);
    }

    const app = mockApplicationsList.find((a) => String(a.id) === String(id));
    return app || null;
  },

  /**
   * Creates a new application
   */
  async createApplication(payload: {
    application_type: string;
    academic_year?: string;
    remarks?: string;
    application_number?: string;
    id?: string | number;
  }): Promise<ApplicationFull> {
    try {
      const created = await applications.create({
        id: payload.id ? String(payload.id) : undefined,
        applicationNumber: payload.application_number,
        institutionId: 'inst_wro_01',
        type: payload.application_type,
        academicYear: payload.academic_year || '2026-2027',
      });
      if (created) {
        return canonicalToInstitutionApplication(created);
      }
    } catch (createErr) {
      console.warn('Canonical applications.create fallback:', createErr);
    }

    const appNumber = payload.application_number || `APP-2026-${Math.floor(1030 + Math.random() * 9000)}`;
    const newApp: ApplicationFull = {
      id: payload.id ? (typeof payload.id === 'number' ? payload.id : Date.now()) : Date.now(),
      institution_id: 'INS001',
      application_number: appNumber,
      application_type: payload.application_type,
      academic_year: payload.academic_year || '2026-2027',
      status: 'Draft',
      current_stage: 'Draft Preparation',
      remarks: payload.remarks || 'Application initiated by Institution Admin.',
      timeline: [
        {
          stage: 'Draft Preparation',
          status: 'current',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockApplicationsList.unshift(newApp);
    return newApp;
  },

  /**
   * Submits correction / revised documents for deficiency
   */
  async submitCorrection(id: number | string, notes: string): Promise<ApplicationFull> {
    try {
      await applications.updateStatus(
        String(id),
        'resubmitted',
        notes,
        { id: 'inst_admin_01', name: 'Institution Admin', role: 'institution' }
      );
    } catch (err) {
      console.warn('Update status fallback:', err);
    }

    const app = mockApplicationsList.find((a) => String(a.id) === String(id));
    if (app) {
      app.status = 'Document Verification';
      app.current_stage = 'Resubmitted for Verification';
      app.remarks = `Correction submitted on ${new Date().toLocaleDateString('en-GB')}: ${notes}`;
      app.updated_at = new Date().toISOString();
      return app;
    }

    return {
      id: Number(id) || Date.now(),
      institution_id: 'inst_wro_01',
      application_number: String(id),
      application_type: 'Extension of Approval',
      academic_year: '2026-2027',
      status: 'Resubmitted',
      current_stage: 'Resubmitted for Verification',
      remarks: notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Submits a draft application to AICTE Regional Office
   */
  async submitApplication(id: number | string, remarks?: string): Promise<ApplicationFull> {
    try {
      await applications.updateStatus(
        String(id),
        'submitted',
        remarks || 'Application formally submitted to Regional Scrutiny Panel.',
        { id: 'inst_admin_01', name: 'Institution Admin', role: 'institution' }
      );
    } catch (err) {
      console.warn('Submit application error:', err);
    }

    const app = mockApplicationsList.find((a) => String(a.id) === String(id));
    if (app) {
      app.status = 'Under Scrutiny';
      app.current_stage = 'Scrutiny Committee Review';
      app.submitted_at = new Date().toISOString();
      app.updated_at = new Date().toISOString();
      if (app.timeline) {
        app.timeline.push({
          stage: 'Application Submission',
          status: 'completed',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          notes: 'Submitted online with challan and statutory declarations',
        });
      }
      return app;
    }

    return {
      id: Number(id) || Date.now(),
      institution_id: 'inst_wro_01',
      application_number: String(id),
      application_type: 'Extension of Approval',
      academic_year: '2026-2027',
      status: 'Under Scrutiny',
      current_stage: 'Scrutiny Committee Review',
      submitted_at: new Date().toISOString(),
      remarks: remarks || 'Submitted to Regional Office',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Files formal Late Submission / Condonation Petition
   */
  async submitLateRequest(payload: {
    applicationId: string;
    requestType: 'Late Submission Permission' | 'Condonation of Scrutiny Delay' | 'Emergency Re-application';
    reasonCategory: 'Natural Calamity' | 'Technical Gateway Failure' | 'Administrative Exigency' | 'Judicial Order';
    detailedReason: string;
    supportingDocName?: string;
  }) {
    return applications.submitLateRequest(payload);
  },

  /**
   * Initiates re-application or appeal for rejected application
   */
  async reapply(priorApplicationId: string, justification: string): Promise<ApplicationFull> {
    const res = await applications.reapply(priorApplicationId, justification, {
      id: 'inst_admin_01',
      name: 'Institution Admin',
      role: 'institution',
    });
    return canonicalToInstitutionApplication(res.application);
  },
};
