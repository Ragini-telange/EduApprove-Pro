import { supabase, isSupabaseConfigured } from '../supabase/client';
import { CanonicalComplianceRequirement } from '../../types/canonical';
import { mapSupabaseToCanonicalCompliance } from '../data/mappers';
import { FALLBACK_COMPLIANCE } from '../data/fallbackStore';

let inMemoryCompliance: CanonicalComplianceRequirement[] = [...FALLBACK_COMPLIANCE];

export const compliance = {
  /**
   * compliance.getForInstitution()
   * Retrieves statutory compliance requirements and due dates for an institution
   */
  async getForInstitution(institutionId: string): Promise<CanonicalComplianceRequirement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('compliance_requirements')
          .select('*')
          .eq('institution_id', institutionId)
          .order('due_date', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalCompliance);
        }
      } catch (err) {
        console.warn('Supabase compliance query failed, using fallback:', err);
      }
    }

    const filtered = inMemoryCompliance.filter(
      (c) => c.institutionId === institutionId || institutionId === 'all'
    );
    return filtered.length > 0 ? filtered : inMemoryCompliance;
  },

  /**
   * compliance.submit()
   * Institution submits proof document for a statutory compliance item
   */
  async submit(
    requirementId: string,
    documentName: string,
    documentUrl?: string
  ): Promise<{ success: boolean; requirement?: CanonicalComplianceRequirement; error?: string }> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('compliance_requirements')
          .update({
            status: 'submitted',
            submitted_document_name: documentName,
            submitted_document_url: documentUrl || null,
            submitted_at: now,
            updated_at: now,
          })
          .eq('id', requirementId)
          .select('*')
          .single();

        if (!error && data) {
          const mapped = mapSupabaseToCanonicalCompliance(data);
          inMemoryCompliance = inMemoryCompliance.map((c) =>
            c.id === requirementId ? mapped : c
          );
          return { success: true, requirement: mapped };
        }
      } catch (err) {
        console.warn('Supabase compliance submit failed, using local update:', err);
      }
    }

    const existing = inMemoryCompliance.find((c) => c.id === requirementId);
    if (!existing) {
      return { success: false, error: 'Compliance requirement not found' };
    }

    const updated: CanonicalComplianceRequirement = {
      ...existing,
      status: 'submitted',
      submittedDocumentName: documentName,
      submittedDocumentUrl: documentUrl,
      submittedAt: now,
    };

    inMemoryCompliance = inMemoryCompliance.map((c) =>
      c.id === requirementId ? updated : c
    );

    return { success: true, requirement: updated };
  },

  /**
   * compliance.verify()
   * Verification of institutional compliance requirement by Regional Officer
   */
  async verify(
    requirementId: string,
    status: 'verified' | 'correction_required' | 'rejected',
    remarks?: string
  ): Promise<{ success: boolean; requirement?: CanonicalComplianceRequirement; error?: string }> {
    const existing = inMemoryCompliance.find((c) => c.id === requirementId);
    if (!existing) {
      return { success: false, error: 'Compliance requirement not found' };
    }

    const updated: CanonicalComplianceRequirement = {
      ...existing,
      status: status === 'verified' ? 'verified' : 'overdue',
      officerRemarks: remarks || existing.officerRemarks,
    };

    inMemoryCompliance = inMemoryCompliance.map((c) =>
      c.id === requirementId ? updated : c
    );

    return { success: true, requirement: updated };
  },
};
