import { Institution } from '../types';
import { mockInstitutions, defaultMockInstitution } from '../data/mockInstitution';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import { FALLBACK_INSTITUTIONS } from '../../../services/data/fallbackStore';

export const institutionService = {
  /**
   * Retrieves institution details for any specified institution ID.
   * Directly queries Supabase master institutions table, with fallback to canonical records.
   */
  async getInstitution(institutionId?: string): Promise<Institution> {
    const targetId = institutionId || 'inst_wro_01';

    // 1. Live Supabase lookup
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('institutions').select('*');
        if (targetId.includes('-') && !targetId.startsWith('inst_')) {
          query = query.eq('aicte_permanent_id', targetId);
        } else if (targetId.length > 20) {
          query = query.eq('id', targetId);
        } else {
          query = query.or(`id.eq.${targetId},aicte_permanent_id.eq.${targetId}`);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            code: data.aicte_permanent_id,
            category: 'Engineering & Technology',
            institution_type: data.institution_type || 'Govt-Aided',
            email: data.contact_email,
            phone: data.contact_phone,
            address: data.address,
            state: data.state,
            district: data.city,
            pincode: data.pin_code,
            establishment_year: data.established_year || 1983,
            approval_status: 'Approved (EOA Active)',
            current_academic_year: '2026-2027',
            is_active: true,
          };
        }
      } catch (err) {
        console.warn('Supabase institution query failed, falling back to canonical store:', err);
      }
    }

    // 2. Canonical fallback store
    const fallback = FALLBACK_INSTITUTIONS.find(
      (i) => i.id === targetId || i.aictePermanentId === targetId
    );
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        code: fallback.aictePermanentId,
        category: 'Engineering & Technology',
        institution_type: fallback.institutionType,
        email: fallback.contactEmail,
        phone: fallback.contactPhone,
        address: fallback.address,
        state: fallback.state,
        district: fallback.city,
        pincode: fallback.pinCode,
        establishment_year: fallback.establishedYear,
        approval_status: 'Approved (EOA Active)',
        current_academic_year: '2026-2027',
        is_active: true,
      };
    }

    // 3. Fallback mock
    return mockInstitutions[targetId] || defaultMockInstitution;
  },
};
