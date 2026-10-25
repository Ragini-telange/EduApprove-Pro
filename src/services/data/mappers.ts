import {
  CanonicalApplication,
  CanonicalApplicationStatus,
  CanonicalPriorityLevel,
  CanonicalDocument,
  CanonicalComplianceRequirement,
  CanonicalNotification,
  CanonicalAuditEntry,
  CanonicalInstitution,
} from '../../types/canonical';

// ============================================================================
// STATUS & TYPE LABEL DICTIONARIES
// ============================================================================

export const STATUS_LABELS: Record<CanonicalApplicationStatus, string> = {
  draft: 'Draft Initiated',
  submitted: 'Submitted to Regional Office',
  under_scrutiny: 'Under Regional Scrutiny',
  correction_required: 'Deficiency Notified (Correction Required)',
  resubmitted: 'Resubmitted by Institution',
  under_re_scrutiny: 'Under Re-Scrutiny',
  pending_evc: 'Pending Expert Visit Committee',
  evc_scheduled: 'EVC Visit Scheduled',
  under_next_stage: 'Standing Appellate Review (SAC/SHC)',
  completed: 'Statutory Approval Granted (EOA)',
  rejected: 'Application Rejected',
  withdrawn: 'Application Withdrawn',
};

export const TYPE_LABELS: Record<string, string> = {
  new_institution: 'Establishment of New Institution',
  extension_of_approval: 'Extension of Approval (EoA)',
  increase_in_intake: 'Increase in Intake / Additional Course',
  closure_of_course: 'Closure of Course / Program',
  change_of_site: 'Change of Site / Location',
  conversion_of_women_inst: 'Conversion to Co-Ed Institution',
};

// ============================================================================
// NORMALIZERS
// ============================================================================

export function normalizeApplicationStatus(rawStatus: string): CanonicalApplicationStatus {
  if (!rawStatus) return 'draft';
  const clean = rawStatus.toLowerCase().trim().replace(/[\s-]+/g, '_');

  switch (clean) {
    case 'draft':
      return 'draft';
    case 'submitted':
    case 'submitted_to_regional_office':
      return 'submitted';
    case 'under_scrutiny':
    case 'scrutiny':
    case 'under_scrutiny_committee_review':
      return 'under_scrutiny';
    case 'correction_required':
    case 'deficiency_notified':
    case 'deficiency_identified':
    case 'deficiency_communicated':
      return 'correction_required';
    case 'resubmitted':
    case 'resubmitted_by_institution':
      return 'resubmitted';
    case 'under_re_scrutiny':
    case 're_scrutiny':
      return 'under_re_scrutiny';
    case 'pending_evc':
    case 'evc_pending':
      return 'pending_evc';
    case 'evc_scheduled':
      return 'evc_scheduled';
    case 'under_next_stage':
    case 'pending_hq_approval':
    case 'bureau_hq_final_review':
    case 'sac_shc_review':
      return 'under_next_stage';
    case 'completed':
    case 'approved':
    case 'statutory_approval_granted':
      return 'completed';
    case 'rejected':
      return 'rejected';
    case 'withdrawn':
      return 'withdrawn';
    default:
      return 'under_scrutiny';
  }
}

// ============================================================================
// SUPABASE ROW TO CANONICAL APPLICATION
// ============================================================================

export function mapSupabaseToCanonicalApplication(row: any): CanonicalApplication {
  const inst = row.institution || row.institutions || {};
  const status = normalizeApplicationStatus(row.status);
  const type = row.type || 'extension_of_approval';

  return {
    id: String(row.id),
    applicationNumber: row.application_number || `AICTE-${row.id?.slice?.(0, 8) || 'APP'}`,
    institutionId: String(row.institution_id || inst.id || ''),
    institutionName: inst.name || row.institution_name || 'Institution Administered College',
    instituteCode: inst.aicte_permanent_id || row.institute_code || '1-XXXXX',
    region: inst.regional_office || row.region || 'Western Regional Office',
    state: inst.state || row.state || 'Maharashtra',
    type,
    typeLabel: TYPE_LABELS[type] || type,
    academicYear: row.academic_year || '2026-2027',
    status,
    statusLabel: STATUS_LABELS[status] || status,
    currentStage: row.current_stage || STATUS_LABELS[status],
    priority: (row.priority as CanonicalPriorityLevel) || 'normal',
    submittedAt: row.submitted_at || row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    deadlineDate: row.deadline_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    assignedOfficerId: row.assigned_officer_id ? String(row.assigned_officer_id) : undefined,
    assignedOfficerName: row.assigned_officer_name || undefined,
    deficiencyCount: Number(row.deficiency_count || 0),
    evcRequired: Boolean(row.evc_required),
    evcStatus: row.evc_status || (row.evc_required ? 'Pending Scheduling' : 'Not Required'),
    complianceStatus: row.compliance_status || (row.deficiency_count > 0 ? 'Action Required' : 'Compliant'),
    daysInStage: row.days_in_stage || Math.max(1, Math.floor((Date.now() - new Date(row.updated_at || row.submitted_at || Date.now()).getTime()) / 86400000)),
    isEscalated: Boolean(row.is_escalated || (row.priority === 'critical')),
  };
}

// ============================================================================
// SUPABASE ROW TO CANONICAL DOCUMENT
// ============================================================================

export function mapSupabaseToCanonicalDocument(row: any): CanonicalDocument {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    name: row.name || row.file_name || 'Statutory Document',
    category: row.category || 'Land & Building',
    code: row.code || 'DOC-GEN-01',
    fileName: row.file_name || 'document.pdf',
    fileSize: row.file_size || '1.2 MB',
    fileType: row.file_type || 'application/pdf',
    version: Number(row.version || 1),
    storagePath: row.storage_path || '',
    previewUrl: row.preview_url || undefined,
    status: (row.status || 'pending') as 'pending' | 'verified' | 'rejected' | 'correction_required',
    observations: row.observations || undefined,
    deficiencyReason: row.deficiency_reason || undefined,
    deficiencyRemarks: row.deficiency_remarks || undefined,
    verifiedBy: row.verified_by ? String(row.verified_by) : undefined,
    verifiedAt: row.verified_at || undefined,
    issueDate: row.issue_date || undefined,
    expiryDate: row.expiry_date || undefined,
    uploadedAt: row.uploaded_at || row.created_at || new Date().toISOString(),
    isUpdatedInResubmission: Boolean(row.is_updated_in_resubmission),
  };
}

// ============================================================================
// SUPABASE ROW TO CANONICAL COMPLIANCE
// ============================================================================

export function mapSupabaseToCanonicalCompliance(row: any): CanonicalComplianceRequirement {
  return {
    id: String(row.id),
    institutionId: String(row.institution_id),
    applicationId: row.application_id ? String(row.application_id) : undefined,
    title: row.title || 'Statutory Compliance Clause',
    clause: row.clause || 'AICTE APH Clause',
    description: row.description || '',
    mandatoryDocumentRequired: row.mandatory_document_required !== false,
    dueDate: row.due_date || new Date().toISOString().split('T')[0],
    status: (row.status || 'pending') as 'pending' | 'submitted' | 'verified' | 'overdue' | 'escalated',
    submittedDocumentName: row.submitted_document_name || undefined,
    submittedDocumentUrl: row.submitted_document_url || undefined,
    submittedAt: row.submitted_at || undefined,
    documentExpiryDate: row.document_expiry_date || undefined,
    isRenewalDueSoon: Boolean(row.is_renewal_due_soon),
    escalationLevel: (row.escalation_level || 'none') as 'none' | 'warning' | 'critical_overdue',
    officerRemarks: row.officer_remarks || undefined,
  };
}

// ============================================================================
// SUPABASE ROW TO CANONICAL NOTIFICATION
// ============================================================================

export function mapSupabaseToCanonicalNotification(row: any): CanonicalNotification {
  return {
    id: String(row.id),
    recipientRole: row.recipient_role || 'institution',
    recipientId: row.recipient_id ? String(row.recipient_id) : undefined,
    title: row.title || 'Regulatory Alert',
    message: row.message || '',
    category: row.category || 'General',
    severity: (row.severity || 'info') as 'info' | 'warning' | 'critical',
    applicationId: row.application_id ? String(row.application_id) : undefined,
    applicationNumber: row.application_number || undefined,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || new Date().toISOString(),
    actionUrl: row.action_url || undefined,
  };
}

// ============================================================================
// SUPABASE ROW TO CANONICAL AUDIT ENTRY
// ============================================================================

export function mapSupabaseToCanonicalAuditEntry(row: any): CanonicalAuditEntry {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    applicationNumber: row.application_number || '',
    actorId: String(row.actor_id),
    actorName: row.actor_name || 'System Operator',
    actorRole: row.actor_role || 'regional_officer',
    action: row.action || 'STAGE_TRANSITION',
    timestamp: row.timestamp || new Date().toISOString(),
    affectedRecord: row.affected_record || 'Application',
    previousState: row.previous_state || undefined,
    newState: row.new_state || '',
    remarks: row.remarks || '',
  };
}

// ============================================================================
// ADAPTERS FOR EXISTING MODULES (Backward Compatibility)
// ============================================================================

/**
 * Converts CanonicalApplication to Janhavi's Senior Authority ApplicationRecord
 */
export function canonicalToAuthorityRecord(app: CanonicalApplication): any {
  const isOverdue =
    app.priority === 'critical' ||
    (app.deadlineDate && new Date(app.deadlineDate).getTime() < Date.now());
  const isApproaching =
    !isOverdue &&
    app.deadlineDate &&
    new Date(app.deadlineDate).getTime() - Date.now() < 7 * 86400000;
  const deadlineStatus: 'Normal' | 'Approaching Deadline' | 'Overdue' = isOverdue
    ? 'Overdue'
    : isApproaching
    ? 'Approaching Deadline'
    : 'Normal';

  const statusMap: Record<string, string> = {
    draft: 'Submitted',
    submitted: 'Submitted',
    under_scrutiny: 'Under Scrutiny',
    correction_required: 'Deficiency Communicated',
    resubmitted: 'Under Scrutiny',
    under_re_scrutiny: 'Under Scrutiny',
    pending_evc: 'Under Scrutiny',
    evc_scheduled: 'EVC Scheduled',
    under_next_stage: 'Pending HQ Approval',
    completed: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Rejected',
  };

  const stageMap: Record<string, string> = {
    draft: 'Submission',
    submitted: 'Submission',
    under_scrutiny: 'Document Scrutiny',
    correction_required: 'Deficiency Rectification',
    resubmitted: 'Document Scrutiny',
    under_re_scrutiny: 'Document Scrutiny',
    pending_evc: 'EVC Inspection',
    evc_scheduled: 'EVC Inspection',
    under_next_stage: 'Standing Appellate Committee (SAC)',
    completed: 'Bureau HQ Final Review',
    rejected: 'Standing Appellate Committee (SAC)',
    withdrawn: 'Standing Appellate Committee (SAC)',
  };

  const currentStatus = statusMap[app.status] || 'Submitted';
  const currentStage = stageMap[app.status] || app.currentStage || 'Submission';

  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    institutionId: app.institutionId,
    institutionName: app.institutionName,
    instituteCode: app.instituteCode,
    region: app.region || 'Western',
    state: app.state || 'Maharashtra',
    applicationType: app.typeLabel,
    academicYear: app.academicYear,
    currentStage,
    currentStatus,
    assignedOfficer: app.assignedOfficerName || 'Regional Officer Desk',
    assignedOfficerEmail: 'ro.desk@aicte-india.org',
    submittedDate: (app.submittedAt || new Date().toISOString()).split('T')[0],
    deadlineDate: app.deadlineDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    deadlineStatus,
    evcStatus: app.evcStatus || (app.evcRequired ? 'Pending Scheduling' : 'Not Required'),
    complianceStatus: app.complianceStatus || (app.deficiencyCount > 0 ? 'Critical Deficiency' : 'Compliant'),
    deficienciesCount: app.deficiencyCount || 0,
    expiringDocumentsCount: 0,
    daysInCurrentStage: app.daysInStage || 1,
    processingTimeDays: 14,
    isEscalated: Boolean(app.isEscalated || app.priority === 'critical'),
    responsibleTeam: 'Regional Scrutiny Panel',
    recommendedAction: 'Proceed with regulatory scrutiny',
    lastUpdated: app.updatedAt,
    intakeApplied: 120,
    programs: ['Engineering & Technology'],
  };
}

/**
 * Converts CanonicalApplication to Ragini's Regional Officer Application
 */
export function canonicalToRegionalApplication(app: CanonicalApplication): any {
  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    institutionId: app.institutionId,
    institution: {
      id: app.institutionId,
      aictePermanentId: app.instituteCode,
      name: app.institutionName,
      address: 'Educational Campus',
      city: 'Pune',
      state: app.state,
      pinCode: '411001',
      regionalOffice: app.region,
      institutionType: 'Govt-Aided',
      contactPerson: 'Principal Desk',
      contactEmail: 'contact@institution.edu.in',
      contactPhone: '+91 20 2500 0000',
      establishedYear: 2000,
    },
    type: app.type,
    academicYear: app.academicYear,
    status: app.status,
    priority: app.priority,
    submittedAt: app.submittedAt,
    updatedAt: app.updatedAt,
    assignedOfficerId: app.assignedOfficerId,
    assignedOfficerName: app.assignedOfficerName,
    deadlineDate: app.deadlineDate,
    deficiencyCount: app.deficiencyCount,
    evcRequired: app.evcRequired,
    reScrutinyCount: 0,
    remarksHistory: (app as any).remarksHistory || [],
    documents: [],
  };
}

/**
 * Converts CanonicalApplication to Sakshi's Institution Admin ApplicationFull
 */
export function canonicalToInstitutionApplication(app: CanonicalApplication): any {
  return {
    id: app.id,
    institution_id: app.institutionId,
    application_number: app.applicationNumber,
    application_type: app.typeLabel,
    academic_year: app.academicYear,
    status: app.statusLabel,
    current_stage: app.currentStage,
    submitted_date: app.submittedAt.split('T')[0],
    submitted_at: app.submittedAt,
    last_updated_at: app.updatedAt,
    remarks: `Application is currently in stage: ${app.currentStage}`,
    timeline: [
      { stage: 'Draft Preparation', status: 'completed', date: app.submittedAt.split('T')[0] },
      { stage: 'Application Submission', status: 'completed', date: app.submittedAt.split('T')[0] },
      { stage: 'Regional Scrutiny', status: app.status === 'under_scrutiny' ? 'current' : 'completed' },
      { stage: 'Document Verification', status: 'pending' },
      { stage: 'Final Sanction', status: 'pending' },
    ],
    created_at: app.submittedAt,
    updated_at: app.updatedAt,
  };
}
