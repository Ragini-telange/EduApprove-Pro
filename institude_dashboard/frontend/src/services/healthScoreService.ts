import { HealthScoreData } from '../types';
import { mockHealthScore } from '../data/mockDashboard';
import { api } from '../api/client';

export const healthScoreService = {
  /**
   * Retrieves calculated institutional health score metrics
   */
  async getHealthScore(institutionId?: string): Promise<HealthScoreData> {
    try {
      const live = await api.getHealthScore();
      if (live && live.score) return live;
    } catch {
      // fallback
    }
    return mockHealthScore;
  },
};
