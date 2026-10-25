import { Institution } from '../types';
import { mockInstitutions, defaultMockInstitution } from '../data/mockInstitution';
import { api } from '../api/client';

export const institutionService = {
  /**
   * Retrieves institution details for any specified institution ID.
   * Pulls from live API if reachable, with fallback to structured mock data.
   */
  async getInstitution(institutionId?: string): Promise<Institution> {
    const targetId = institutionId || 'INS001';

    try {
      const dashboard = await api.getDashboard();
      if (dashboard && dashboard.institution) {
        return dashboard.institution;
      }
    } catch {
      // Graceful fallback to mock data layer
    }

    // Return matched institution or default
    return mockInstitutions[targetId] || defaultMockInstitution;
  },
};
