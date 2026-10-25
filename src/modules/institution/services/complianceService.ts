import { ComplianceRequirement, ComplianceSummaryData } from '../types';
import { mockComplianceList, mockComplianceSummaryData } from '../data/mockCompliance';
import { api } from '../api/client';
import { compliance } from '../../../services/compliance/complianceService';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import { FALLBACK_COMPLIANCE } from '../../../services/data/fallbackStore';

export const complianceService = {
  /**
   * Retrieves compliance metrics summary (total, completed, pending, overdue, %)
   */
  async getComplianceSummary(institutionId?: string): Promise<ComplianceSummaryData> {
    const list = await this.getComplianceRequirements({ institutionId });
    const total = list.length;
    const completed = list.filter(
      (r) => r.status === 'Verified' || r.status === 'Submitted'
    ).length;
    const overdue = list.filter((r) => r.status === 'Overdue').length;
    const pending = total - completed - overdue;

    return {
      total_requirements: total,
      completed_requirements: completed,
      pending_requirements: Math.max(0, pending),
      overdue_requirements: overdue,
      progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 100,
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
    // 1. Live Supabase lookup
    if (isSupabaseConfigured && supabase) {
      try {
        const canonicalComp = await compliance.getForInstitution(
          params?.institutionId || 'inst_wro_01'
        );
        if (canonicalComp && canonicalComp.length > 0) {
          const mapped: ComplianceRequirement[] = canonicalComp.map((c, idx) => {
            const daysRemaining = c.dueDate
              ? Math.ceil((new Date(c.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 14;

            let statusStr: ComplianceRequirement['status'] = 'Pending';
            if (c.status === 'submitted') statusStr = 'Submitted';
            else if (c.status === 'verified') statusStr = 'Verified';
            else if (c.status === 'overdue') statusStr = 'Overdue';

            return {
              id: idx + 1,
              institution_id: c.institutionId,
              requirement_name: c.title,
              category: c.clause.includes('Anti-Ragging') ? 'Governance' : 'Safety',
              description: c.description,
              due_date: c.dueDate,
              status: statusStr,
              submitted_at: c.submittedAt,
              remarks: c.officerRemarks,
              days_remaining: daysRemaining,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });

          let result = mapped;
          if (params?.category && params.category !== 'all') {
            const catLower = params.category.toLowerCase();
            result = result.filter((r) => r.category.toLowerCase() === catLower);
          }
          if (params?.status && params.status !== 'all') {
            const statusLower = params.status.toLowerCase();
            result = result.filter((r) => r.status.toLowerCase() === statusLower);
          }
          if (result.length > 0) return result;
        }
      } catch (err) {
        console.warn('Supabase compliance query failed, falling back:', err);
      }
    }

    // 2. Fallback mock list
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
      await compliance.submit(
        `comp-${id}`,
        'Statutory_Compliance_Proof.pdf',
        '/storage/aicte/compliance_proof.pdf'
      );
    } catch (err) {
      console.warn('Compliance submit fallback:', err);
    }

    const item = mockComplianceList.find((r) => r.id === id);
    if (item) {
      item.status = 'Submitted';
      item.submitted_at = new Date().toISOString();
      item.remarks = remarks;
      item.updated_at = new Date().toISOString();
      return item;
    }

    return {
      id,
      institution_id: 'inst_wro_01',
      requirement_name: 'Statutory Compliance Undertaking',
      category: 'Governance',
      due_date: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      remarks,
      days_remaining: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
};
