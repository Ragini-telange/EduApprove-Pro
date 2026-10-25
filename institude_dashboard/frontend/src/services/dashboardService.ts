import {
  ConsolidatedDashboard,
  ApplicationSummaryData,
  RecentApplication,
  ActionRequiredItem,
  DeadlineItem,
  DocumentPassportItem,
  ComplianceSummaryData,
  EVCStatusData,
  NotificationItem,
  AlertItem,
  HealthScoreData,
} from '../types';
import {
  mockConsolidatedDashboard,
  mockApplicationSummary,
  mockRecentApplications,
  mockActionRequired,
  mockUpcomingDeadlines,
  mockDocumentPassport,
  mockComplianceSummary,
  mockEVCStatus,
  mockNotifications,
  mockAlerts,
  mockHealthScore,
} from '../data/mockDashboard';
import { institutionService } from './institutionService';
import { api } from '../api/client';

export const dashboardService = {
  /**
   * Retrieves full consolidated dashboard data package for any institution.
   */
  async getDashboardData(institutionId?: string): Promise<ConsolidatedDashboard> {
    try {
      const liveData = await api.getDashboard();
      if (liveData && liveData.summary) {
        return liveData;
      }
    } catch {
      // Graceful fallback to mock data layer
    }

    const inst = await institutionService.getInstitution(institutionId);
    return {
      ...mockConsolidatedDashboard,
      institution: inst,
    };
  },

  /**
   * Retrieves application distribution summary for chart rendering.
   */
  async getApplicationSummary(institutionId?: string): Promise<ApplicationSummaryData> {
    try {
      const data = await api.getApplicationSummary();
      if (data && data.distribution) return data;
    } catch {
      // fallback
    }
    return mockApplicationSummary;
  },

  /**
   * Retrieves recent applications list.
   */
  async getRecentApplications(
    institutionId?: string,
    limit = 5
  ): Promise<RecentApplication[]> {
    try {
      const data = await api.getRecentApplications(limit);
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockRecentApplications.slice(0, limit);
  },

  /**
   * Retrieves urgent actions required.
   */
  async getActionRequired(institutionId?: string): Promise<ActionRequiredItem[]> {
    try {
      const data = await api.getActionRequired();
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockActionRequired;
  },

  /**
   * Retrieves upcoming deadlines timeline.
   */
  async getUpcomingDeadlines(institutionId?: string): Promise<DeadlineItem[]> {
    try {
      const data = await api.getDeadlines();
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockUpcomingDeadlines;
  },

  /**
   * Retrieves document passport summary records.
   */
  async getDocumentSummary(institutionId?: string): Promise<DocumentPassportItem[]> {
    try {
      const data = await api.getDocumentPassport();
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockDocumentPassport;
  },

  /**
   * Retrieves compliance status summary.
   */
  async getComplianceSummary(institutionId?: string): Promise<ComplianceSummaryData> {
    try {
      const data = await api.getComplianceSummary();
      if (data && data.total_requirements) return data;
    } catch {
      // fallback
    }
    return mockComplianceSummary;
  },

  /**
   * Retrieves EVC inspection visit status.
   */
  async getEVCStatus(institutionId?: string): Promise<EVCStatusData> {
    try {
      const data = await api.getEVCStatus();
      if (data) return data;
    } catch {
      // fallback
    }
    return mockEVCStatus;
  },

  /**
   * Retrieves active notifications.
   */
  async getNotifications(institutionId?: string): Promise<NotificationItem[]> {
    try {
      const data = await api.getNotifications();
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockNotifications;
  },

  /**
   * Retrieves prioritized smart alerts.
   */
  async getAlerts(institutionId?: string): Promise<AlertItem[]> {
    try {
      const data = await api.getAlerts();
      if (data && data.length) return data;
    } catch {
      // fallback
    }
    return mockAlerts;
  },

  /**
   * Retrieves calculated institutional health score.
   */
  async getHealthScore(institutionId?: string): Promise<HealthScoreData> {
    try {
      const data = await api.getHealthScore();
      if (data && data.score) return data;
    } catch {
      // fallback
    }
    return mockHealthScore;
  },
};
