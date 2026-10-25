import { AlertItem } from '../types';
import { mockAlertsList } from '../data/mockAlerts';
import { api } from '../api/client';

export const alertsService = {
  /**
   * Retrieves prioritized alerts for the institution
   */
  async getAlerts(params?: {
    severity?: string;
    institutionId?: string;
  }): Promise<AlertItem[]> {
    try {
      const live = await api.getAlerts();
      if (live && live.length) return live;
    } catch {
      // fallback to mock
    }

    let result = [...mockAlertsList].filter((a) => !a.is_dismissed);

    if (params?.severity && params.severity !== 'all') {
      const targetSeverity = params.severity.toLowerCase();
      result = result.filter((a) => a.severity.toLowerCase() === targetSeverity);
    }

    return result;
  },

  /**
   * Dismisses an alert locally
   */
  async dismissAlert(id: number): Promise<void> {
    const item = mockAlertsList.find((a) => a.id === id);
    if (item) {
      item.is_dismissed = true;
    }
  },
};
