import { ApplicationFull } from '../types';
import { mockApplicationsList } from '../data/mockApplications';
import { api } from '../api/client';

export const applicationsService = {
  /**
   * Retrieves applications with filter and search criteria
   */
  async getApplications(params?: {
    status?: string;
    search?: string;
    institutionId?: string;
  }): Promise<ApplicationFull[]> {
    try {
      const data = await api.getApplications(
        params?.status === 'all' ? undefined : params?.status,
        params?.search
      );
      if (data && data.length) return data;
    } catch {
      // fallback to mock service data
    }

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
  async getApplicationById(id: number): Promise<ApplicationFull | null> {
    try {
      const data = await api.getApplicationById(id);
      if (data) return data;
    } catch {
      // fallback
    }

    const app = mockApplicationsList.find((a) => a.id === id);
    return app || null;
  },

  /**
   * Creates a new application
   */
  async createApplication(payload: {
    application_type: string;
    academic_year?: string;
    remarks?: string;
  }): Promise<ApplicationFull> {
    try {
      const data = await api.createApplication(payload);
      if (data) return data;
    } catch {
      // fallback
    }

    const newApp: ApplicationFull = {
      id: Date.now(),
      institution_id: 'INS001',
      application_number: `APP-2026-${Math.floor(1030 + Math.random() * 9000)}`,
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
  async submitCorrection(id: number, notes: string): Promise<ApplicationFull> {
    const app = mockApplicationsList.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');

    app.status = 'Document Verification';
    app.current_stage = 'Resubmitted for Verification';
    app.remarks = `Correction submitted on ${new Date().toLocaleDateString('en-GB')}: ${notes}`;
    app.updated_at = new Date().toISOString();

    if (app.timeline) {
      app.timeline.push({
        stage: 'Deficiency Resubmission',
        status: 'completed',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        notes,
      });
    }

    return app;
  },
};
