import { ComplianceRequirement, ComplianceSummaryData } from '../types';
import { mockComplianceList, mockComplianceSummaryData } from '../data/mockCompliance';
import { api } from '../api/client';

export const complianceService = {
  /**
   * Retrieves compliance metrics summary (total, completed, pending, overdue, %)
   */
  async getComplianceSummary(institutionId?: string): Promise<ComplianceSummaryData> {
    try {
      const live = await api.getComplianceSummary();
      if (live && live.total_requirements) return live;
    } catch {
      // fallback
    }

    const total = mockComplianceList.length;
    const completed = mockComplianceList.filter(
      (r) => r.status === 'Verified' || r.status === 'Submitted'
    ).length;
    const overdue = mockComplianceList.filter((r) => r.status === 'Overdue').length;
    const pending = total - completed - overdue;

    return {
      total_requirements: total,
      completed_requirements: completed,
      pending_requirements: Math.max(0, pending),
      overdue_requirements: overdue,
      progress_percentage: Math.round((completed / total) * 100),
    };
  },

  /**
   * Retrieves compliance obligations list with optional category & status filters
   */
  async getComplianceRequirements(params?: {
    category?: string;
    status?: string;
    institutionId?: string;
  }): Promise<ComplianceRequirement[]> {
    try {
      const live = await api.getComplianceRequirements(
        params?.category === 'all' ? undefined : params?.category,
        params?.status === 'all' ? undefined : params?.status
      );
      if (live && live.length) return live;
    } catch {
      // fallback
    }

    let result = [...mockComplianceList];

    if (params?.category && params.category !== 'all') {
      const catLower = params.category.toLowerCase();
      result = result.filter((r) => r.category.toLowerCase() === catLower);
    }

    if (params?.status && params.status !== 'all') {
      const statusLower = params.status.toLowerCase();
      result = result.filter((r) => r.status.toLowerCase() === statusLower);
    }

    return result;
  },

  /**
   * Submits undertaking or documentary evidence for a compliance requirement
   */
  async submitComplianceRequirement(id: number, remarks: string): Promise<ComplianceRequirement> {
    try {
      const live = await api.submitCompliance(id, remarks);
      if (live) return live;
    } catch {
      // fallback
    }

    const item = mockComplianceList.find((r) => r.id === id);
    if (!item) throw new Error('Compliance requirement not found');

    item.status = 'Submitted';
    item.submitted_at = new Date().toISOString();
    item.remarks = remarks;
    item.updated_at = new Date().toISOString();

    return item;
  },
};
