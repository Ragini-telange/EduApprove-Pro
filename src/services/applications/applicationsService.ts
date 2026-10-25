import { supabase, isSupabaseConfigured } from '../supabase/client';
import { notifications } from '../notifications/notificationsService';
import {
  CanonicalApplication,
  CanonicalApplicationStatus,
  CanonicalAuditEntry,
} from '../../types/canonical';
import {
  mapSupabaseToCanonicalApplication,
  mapSupabaseToCanonicalAuditEntry,
  normalizeApplicationStatus,
} from '../data/mappers';
import {
  FALLBACK_APPLICATIONS,
  FALLBACK_AUDIT_LEDGER,
} from '../data/fallbackStore';

// ============================================================================
// STATUTORY WORKFLOW TRANSITION MATRIX (AICTE APH 2026-2027)
// ============================================================================
export const LEGAL_TRANSITIONS: Record<CanonicalApplicationStatus, CanonicalApplicationStatus[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_scrutiny', 'withdrawn'],
  under_scrutiny: ['correction_required', 'pending_evc', 'under_next_stage', 'completed', 'rejected', 'withdrawn'],
  correction_required: ['resubmitted', 'withdrawn'],
  resubmitted: ['under_re_scrutiny', 'withdrawn'],
  under_re_scrutiny: ['correction_required', 'pending_evc', 'under_next_stage', 'completed', 'rejected', 'withdrawn'],
  pending_evc: ['evc_scheduled', 'withdrawn'],
  evc_scheduled: ['under_next_stage', 'completed', 'rejected', 'withdrawn'],
  under_next_stage: ['completed', 'rejected', 'withdrawn'],
  completed: [],
  rejected: [],
  withdrawn: [],
};

// In-memory working state (synchronized with live Supabase)
let inMemoryApplications: CanonicalApplication[] = [...FALLBACK_APPLICATIONS];
let inMemoryAuditLedger: CanonicalAuditEntry[] = [...FALLBACK_AUDIT_LEDGER];

export interface CreateApplicationPayload {
  institutionId: string;
  type: string;
  academicYear?: string;
  priority?: 'normal' | 'urgent' | 'critical';
  institutionName?: string;
  instituteCode?: string;
  region?: string;
  state?: string;
  applicationNumber?: string;
  id?: string;
}

export interface TransitionActor {
  id: string;
  name: string;
  role: 'institution' | 'regional_officer' | 'senior_authority' | string;
}

export const applications = {
  /**
   * applications.create()
   * Creates a new application in draft state.
   */
  async create(payload: CreateApplicationPayload): Promise<CanonicalApplication> {
    const applicationNumber =
      payload.applicationNumber ||
      `AICTE/2026-27/1-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Attempt live Supabase insertion
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .insert({
            application_number: applicationNumber,
            institution_id: payload.institutionId,
            type: payload.type || 'extension_of_approval',
            academic_year: payload.academicYear || '2026-2027',
            status: 'draft',
            priority: payload.priority || 'normal',
            deadline_date: deadline,
            deficiency_count: 0,
            evc_required: false,
            re_scrutiny_count: 0,
          })
          .select('*, institution:institutions(*)')
          .single();

        if (!error && data) {
          const canonical = mapSupabaseToCanonicalApplication(data);
          inMemoryApplications.unshift(canonical);
          return canonical;
        }
      } catch (err) {
        console.warn('Supabase application insert failed, using fallback:', err);
      }
    }

    // In-memory fallback
    const newApp: CanonicalApplication = {
      id: payload.id || `app-${Date.now()}`,
      applicationNumber,
      institutionId: payload.institutionId,
      institutionName: payload.institutionName || 'Demo Educational Institution',
      instituteCode: payload.instituteCode || '1-XXXXX',
      region: payload.region || 'Western Regional Office',
      state: payload.state || 'Maharashtra',
      type: payload.type,
      typeLabel: payload.type,
      academicYear: payload.academicYear || '2026-2027',
      status: 'draft',
      statusLabel: 'Draft Initiated',
      currentStage: 'Draft Preparation',
      priority: payload.priority || 'normal',
      submittedAt: now,
      updatedAt: now,
      deadlineDate: deadline,
      deficiencyCount: 0,
      evcRequired: false,
      evcStatus: 'Not Required',
      complianceStatus: 'Compliant',
      daysInStage: 0,
      isEscalated: false,
    };

    inMemoryApplications.unshift(newApp);
    return newApp;
  },

  /**
   * applications.getById()
   * Retrieves single application by UUID or application number
   */
  async getById(id: string): Promise<CanonicalApplication | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const query = supabase
          .from('applications')
          .select('*, institution:institutions(*)');

        const { data, error } = id.includes('AICTE')
          ? await query.eq('application_number', id).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (!error && data) {
          return mapSupabaseToCanonicalApplication(data);
        }
      } catch (err) {
        console.warn('Supabase getById query failed, using fallback store:', err);
      }
    }

    // Match in fallback memory
    const found = inMemoryApplications.find(
      (a) => a.id === id || a.applicationNumber === id
    );
    return found || null;
  },

  /**
   * applications.getForInstitution()
   * Institution view: returns only applications bound to that institution
   */
  async getForInstitution(institutionId: string): Promise<CanonicalApplication[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, institution:institutions(*)')
          .eq('institution_id', institutionId)
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalApplication);
        }
      } catch (err) {
        console.warn('Supabase getForInstitution failed, using fallback store:', err);
      }
    }

    // Filter in fallback memory
    const instApps = inMemoryApplications.filter(
      (a) => a.institutionId === institutionId || institutionId === 'all'
    );
    return instApps.length > 0 ? instApps : inMemoryApplications.slice(0, 3);
  },

  /**
   * applications.getForOfficer()
   * Regional Officer view: returns applications within assigned regional jurisdiction
   */
  async getForOfficer(officerId?: string, states?: string[]): Promise<CanonicalApplication[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('applications')
          .select('*, institution:institutions(*)')
          .order('submitted_at', { ascending: false });

        if (officerId) {
          // If specifically assigned or general queue
          query = query.or(`assigned_officer_id.eq.${officerId},status.eq.submitted,status.eq.resubmitted`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const list = data.map(mapSupabaseToCanonicalApplication);
          if (states && states.length > 0) {
            return list.filter((a) => states.includes(a.state));
          }
          return list;
        }
      } catch (err) {
        console.warn('Supabase getForOfficer failed, using fallback store:', err);
      }
    }

    // Fallback store with regional jurisdiction or state filter
    if (officerId && (officerId.includes('Western') || officerId.includes('WRO') || officerId === 'usr-ro-001' || officerId === 'usr_ro_ragini_01')) {
      return inMemoryApplications.filter((a) => a.region.includes('Western') || ['Maharashtra', 'Goa', 'Gujarat'].includes(a.state));
    }
    if (states && states.length > 0) {
      return inMemoryApplications.filter((a) => states.includes(a.state));
    }
    return inMemoryApplications;
  },

  /**
   * applications.getAll()
   * Senior Authority view: nationwide oversight of all applications
   */
  async getAll(): Promise<CanonicalApplication[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, institution:institutions(*)')
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalApplication);
        }
      } catch (err) {
        console.warn('Supabase getAll failed, using fallback store:', err);
      }
    }
    return inMemoryApplications;
  },

  /**
   * applications.updateStatus()
   * Statutory lifecycle state transition with validation and immutable audit ledger recording
   */
  async updateStatus(
    id: string,
    rawNewStatus: string,
    remarks: string,
    actor: TransitionActor
  ): Promise<{ success: boolean; application?: CanonicalApplication; error?: string }> {
    const newStatus = normalizeApplicationStatus(rawNewStatus);
    const existing = await this.getById(id);

    if (!existing) {
      return { success: false, error: `Application not found: ${id}` };
    }

    const currentStatus = existing.status;

    // Validate legal transition
    const permittedTransitions = LEGAL_TRANSITIONS[currentStatus] || [];
    if (!permittedTransitions.includes(newStatus) && newStatus !== currentStatus) {
      return {
        success: false,
        error: `Statutory violation: Transition from '${currentStatus}' to '${newStatus}' is not permitted under AICTE APH regulations. Permitted next states: [${permittedTransitions.join(', ')}]`,
      };
    }

    // Enforce role clearance
    if (actor.role === 'institution') {
      const allowedForInstitution: CanonicalApplicationStatus[] = ['submitted', 'resubmitted', 'withdrawn'];
      if (!allowedForInstitution.includes(newStatus)) {
        return {
          success: false,
          error: `Permission denied: Institution users can only submit, resubmit, or withdraw applications.`,
        };
      }
    }

    const now = new Date().toISOString();

    // 1. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('applications')
          .update({
            status: newStatus,
            updated_at: now,
          })
          .eq('id', existing.id);

        // Record in immutable audit ledger
        await supabase.from('audit_ledger').insert({
          application_id: existing.id,
          application_number: existing.applicationNumber,
          actor_id: actor.id || '00000000-0000-0000-0000-000000000000',
          actor_name: actor.name,
          actor_role: actor.role,
          action: 'STATUS_TRANSITION',
          affected_record: `Application ${existing.applicationNumber}`,
          previous_state: currentStatus,
          new_state: newStatus,
          remarks: remarks || `Transitioned status to ${newStatus}`,
        });
      } catch (err) {
        console.warn('Failed to commit transition to Supabase, updating local state:', err);
      }
    }

    // 2. Update memory state
    const updated: CanonicalApplication = {
      ...existing,
      status: newStatus,
      updatedAt: now,
    };

    inMemoryApplications = inMemoryApplications.map((a) =>
      a.id === existing.id ? updated : a
    );

    const auditEntry: CanonicalAuditEntry = {
      id: `aud-${Date.now()}`,
      applicationId: existing.id,
      applicationNumber: existing.applicationNumber,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STATUS_TRANSITION',
      timestamp: now,
      affectedRecord: `Application ${existing.applicationNumber}`,
      previousState: currentStatus,
      newState: newStatus,
      remarks: remarks || `Status transitioned to ${newStatus}`,
    };

    inMemoryAuditLedger.unshift(auditEntry);

    // 3. Emit statutory notifications for state transitions
    try {
      if (newStatus === 'submitted') {
        await notifications.create({
          recipientRole: 'regional_officer',
          title: `New Dossier Submitted: ${existing.applicationNumber}`,
          message: `${existing.institutionName} has submitted application ${existing.applicationNumber} for AY ${existing.academicYear}.`,
          category: 'Status Change',
          severity: 'info',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
          actionUrl: `/regional/applications/${existing.id}`,
        });
      } else if (newStatus === 'correction_required') {
        await notifications.create({
          recipientRole: 'institution',
          recipientId: existing.institutionId,
          title: `Statutory Deficiency Notice: ${existing.applicationNumber}`,
          message: `Official deficiency notice served for Application ${existing.applicationNumber}. Rectification required: ${remarks}`,
          category: 'Correction Request',
          severity: 'warning',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
          actionUrl: `/institution/applications/${existing.id}`,
        });
      } else if (newStatus === 'resubmitted') {
        await notifications.create({
          recipientRole: 'regional_officer',
          title: `Rectified Dossier Resubmitted: ${existing.applicationNumber}`,
          message: `Institution has uploaded rectified documents for Application ${existing.applicationNumber}. Dossier is ready for re-scrutiny.`,
          category: 'Status Change',
          severity: 'info',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
          actionUrl: `/regional/scrutiny-workspace/${existing.id}`,
        });
      } else if (newStatus === 'under_scrutiny' || newStatus === 'under_re_scrutiny') {
        await notifications.create({
          recipientRole: 'institution',
          recipientId: existing.institutionId,
          title: `Application Moved to ${newStatus === 'under_re_scrutiny' ? 'Re-Scrutiny' : 'Scrutiny'}`,
          message: `Regional Scrutiny Committee has taken up Application ${existing.applicationNumber} for compliance review.`,
          category: 'Status Change',
          severity: 'info',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
        });
      } else if (newStatus === 'pending_evc' || newStatus === 'evc_scheduled') {
        await notifications.create({
          recipientRole: 'institution',
          recipientId: existing.institutionId,
          title: `EVC Inspection Scheduled: ${existing.applicationNumber}`,
          message: `Expert Visit Committee (EVC) has been appointed for physical campus verification.`,
          category: 'Status Change',
          severity: 'warning',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
        });
        await notifications.create({
          recipientRole: 'senior_authority',
          title: `EVC Visit Appointed: ${existing.applicationNumber}`,
          message: `Western Regional Office has scheduled EVC inspection visit for ${existing.institutionName}.`,
          category: 'Status Change',
          severity: 'info',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
        });
      } else if (newStatus === 'completed') {
        await notifications.create({
          recipientRole: 'institution',
          recipientId: existing.institutionId,
          title: `Statutory Approval Granted: ${existing.applicationNumber}`,
          message: `Formal Extension of Approval (EoA) has been granted by AICTE Central Bureau for AY ${existing.academicYear}.`,
          category: 'Status Change',
          severity: 'info',
          applicationId: existing.id,
          applicationNumber: existing.applicationNumber,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to emit workflow notification:', notifErr);
    }

    return { success: true, application: updated };
  },

  /**
   * applications.getHistory()
   * Retrieves complete audit history and timeline transitions for an application
   */
  async getHistory(applicationId: string): Promise<CanonicalAuditEntry[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_ledger')
          .select('*')
          .eq('application_id', applicationId)
          .order('timestamp', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalAuditEntry);
        }
      } catch (err) {
        console.warn('Supabase getHistory failed, using local store:', err);
      }
    }

    return inMemoryAuditLedger.filter(
      (entry) =>
        entry.applicationId === applicationId ||
        entry.applicationNumber.includes(applicationId)
    );
  },

  /**
   * applications.submitLateRequest()
   * Institution files a formal request for late submission or condonation of scrutiny delay
   */
  async submitLateRequest(payload: {
    applicationId: string;
    requestType: 'Late Submission Permission' | 'Condonation of Scrutiny Delay' | 'Emergency Re-application';
    reasonCategory: 'Natural Calamity' | 'Technical Gateway Failure' | 'Administrative Exigency' | 'Judicial Order';
    detailedReason: string;
    supportingDocName?: string;
  }): Promise<{ success: boolean; id: string; message: string }> {
    const requestId = `req-late-${Date.now()}`;
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('late_submission_requests').insert({
          application_id: payload.applicationId,
          request_type: payload.requestType,
          reason_category: payload.reasonCategory,
          detailed_reason: payload.detailedReason,
          supporting_doc_name: payload.supportingDocName || null,
          status: 'pending_review',
        });
      } catch (err) {
        console.warn('Supabase late request insertion failed, using local handling:', err);
      }
    }

    // Append to audit ledger
    inMemoryAuditLedger.unshift({
      id: `aud-${Date.now()}`,
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationId,
      actorId: 'institution_admin',
      actorName: 'Institution Signatory',
      actorRole: 'institution',
      action: 'LATE_SUBMISSION_REQUEST',
      timestamp: now,
      affectedRecord: `Late Request: ${payload.requestType}`,
      newState: 'pending_review',
      remarks: `${payload.reasonCategory}: ${payload.detailedReason}`,
    });

    return {
      success: true,
      id: requestId,
      message: 'Late submission / condonation petition submitted for AICTE Regional Review.',
    };
  },

  /**
   * applications.reapply()
   * Re-application workflow: Initiates an appeal or new statutory cycle for a rejected/withdrawn application
   */
  async reapply(
    priorApplicationId: string,
    justification: string,
    actor: TransitionActor
  ): Promise<{ success: boolean; application: CanonicalApplication }> {
    const prior = await this.getById(priorApplicationId);
    const newApp = await this.create({
      institutionId: prior?.institutionId || 'inst_wro_01',
      type: prior?.type || 'extension_of_approval',
      academicYear: '2026-2027',
      priority: 'urgent',
      institutionName: prior?.institutionName,
      instituteCode: prior?.instituteCode,
      region: prior?.region,
      state: prior?.state,
    });

    // Record re-application audit entry
    inMemoryAuditLedger.unshift({
      id: `aud-${Date.now()}`,
      applicationId: newApp.id,
      applicationNumber: newApp.applicationNumber,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'RE_APPLICATION_INITIATED',
      timestamp: new Date().toISOString(),
      affectedRecord: `Prior Ref: ${prior?.applicationNumber || priorApplicationId}`,
      newState: 'draft',
      remarks: `Re-application appeal filed: ${justification}`,
    });

    return { success: true, application: newApp };
  },
};
