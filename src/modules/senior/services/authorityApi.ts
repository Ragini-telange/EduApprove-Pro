import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { applications as canonicalApplications } from '../../../services/applications/applicationsService';
import { canonicalToAuthorityRecord } from '../../../services/data/mappers';
import type { 
  ApplicationRecord, 
  ApplicationStage,
  ApplicationStatus,
  ApplicationType,
  KPICounters, 
  DashboardFilters, 
  AuditLogItem,
  AlertHealthStatus,
  RegionalGeoMetric,
  DelayBottleneckStage,
  RuleBasedRiskIndicator,
  DelayIntelligenceData,
  EscalationCase,
  EscalationPolicyConfig,
  EscalationLevel,
  EscalationCategory,
  ScheduledSweepResult,
  ReportType,
  ReportFilterState,
  AdministrativeRemark,
  FollowUpDirective
} from '../types/authority';

// ============================================================================
// AUTHORITATIVE SEED RECORDS (Separately and explicitly labelled fallback)
// Based on AICTE Approval Process Handbook (APH 2026-2027) structure
// ============================================================================
const DEMO_FALLBACK_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app_1001',
    applicationNumber: 'AICTE/2026-27/1-9382104921',
    institutionId: 'inst_wro_01',
    institutionName: 'Pune Institute of Computer Technology (PICT)',
    instituteCode: '1-4293811',
    region: 'Western',
    state: 'Maharashtra',
    applicationType: 'Increase in Intake',
    academicYear: '2026-2027',
    currentStage: 'Bureau HQ Final Review',
    currentStatus: 'Pending HQ Approval',
    assignedOfficer: 'Dr. S. K. Mahajan (RO Western)',
    assignedOfficerEmail: 'ro.western@aicte-india.org',
    submittedDate: '2026-08-12',
    deadlineDate: '2026-10-30',
    deadlineStatus: 'Approaching Deadline',
    evcStatus: 'Report Submitted',
    complianceStatus: 'Compliant',
    deficienciesCount: 0,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 5,
    processingTimeDays: 71,
    isEscalated: true,
    escalationReason: 'Pending final Bureau approval sign-off; academic session commencement deadline approaching',
    responsibleTeam: 'Central Approval Bureau (HQ)',
    recommendedAction: 'Verify EVC biometric attendance verification and grant Statutory Approval',
    lastUpdated: '2026-10-21T14:30:00Z',
    intakeApplied: 180,
    programs: ['Artificial Intelligence & Data Science', 'Computer Engineering'],
  },
  {
    id: 'app_1002',
    applicationNumber: 'AICTE/2026-27/1-9382105118',
    institutionId: 'inst_nro_02',
    institutionName: 'Delhi Technological University (Affiliated Extension)',
    instituteCode: '1-2098471',
    region: 'Northern',
    state: 'Delhi',
    applicationType: 'Introduction of New Course',
    academicYear: '2026-2027',
    currentStage: 'EVC Inspection',
    currentStatus: 'EVC Scheduled',
    assignedOfficer: 'Er. Rajesh Bansal (RO Northern)',
    assignedOfficerEmail: 'ro.northern@aicte-india.org',
    submittedDate: '2026-07-28',
    deadlineDate: '2026-10-15',
    deadlineStatus: 'Overdue',
    evcStatus: 'Delayed',
    evcScheduledDate: '2026-10-10',
    complianceStatus: 'Pending Submission',
    deficienciesCount: 2,
    expiringDocumentsCount: 1,
    daysInCurrentStage: 16,
    processingTimeDays: 86,
    isEscalated: true,
    escalationReason: 'Expert Visiting Committee (EVC) physical inspection report delayed by 12 days past statutory norm',
    responsibleTeam: 'Northern Regional Inspection Committee',
    recommendedAction: 'Issue reminder to Inspection Panel Chairman or reassign substitute scrutiny expert',
    lastUpdated: '2026-10-22T09:15:00Z',
    intakeApplied: 60,
    programs: ['Cyber Security & Digital Forensics'],
  },
  {
    id: 'app_1003',
    applicationNumber: 'AICTE/2026-27/1-9382109923',
    institutionId: 'inst_sro_03',
    institutionName: 'PSG College of Technology',
    instituteCode: '1-1029381',
    region: 'Southern',
    state: 'Tamil Nadu',
    applicationType: 'Extension of Approval (EoA)',
    academicYear: '2026-2027',
    currentStage: 'Bureau HQ Final Review',
    currentStatus: 'Approved',
    assignedOfficer: 'Dr. K. Ramanathan (RO Southern)',
    assignedOfficerEmail: 'ro.southern@aicte-india.org',
    submittedDate: '2026-06-15',
    deadlineDate: '2026-09-30',
    deadlineStatus: 'Normal',
    evcStatus: 'Not Required',
    complianceStatus: 'Compliant',
    deficienciesCount: 0,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 0,
    processingTimeDays: 45,
    isEscalated: false,
    lastUpdated: '2026-09-28T16:00:00Z',
    intakeApplied: 720,
    programs: ['Mechanical Engineering', 'Electrical Engineering', 'Information Technology'],
  },
  {
    id: 'app_1004',
    applicationNumber: 'AICTE/2026-27/1-9382110452',
    institutionId: 'inst_cro_04',
    institutionName: 'Maulana Azad National Institute of Technology',
    instituteCode: '1-3049182',
    region: 'Central',
    state: 'Madhya Pradesh',
    applicationType: 'New Technical Institution',
    academicYear: '2026-2027',
    currentStage: 'Document Scrutiny',
    currentStatus: 'Deficiency Communicated',
    assignedOfficer: 'Er. Alok Sharma (RO Central)',
    assignedOfficerEmail: 'ro.central@aicte-india.org',
    submittedDate: '2026-08-30',
    deadlineDate: '2026-11-15',
    deadlineStatus: 'Normal',
    evcStatus: 'Pending Scheduling',
    complianceStatus: 'Critical Deficiency',
    deficienciesCount: 3,
    expiringDocumentsCount: 2,
    daysInCurrentStage: 14,
    processingTimeDays: 53,
    isEscalated: true,
    escalationReason: 'Fire Safety Certificate and Land Conversion Order pending clarification beyond 10-day limit',
    responsibleTeam: 'Institution Management & RO Central Scrutiny',
    recommendedAction: 'Direct applicant to submit certified occupancy and NBC compliance affidavit within 48h',
    lastUpdated: '2026-10-20T11:45:00Z',
    intakeApplied: 300,
    programs: ['Civil Engineering', 'Electronics & Comm.'],
  },
  {
    id: 'app_1005',
    applicationNumber: 'AICTE/2026-27/1-9382112390',
    institutionId: 'inst_swro_05',
    institutionName: 'R. V. College of Engineering',
    instituteCode: '1-5092817',
    region: 'South-Western',
    state: 'Karnataka',
    applicationType: 'Increase in Intake',
    academicYear: '2026-2027',
    currentStage: 'EVC Inspection',
    currentStatus: 'EVC Report Submitted',
    assignedOfficer: 'Dr. Manjunath Swamy (RO South-Western)',
    assignedOfficerEmail: 'ro.swro@aicte-india.org',
    submittedDate: '2026-08-05',
    deadlineDate: '2026-11-05',
    deadlineStatus: 'Normal',
    evcStatus: 'Report Submitted',
    complianceStatus: 'Compliant',
    deficienciesCount: 0,
    expiringDocumentsCount: 1,
    daysInCurrentStage: 3,
    processingTimeDays: 78,
    isEscalated: false,
    lastUpdated: '2026-10-21T18:20:00Z',
    intakeApplied: 120,
    programs: ['VLSI Design', 'Robotics & Automation'],
  },
  {
    id: 'app_1006',
    applicationNumber: 'AICTE/2026-27/1-9382114811',
    institutionId: 'inst_ero_06',
    institutionName: 'Jadavpur Institute of Advanced Technology',
    instituteCode: '1-6091823',
    region: 'Eastern',
    state: 'West Bengal',
    applicationType: 'New Technical Institution',
    academicYear: '2026-2027',
    currentStage: 'Submission',
    currentStatus: 'Under Scrutiny',
    assignedOfficer: 'Dr. Debabrata Roy (RO Eastern)',
    assignedOfficerEmail: 'ro.eastern@aicte-india.org',
    submittedDate: '2026-09-01',
    deadlineDate: '2026-10-20',
    deadlineStatus: 'Overdue',
    evcStatus: 'Pending Scheduling',
    complianceStatus: 'Pending Submission',
    deficienciesCount: 1,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 18,
    processingTimeDays: 51,
    isEscalated: true,
    escalationReason: 'Initial Scrutiny Committee quorum not formed within specified SLA turnaround time',
    responsibleTeam: 'Eastern Regional Office (ERO)',
    recommendedAction: 'Reassign regional scrutinizer panel or summon regional standing coordinator',
    lastUpdated: '2026-10-19T13:10:00Z',
    intakeApplied: 240,
    programs: ['Biotechnology', 'Chemical Engineering'],
  },
  {
    id: 'app_1007',
    applicationNumber: 'AICTE/2026-27/1-9382116201',
    institutionId: 'inst_nwro_07',
    institutionName: 'Thapar Institute Extension Centre',
    instituteCode: '1-7098172',
    region: 'North-Western',
    state: 'Punjab',
    applicationType: 'Extension of Approval (EoA)',
    academicYear: '2026-2027',
    currentStage: 'Bureau HQ Final Review',
    currentStatus: 'Approved',
    assignedOfficer: 'Er. Harvinder Singh (RO North-Western)',
    assignedOfficerEmail: 'ro.nwro@aicte-india.org',
    submittedDate: '2026-06-20',
    deadlineDate: '2026-09-15',
    deadlineStatus: 'Normal',
    evcStatus: 'Not Required',
    complianceStatus: 'Compliant',
    deficienciesCount: 0,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 0,
    processingTimeDays: 42,
    isEscalated: false,
    lastUpdated: '2026-09-12T10:00:00Z',
    intakeApplied: 480,
    programs: ['Computer Science', 'Data Science'],
  },
  {
    id: 'app_1008',
    applicationNumber: 'AICTE/2026-27/1-9382118334',
    institutionId: 'inst_wro_08',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    instituteCode: '1-4019283',
    region: 'Western',
    state: 'Maharashtra',
    applicationType: 'Introduction of New Course',
    academicYear: '2026-2027',
    currentStage: 'Regional Committee (RC)',
    currentStatus: 'RO Recommended',
    assignedOfficer: 'Dr. S. K. Mahajan (RO Western)',
    assignedOfficerEmail: 'ro.western@aicte-india.org',
    submittedDate: '2026-08-18',
    deadlineDate: '2026-11-10',
    deadlineStatus: 'Normal',
    evcStatus: 'Inspection Completed',
    complianceStatus: 'Compliant',
    deficienciesCount: 0,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 4,
    processingTimeDays: 65,
    isEscalated: false,
    lastUpdated: '2026-10-21T15:45:00Z',
    intakeApplied: 60,
    programs: ['Cyber-Physical Systems & IoT'],
  },
  {
    id: 'app_1009',
    applicationNumber: 'AICTE/2026-27/1-9382120491',
    institutionId: 'inst_scro_09',
    institutionName: 'JNTU College of Engineering Hyderabad',
    instituteCode: '1-8029381',
    region: 'South-Central',
    state: 'Telangana',
    applicationType: 'Closure of Course/Institute',
    academicYear: '2026-2027',
    currentStage: 'Document Scrutiny',
    currentStatus: 'Under Scrutiny',
    assignedOfficer: 'Dr. B. V. Ramana (RO South-Central)',
    assignedOfficerEmail: 'ro.scro@aicte-india.org',
    submittedDate: '2026-09-10',
    deadlineDate: '2026-11-20',
    deadlineStatus: 'Normal',
    evcStatus: 'Not Required',
    complianceStatus: 'Documents Expiring Soon',
    deficienciesCount: 1,
    expiringDocumentsCount: 3,
    daysInCurrentStage: 12,
    processingTimeDays: 42,
    isEscalated: false,
    lastUpdated: '2026-10-22T08:30:00Z',
    intakeApplied: 0,
    programs: ['Progressive Closure of Traditional Production Engg'],
  },
  {
    id: 'app_1010',
    applicationNumber: 'AICTE/2026-27/1-9382123902',
    institutionId: 'inst_nero_10',
    institutionName: 'Assam Engineering College Extension',
    instituteCode: '1-9018273',
    region: 'North-Eastern',
    state: 'Assam',
    applicationType: 'New Technical Institution',
    academicYear: '2026-2027',
    currentStage: 'Standing Appellate Committee (SAC)',
    currentStatus: 'Rejected',
    assignedOfficer: 'Dr. Pranjal Saikia (RO North-Eastern)',
    assignedOfficerEmail: 'ro.nero@aicte-india.org',
    submittedDate: '2026-07-10',
    deadlineDate: '2026-10-01',
    deadlineStatus: 'Overdue',
    evcStatus: 'Report Submitted',
    complianceStatus: 'Critical Deficiency',
    deficienciesCount: 4,
    expiringDocumentsCount: 0,
    daysInCurrentStage: 21,
    processingTimeDays: 104,
    isEscalated: true,
    escalationReason: 'Appellate committee dismissed appeal due to land title dispute and lack of barrier-free access',
    responsibleTeam: 'Standing Appellate Committee (SAC) & Legal Bureau',
    recommendedAction: 'Issue Final Statutory Speaking Order rejecting establishment of technical campus',
    lastUpdated: '2026-10-18T17:00:00Z',
    intakeApplied: 180,
    programs: ['Applied Mechanical Engg', 'Civil & Environmental'],
  }
];

// In-memory state store to maintain mutations during session
let memoryApplications: ApplicationRecord[] = [...DEMO_FALLBACK_APPLICATIONS];

let memoryAuditLogs: AuditLogItem[] = [
  {
    id: 'log_901',
    timestamp: '2026-10-22T10:15:00Z',
    actor: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
    role: 'bureau_officer',
    action: 'STATUTORY_REVIEW_QUEUED',
    applicationId: 'AICTE/2026-27/1-9382104921',
    details: 'Initiated final central bureau compliance audit for Pune Institute of Computer Technology',
  },
  {
    id: 'log_902',
    timestamp: '2026-10-21T16:00:00Z',
    actor: 'Dr. S. K. Mahajan (RO Western)',
    role: 'regional_officer',
    action: 'REGIONAL_RECOMMENDATION_SUBMITTED',
    applicationId: 'AICTE/2026-27/1-9382118334',
    details: 'Submitted Regional Committee recommendation with zero deficiencies for VJTI Mumbai',
  }
];

// ============================================================================
// PHASE 4: ESCALATION POLICY CONFIGURATION & SEED REGISTRY
// ============================================================================

export const DEFAULT_ESCALATION_POLICY: EscalationPolicyConfig = {
  scrutinySlaDays: 15,
  evcSchedulingSlaDays: 10,
  evcReportingSlaDays: 10,
  deficiencyRectificationSlaDays: 10,
  bureauReviewSlaDays: 7,
  stageInactivityThresholdDays: 14,
  level1OverdueDays: 1,
  level2OverdueDays: 5,
  level3OverdueDays: 10,
  documentExpiryWarningDays: 30,
  autoPreventDuplicates: true,
  lastUpdated: '2026-10-22T06:00:00Z',
  updatedBy: 'Dr. Janhavi Hinganghatkar (Central Bureau Officer)',
};

export const DEMO_ESCALATION_CASES: EscalationCase[] = [
  {
    id: 'esc_1002_evc',
    caseId: 'app_1002',
    applicationNumber: 'AICTE/2026-27/1-9382105118',
    complianceReference: 'COMP-2026-NRO-8102',
    institutionId: 'inst_nro_02',
    institutionName: 'Delhi Technological University (Affiliated Extension)',
    instituteCode: '1-2098471',
    region: 'Northern',
    state: 'Delhi',
    currentStage: 'EVC Inspection',
    currentStatus: 'EVC Scheduled',
    assignedRole: 'Northern Regional Inspection Committee & Convenor',
    assignedOfficer: 'Er. Rajesh Bansal (RO Northern)',
    assignedOfficerEmail: 'ro.northern@aicte-india.org',
    originalDeadline: '2026-10-15',
    daysOverdue: 7,
    escalationLevel: 2,
    escalationCategory: 'evc_delay',
    reason: 'EVC physical committee inspection report delayed by 12 days past statutory 10-day window; 2 unrectified deficiencies pending',
    daysInCurrentStage: 16,
    deficienciesCount: 2,
    expiringDocumentsCount: 1,
    evcStatus: 'Delayed',
    triggeredAt: '2026-10-16T08:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'In Progress',
    acknowledgedAt: '2026-10-17T09:30:00Z',
    acknowledgedBy: 'Er. Rajesh Bansal (RO Northern)',
    administrativeRemarks: [
      {
        id: 'rem_1002_1',
        author: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        category: 'Scrutiny Directive',
        text: 'Issued official Bureau reminder to RO Northern to obtain biometric inspection logs within 48h.',
        timestamp: '2026-10-18T11:00:00Z',
      }
    ],
    followUpDirectives: [
      {
        id: 'dir_1002_1',
        type: 'EVC Expedite Order',
        priority: 'High',
        recipientRole: 'Regional Officer (Er. Rajesh Bansal)',
        instructionText: 'Convene replacement peer inspection expert if current committee fails to upload geotagged inspection report by 24 Oct.',
        dispatchedBy: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
        dispatchedAt: '2026-10-18T11:05:00Z',
      }
    ],
    history: [
      {
        id: 'h_1002_1',
        timestamp: '2026-10-16T08:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_1_ALERT_TRIGGERED',
        details: 'Original deadline 2026-10-15 elapsed without EVC report submission. Level 1 Advisory logged.',
        level: 1,
      },
      {
        id: 'h_1002_2',
        timestamp: '2026-10-17T09:30:00Z',
        actor: 'Er. Rajesh Bansal',
        role: 'regional_officer',
        action: 'ESCALATION_ACKNOWLEDGED',
        details: 'Regional Officer acknowledged EVC inspection delay notice and contacted Inspection Convenor.',
        level: 1,
      },
      {
        id: 'h_1002_3',
        timestamp: '2026-10-20T08:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_2_WARNING_TRIGGERED',
        details: 'Overdue duration exceeded 5 days (currently 7 days overdue). Escalated to Level 2 Bureau Warning.',
        level: 2,
      },
      {
        id: 'h_1002_4',
        timestamp: '2026-10-21T11:05:00Z',
        actor: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        action: 'DIRECTIVE_DISPATCHED',
        details: 'Central Bureau Expedite Order dispatched to Northern Regional Office.',
        level: 2,
      }
    ],
  },
  {
    id: 'esc_1004_comp',
    caseId: 'app_1004',
    applicationNumber: 'AICTE/2026-27/1-9382110452',
    complianceReference: 'COMP-2026-CRO-3049',
    institutionId: 'inst_cro_04',
    institutionName: 'Maulana Azad National Institute of Technology',
    instituteCode: '1-3049182',
    region: 'Central',
    state: 'Madhya Pradesh',
    currentStage: 'Document Scrutiny',
    currentStatus: 'Deficiency Communicated',
    assignedRole: 'Central Regional Scrutiny Officer',
    assignedOfficer: 'Er. Alok Sharma (RO Central)',
    assignedOfficerEmail: 'ro.central@aicte-india.org',
    originalDeadline: '2026-11-15',
    daysOverdue: 4,
    escalationLevel: 2,
    escalationCategory: 'compliance_deficiency',
    reason: 'Critical deficiency in Fire Safety Certificate & Land Conversion Order unrectified beyond 10-day limit; 2 statutory NOCs expiring',
    daysInCurrentStage: 14,
    deficienciesCount: 3,
    expiringDocumentsCount: 2,
    evcStatus: 'Pending Scheduling',
    triggeredAt: '2026-10-18T06:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'Open',
    administrativeRemarks: [
      {
        id: 'rem_1004_1',
        author: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        category: 'Legal Compliance',
        text: 'Land conversion document lacks district collector seal. Rectification affidavit required.',
        timestamp: '2026-10-19T14:15:00Z',
      }
    ],
    followUpDirectives: [
      {
        id: 'dir_1004_1',
        type: 'Deficiency Rectification Summons',
        priority: 'High',
        recipientRole: 'Institution Management & RO Central',
        instructionText: 'Direct applicant to submit certified occupancy and NBC compliance affidavit within 48h.',
        dispatchedBy: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
        dispatchedAt: '2026-10-19T14:20:00Z',
      }
    ],
    history: [
      {
        id: 'h_1004_1',
        timestamp: '2026-10-18T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_2_ALERT_TRIGGERED',
        details: 'Critical deficiency unrectified after 10-day statutory window. Level 2 Escalation logged.',
        level: 2,
      }
    ],
  },
  {
    id: 'esc_1006_dormant',
    caseId: 'app_1006',
    applicationNumber: 'AICTE/2026-27/1-9382114811',
    complianceReference: 'COMP-2026-ERO-6091',
    institutionId: 'inst_ero_06',
    institutionName: 'Jadavpur Institute of Advanced Technology',
    instituteCode: '1-6091823',
    region: 'Eastern',
    state: 'West Bengal',
    currentStage: 'Submission',
    currentStatus: 'Under Scrutiny',
    assignedRole: 'Eastern Regional Scrutinizer Panel',
    assignedOfficer: 'Dr. Debabrata Roy (RO Eastern)',
    assignedOfficerEmail: 'ro.eastern@aicte-india.org',
    originalDeadline: '2026-10-20',
    daysOverdue: 2,
    escalationLevel: 1,
    escalationCategory: 'stage_inactivity',
    reason: 'Application remained dormant in Initial Submission scrutiny for 18 days (exceeds 7-day stage SLA and 14-day inactivity threshold)',
    daysInCurrentStage: 18,
    deficienciesCount: 1,
    expiringDocumentsCount: 0,
    evcStatus: 'Pending Scheduling',
    triggeredAt: '2026-10-21T06:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'Open',
    administrativeRemarks: [],
    followUpDirectives: [],
    history: [
      {
        id: 'h_1006_1',
        timestamp: '2026-10-21T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_1_ALERT_TRIGGERED',
        details: 'Inactivity threshold (14 days) exceeded; application pending 18 days in Submission. Level 1 Advisory triggered.',
        level: 1,
      }
    ],
  },
  {
    id: 'esc_1010_apex',
    caseId: 'app_1010',
    applicationNumber: 'AICTE/2026-27/1-9382123902',
    complianceReference: 'COMP-2026-NERO-9018',
    institutionId: 'inst_nero_10',
    institutionName: 'Assam Engineering College Extension',
    instituteCode: '1-9018273',
    region: 'North-Eastern',
    state: 'Assam',
    currentStage: 'Standing Appellate Committee (SAC)',
    currentStatus: 'Rejected',
    assignedRole: 'Standing Appellate Committee (SAC) & Legal Bureau',
    assignedOfficer: 'Dr. Pranjal Saikia (RO North-Eastern)',
    assignedOfficerEmail: 'ro.nero@aicte-india.org',
    originalDeadline: '2026-10-01',
    daysOverdue: 21,
    escalationLevel: 3,
    escalationCategory: 'deadline_breach',
    reason: 'Statutory deadline crossed by 21 days; Standing Appellate Committee dismissed appeal due to land title dispute and lack of barrier-free access',
    daysInCurrentStage: 21,
    deficienciesCount: 4,
    expiringDocumentsCount: 0,
    evcStatus: 'Report Submitted',
    triggeredAt: '2026-10-02T06:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'In Progress',
    acknowledgedAt: '2026-10-03T10:00:00Z',
    acknowledgedBy: 'Dr. Pranjal Saikia (RO North-Eastern)',
    administrativeRemarks: [
      {
        id: 'rem_1010_1',
        author: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        category: 'SAC Referral',
        text: 'Refer to Legal Bureau for drafting speaking order pursuant to SAC rejection findings.',
        timestamp: '2026-10-18T17:30:00Z',
      }
    ],
    followUpDirectives: [
      {
        id: 'dir_1010_1',
        type: 'Show Cause Notice',
        priority: 'Emergency',
        recipientRole: 'Institution Management & SAC Secretariat',
        instructionText: 'Issue formal Speaking Order rejecting establishment of technical campus within 3 working days.',
        dispatchedBy: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
        dispatchedAt: '2026-10-18T17:35:00Z',
      }
    ],
    history: [
      {
        id: 'h_1010_1',
        timestamp: '2026-10-02T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_1_ALERT_TRIGGERED',
        details: 'Original deadline 2026-10-01 elapsed.',
        level: 1,
      },
      {
        id: 'h_1010_2',
        timestamp: '2026-10-07T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_2_WARNING_TRIGGERED',
        details: 'Overdue duration exceeded 5 days without compliance clearance.',
        level: 2,
      },
      {
        id: 'h_1010_3',
        timestamp: '2026-10-12T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_3_APEX_ESCALATION',
        details: 'Overdue duration exceeded 10 days (currently 21 days overdue). Central Apex escalation triggered.',
        level: 3,
      }
    ],
  },
  {
    id: 'esc_1009_docs',
    caseId: 'app_1009',
    applicationNumber: 'AICTE/2026-27/1-9382120491',
    complianceReference: 'COMP-2026-SCRO-8029',
    institutionId: 'inst_scro_09',
    institutionName: 'JNTU College of Engineering Hyderabad',
    instituteCode: '1-8029381',
    region: 'South-Central',
    state: 'Telangana',
    currentStage: 'Document Scrutiny',
    currentStatus: 'Under Scrutiny',
    assignedRole: 'Regional Officer & Document Scrutinizer',
    assignedOfficer: 'Dr. B. V. Ramana (RO South-Central)',
    assignedOfficerEmail: 'ro.scro@aicte-india.org',
    originalDeadline: '2026-11-20',
    daysOverdue: 0,
    escalationLevel: 1,
    escalationCategory: 'document_expiry',
    reason: '3 statutory institutional NOCs (Building Stability, Fire NOC, Land lease) expiring within 15 days requiring authorised follow-up before academic freeze',
    daysInCurrentStage: 12,
    deficienciesCount: 1,
    expiringDocumentsCount: 3,
    evcStatus: 'Not Required',
    triggeredAt: '2026-10-22T06:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'Open',
    administrativeRemarks: [],
    followUpDirectives: [],
    history: [
      {
        id: 'h_1009_1',
        timestamp: '2026-10-22T06:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_1_ALERT_TRIGGERED',
        details: '3 statutory certificates expiring within 15 days. Level 1 Follow-Up Advisory triggered.',
        level: 1,
      }
    ],
  },
  {
    id: 'esc_1001_pict',
    caseId: 'app_1001',
    applicationNumber: 'AICTE/2026-27/1-9382104921',
    complianceReference: 'COMP-2026-WRO-4293',
    institutionId: 'inst_wro_01',
    institutionName: 'Pune Institute of Computer Technology (PICT)',
    instituteCode: '1-4293811',
    region: 'Western',
    state: 'Maharashtra',
    currentStage: 'Bureau HQ Final Review',
    currentStatus: 'Pending HQ Approval',
    assignedRole: 'Central Approval Bureau (HQ)',
    assignedOfficer: 'Dr. S. K. Mahajan (RO Western)',
    assignedOfficerEmail: 'ro.western@aicte-india.org',
    originalDeadline: '2026-10-30',
    daysOverdue: 0,
    escalationLevel: 1,
    escalationCategory: 'stage_inactivity',
    reason: 'Imminent final approval sign-off deadline approaching with regional scrutiny completed',
    daysInCurrentStage: 5,
    deficienciesCount: 0,
    expiringDocumentsCount: 0,
    evcStatus: 'Report Submitted',
    triggeredAt: '2026-10-15T10:00:00Z',
    triggeredBy: 'system_scheduler',
    resolutionStatus: 'Resolved',
    acknowledgedAt: '2026-10-15T11:00:00Z',
    acknowledgedBy: 'Dr. S. K. Mahajan (RO Western)',
    resolvedAt: '2026-10-19T14:30:00Z',
    resolvedBy: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
    resolutionNotes: 'EVC biometric logs verified and zero deficiencies confirmed. Application cleared for Statutory Approval Desk.',
    resolutionProofRef: 'AICTE/WRO/2026/VERIF-8901',
    administrativeRemarks: [
      {
        id: 'rem_1001_1',
        author: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        category: 'Scrutiny Directive',
        text: 'Verified intake applied (180 seats) against cadre ratio norms. Cleared for approval.',
        timestamp: '2026-10-19T14:25:00Z',
      }
    ],
    followUpDirectives: [],
    history: [
      {
        id: 'h_1001_1',
        timestamp: '2026-10-15T10:00:00Z',
        actor: 'Automated Rule Scheduler',
        role: 'system',
        action: 'LEVEL_1_ALERT_TRIGGERED',
        details: 'Approaching deadline advisory recorded.',
        level: 1,
      },
      {
        id: 'h_1001_2',
        timestamp: '2026-10-19T14:30:00Z',
        actor: 'Dr. Janhavi Hinganghatkar',
        role: 'bureau_officer',
        action: 'ESCALATION_RESOLVED',
        details: 'Verified compliance and resolved follow-up. Ref: AICTE/WRO/2026/VERIF-8901',
        level: 1,
      }
    ],
  }
];

let memoryEscalations: EscalationCase[] = [...DEMO_ESCALATION_CASES];
let memoryEscalationPolicy: EscalationPolicyConfig = { ...DEFAULT_ESCALATION_POLICY };

// ============================================================================
// DYNAMIC KPI CALCULATION ENGINE
// ============================================================================
export function computeKPICounters(records: ApplicationRecord[]): KPICounters {
  const totalApplications = records.length;
  
  const applicationsPending = records.filter(
    r => r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
  ).length;

  const applicationsUnderScrutiny = records.filter(
    r => r.currentStage === 'Document Scrutiny' || r.currentStatus === 'Under Scrutiny'
  ).length;

  const applicationsRequiringCorrection = records.filter(
    r => r.currentStatus === 'Deficiency Communicated' || 
         r.currentStage === 'Deficiency Rectification' ||
         r.deficienciesCount > 0
  ).length;

  const overdueApplications = records.filter(
    r => r.deadlineStatus === 'Overdue'
  ).length;

  const completedApplications = records.filter(
    r => r.currentStatus === 'Approved' || r.currentStatus === 'Rejected'
  ).length;

  const pendingEVCSchedulingOrReporting = records.filter(
    r => r.evcStatus === 'Pending Scheduling' || 
         r.evcStatus === 'Scheduled' || 
         r.evcStatus === 'Delayed'
  ).length;

  const pendingComplianceSubmissions = records.filter(
    r => r.complianceStatus === 'Pending Submission' || 
         r.complianceStatus === 'Critical Deficiency'
  ).length;

  const documentsExpiringSoon = records.filter(
    r => r.expiringDocumentsCount > 0 || r.complianceStatus === 'Documents Expiring Soon'
  ).length;

  const overdueEscalations = records.filter(
    r => r.isEscalated && (r.deadlineStatus === 'Overdue' || r.daysInCurrentStage > 14)
  ).length;

  return {
    totalApplications,
    applicationsPending,
    applicationsUnderScrutiny,
    applicationsRequiringCorrection,
    overdueApplications,
    completedApplications,
    pendingEVCSchedulingOrReporting,
    pendingComplianceSubmissions,
    documentsExpiringSoon,
    overdueEscalations,
  };
}

// ============================================================================
// API METHODS
// ============================================================================
export const authorityApi = {
  getDataSource(): 'supabase' | 'authoritative_fallback' {
    return isSupabaseConfigured ? 'supabase' : 'authoritative_fallback';
  },

  async getApplications(filters?: Partial<DashboardFilters>): Promise<{
    data: ApplicationRecord[];
    kpis: KPICounters;
    dataSource: 'supabase' | 'authoritative_fallback';
  }> {
    // 1. Synchronize real live data from canonical applications service
    try {
      const canonicalApps = await canonicalApplications.getAll();
      if (canonicalApps && canonicalApps.length > 0) {
        canonicalApps.forEach((cApp) => {
          const mapped = canonicalToAuthorityRecord(cApp);
          const existingIdx = memoryApplications.findIndex(
            (a) => a.id === mapped.id || a.applicationNumber === mapped.applicationNumber
          );
          if (existingIdx >= 0) {
            memoryApplications[existingIdx] = {
              ...memoryApplications[existingIdx],
              currentStatus: mapped.currentStatus,
              currentStage: mapped.currentStage,
              deadlineStatus: mapped.deadlineStatus,
              deficienciesCount: mapped.deficienciesCount,
              evcStatus: mapped.evcStatus,
              complianceStatus: mapped.complianceStatus,
              isEscalated: mapped.isEscalated,
              lastUpdated: mapped.lastUpdated,
            };
          } else {
            memoryApplications.unshift(mapped);
          }
        });
      }
    } catch (err) {
      console.warn('authorityApi: could not sync canonical applications:', err);
    }

    let dataset = [...memoryApplications];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, institution:institutions(*)')
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          dataset = data.map((d: any) => {
            const inst = d.institution || d.institutions || {};
            return {
              id: d.id,
              applicationNumber: d.application_number || `AICTE/2026-27/${d.id}`,
              institutionId: d.institution_id || inst.id,
              institutionName: inst.name || d.institution_name || 'Educational Institution',
              instituteCode: inst.aicte_permanent_id || d.institute_code || '1-XXXXX',
              region: inst.regional_office || d.region || 'Western',
              state: inst.state || d.state || 'Maharashtra',
              applicationType: d.application_type || d.type || 'Extension of Approval (EoA)',
              academicYear: d.academic_year || '2026-2027',
              currentStage: d.current_stage || 'Bureau HQ Final Review',
              currentStatus: d.status || 'Pending HQ Approval',
              assignedOfficer: d.assigned_officer_name || d.assigned_officer || 'Unassigned',
              assignedOfficerEmail: d.assigned_officer_email,
              submittedDate: d.submitted_at ? d.submitted_at.split('T')[0] : '2026-08-01',
              deadlineDate: d.deadline_date ? d.deadline_date.split('T')[0] : '2026-10-31',
              deadlineStatus: d.deadline_status || 'Normal',
              evcStatus: d.evc_status || 'Not Required',
              complianceStatus: d.compliance_status || 'Compliant',
              deficienciesCount: d.deficiency_count ?? d.deficiencies_count ?? 0,
              expiringDocumentsCount: d.expiring_documents_count || 0,
              daysInCurrentStage: d.days_in_stage || 2,
              processingTimeDays: d.processing_days || 45,
              isEscalated: Boolean(d.is_escalated),
              escalationReason: d.escalation_reason,
              responsibleTeam: d.responsible_team,
              recommendedAction: d.recommended_action,
              lastUpdated: d.updated_at || new Date().toISOString(),
              intakeApplied: d.intake_applied || 120,
              programs: d.programs || ['Technical Engineering'],
            };
          });
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to authoritative dataset:', err);
      }
    }

    if (filters) {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        dataset = dataset.filter(item => 
          item.applicationNumber.toLowerCase().includes(query) ||
          item.institutionName.toLowerCase().includes(query) ||
          item.instituteCode.toLowerCase().includes(query)
        );
      }

      if (filters.region && filters.region !== 'All Regions') {
        dataset = dataset.filter(item => item.region === filters.region);
      }

      if (filters.applicationType && filters.applicationType !== 'All Types') {
        dataset = dataset.filter(item => item.applicationType === filters.applicationType);
      }

      if (filters.stage && filters.stage !== 'All Stages') {
        dataset = dataset.filter(item => item.currentStage === filters.stage);
      }

      if (filters.status && filters.status !== 'All Statuses') {
        dataset = dataset.filter(item => item.currentStatus === filters.status);
      }

      if (filters.deadlineStatus && filters.deadlineStatus !== 'All') {
        dataset = dataset.filter(item => item.deadlineStatus === filters.deadlineStatus);
      }

      if (filters.evcStatus && filters.evcStatus !== 'All') {
        dataset = dataset.filter(item => item.evcStatus === filters.evcStatus);
      }

      if (filters.complianceStatus && filters.complianceStatus !== 'All') {
        dataset = dataset.filter(item => item.complianceStatus === filters.complianceStatus);
      }

      if (filters.startDate) {
        dataset = dataset.filter(item => item.submittedDate >= filters.startDate!);
      }

      if (filters.endDate) {
        dataset = dataset.filter(item => item.submittedDate <= filters.endDate!);
      }
    }

    const kpis = computeKPICounters(dataset);

    return {
      data: dataset,
      kpis,
      dataSource: isSupabaseConfigured ? 'supabase' : 'authoritative_fallback',
    };
  },

  async getApplicationById(id: string): Promise<ApplicationRecord | null> {
    const item = memoryApplications.find(r => r.id === id || r.applicationNumber === id);
    return item || null;
  },

  async reassignOfficer(appId: string, newOfficerName: string, reason: string): Promise<boolean> {
    const index = memoryApplications.findIndex(r => r.id === appId || r.applicationNumber === appId);
    if (index === -1) return false;

    const prevOfficer = memoryApplications[index].assignedOfficer;
    memoryApplications[index] = {
      ...memoryApplications[index],
      assignedOfficer: newOfficerName,
      lastUpdated: new Date().toISOString(),
    };

    memoryAuditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
      role: 'bureau_officer',
      action: 'OFFICER_REASSIGNED',
      applicationId: memoryApplications[index].applicationNumber,
      details: `Reassigned from '${prevOfficer}' to '${newOfficerName}'. Justification: ${reason}`,
    });

    return true;
  },

  async sendOfficialFollowUp(appId: string, instruction: string): Promise<boolean> {
    const index = memoryApplications.findIndex(r => r.id === appId || r.applicationNumber === appId);
    if (index === -1) return false;

    memoryAuditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
      role: 'bureau_officer',
      action: 'STATUTORY_DIRECTIVE_ISSUED',
      applicationId: memoryApplications[index].applicationNumber,
      details: `Issued Central Bureau Follow-up Directive: ${instruction}`,
    });

    return true;
  },

  async executeStatutoryDecision(
    appId: string, 
    decision: 'Approved' | 'Rejected', 
    remarks: string
  ): Promise<boolean> {
    const index = memoryApplications.findIndex(r => r.id === appId || r.applicationNumber === appId);
    if (index === -1) return false;

    const targetApp = memoryApplications[index];

    memoryApplications[index] = {
      ...targetApp,
      currentStatus: decision,
      currentStage: 'Bureau HQ Final Review',
      isEscalated: false,
      lastUpdated: new Date().toISOString(),
    };

    memoryAuditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)',
      role: 'bureau_officer',
      action: `STATUTORY_${decision.toUpperCase()}_EXECUTED`,
      applicationId: targetApp.applicationNumber,
      details: `AICTE Central Bureau statutory decision recorded: ${decision}. Remarks: ${remarks}`,
    });

    try {
      const canonicalStatus = decision === 'Approved' ? 'completed' : 'rejected';
      await canonicalApplications.updateStatus(
        targetApp.id,
        canonicalStatus,
        remarks,
        {
          id: 'usr_hq_janhavi_01',
          name: 'Dr. Janhavi Hinganghatkar',
          role: 'senior_authority',
        }
      );
    } catch (err) {
      console.warn('executeStatutoryDecision canonical sync error:', err);
    }

    return true;
  },

  async submitApplication(appData: {
    institutionId: string;
    institutionName: string;
    instituteCode: string;
    region: string;
    state: string;
    applicationType: ApplicationType;
    intakeApplied: number;
    programs: string[];
    submittedBy?: string;
    assignedOfficer?: string;
    assignedOfficerEmail?: string;
  }): Promise<ApplicationRecord> {
    const id = `app_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const todayStr = timestamp.split('T')[0];
    const deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newApp: ApplicationRecord = {
      id,
      applicationNumber: `AICTE/2026-27/1-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      institutionId: appData.institutionId,
      institutionName: appData.institutionName,
      instituteCode: appData.instituteCode,
      region: appData.region,
      state: appData.state,
      applicationType: appData.applicationType,
      academicYear: '2026-2027',
      currentStage: 'Submission',
      currentStatus: 'Under Scrutiny',
      assignedOfficer: appData.assignedOfficer || (appData.region === 'Western' ? 'Ragini Telange (RO Western)' : 'Assigned Regional Officer'),
      assignedOfficerEmail: appData.assignedOfficerEmail || 'ro.western@aicte-india.org',
      submittedDate: todayStr,
      deadlineDate: deadline,
      deadlineStatus: 'Normal',
      evcStatus: 'Pending Scheduling',
      complianceStatus: 'Compliant',
      deficienciesCount: 0,
      expiringDocumentsCount: 0,
      daysInCurrentStage: 0,
      processingTimeDays: 0,
      isEscalated: false,
      lastUpdated: timestamp,
      intakeApplied: appData.intakeApplied,
      programs: appData.programs,
    };

    memoryApplications.unshift(newApp);

    memoryAuditLogs.unshift({
      id: `log_sub_${Date.now()}`,
      timestamp,
      actor: appData.submittedBy || 'Sakshi Sharma (Institution Admin)',
      role: 'institution_admin',
      action: 'APPLICATION_SUBMITTED',
      applicationId: newApp.applicationNumber,
      details: `New technical application submitted for ${newApp.institutionName} (${newApp.applicationType}, ${newApp.intakeApplied} seats). Allocated to ${newApp.assignedOfficer}.`,
    });

    return newApp;
  },

  async recordScrutinyDeficiency(
    appId: string,
    deficiency: {
      reason: string;
      deficienciesCount?: number;
      officerName?: string;
      officerRole?: string;
    }
  ): Promise<ApplicationRecord | null> {
    const index = memoryApplications.findIndex(r => r.id === appId || r.applicationNumber === appId);
    if (index === -1) return null;

    const count = deficiency.deficienciesCount ?? 1;
    const timestamp = new Date().toISOString();
    const officer = deficiency.officerName || 'Ragini Telange (Regional Officer)';
    const role = deficiency.officerRole || 'regional_officer';

    memoryApplications[index] = {
      ...memoryApplications[index],
      currentStage: 'Deficiency Rectification',
      currentStatus: 'Deficiency Communicated',
      complianceStatus: count >= 3 ? 'Critical Deficiency' : 'Pending Submission',
      deficienciesCount: count,
      escalationReason: deficiency.reason,
      recommendedAction: 'Rectify statutory scrutiny deficiencies and submit compliance affidavit within 10 days.',
      lastUpdated: timestamp,
    };

    memoryAuditLogs.unshift({
      id: `log_def_${Date.now()}`,
      timestamp,
      actor: officer,
      role: role as any,
      action: 'DEFICIENCY_COMMUNICATED',
      applicationId: memoryApplications[index].applicationNumber,
      details: `Scrutiny deficiency recorded by ${officer}: ${deficiency.reason} (${count} items flagged). Status: Deficiency Communicated.`,
    });

    return memoryApplications[index];
  },

  async updateApplicationStage(
    appId: string,
    newStage: ApplicationStage,
    newStatus: ApplicationStatus,
    actor: { name: string; role: string; details?: string }
  ): Promise<ApplicationRecord | null> {
    const index = memoryApplications.findIndex(r => r.id === appId || r.applicationNumber === appId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString();
    const prevStage = memoryApplications[index].currentStage;
    const prevStatus = memoryApplications[index].currentStatus;

    memoryApplications[index] = {
      ...memoryApplications[index],
      currentStage: newStage,
      currentStatus: newStatus,
      lastUpdated: timestamp,
    };

    memoryAuditLogs.unshift({
      id: `log_stage_${Date.now()}`,
      timestamp,
      actor: actor.name,
      role: actor.role as any,
      action: 'STAGE_TRANSITION',
      applicationId: memoryApplications[index].applicationNumber,
      details: `Stage transitioned from '${prevStage}' (${prevStatus}) to '${newStage}' (${newStatus}). ${actor.details || ''}`,
    });

    return memoryApplications[index];
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    return [...memoryAuditLogs];
  },

  async getRegionalGeoMetrics(apps?: ApplicationRecord[]): Promise<RegionalGeoMetric[]> {
    const dataset = apps || memoryApplications;
    return computeRegionalGeoMetrics(dataset);
  },

  async getDelayIntelligence(apps?: ApplicationRecord[]): Promise<DelayIntelligenceData> {
    const dataset = apps || memoryApplications;
    return computeDelayIntelligence(dataset);
  },

  // ==========================================================================
  // PHASE 4: ESCALATION CENTRE & REPORTING METHODS
  // ==========================================================================

  async getEscalationCases(filters?: {
    level?: string;
    category?: string;
    region?: string;
    status?: string;
    search?: string;
  }): Promise<EscalationCase[]> {
    let result = [...memoryEscalations];

    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        result = result.filter(e =>
          e.applicationNumber.toLowerCase().includes(query) ||
          e.complianceReference.toLowerCase().includes(query) ||
          e.institutionName.toLowerCase().includes(query) ||
          e.assignedOfficer.toLowerCase().includes(query)
        );
      }

      if (filters.level && filters.level !== 'All') {
        const lvl = parseInt(filters.level, 10);
        if (!isNaN(lvl)) {
          result = result.filter(e => e.escalationLevel === lvl);
        }
      }

      if (filters.category && filters.category !== 'All') {
        result = result.filter(e => e.escalationCategory === filters.category);
      }

      if (filters.region && filters.region !== 'All' && filters.region !== 'All Regions') {
        result = result.filter(e => e.region.toLowerCase() === filters.region!.toLowerCase());
      }

      if (filters.status && filters.status !== 'All') {
        result = result.filter(e => e.resolutionStatus === filters.status);
      }
    }

    return result;
  },

  async getEscalationById(id: string): Promise<EscalationCase | null> {
    const item = memoryEscalations.find(e => e.id === id || e.caseId === id || e.applicationNumber === id);
    return item || null;
  },

  async getEscalationPolicy(): Promise<EscalationPolicyConfig> {
    return { ...memoryEscalationPolicy };
  },

  async updateEscalationPolicy(
    newConfig: Partial<EscalationPolicyConfig>, 
    user: string = 'Dr. Janhavi Hinganghatkar (Bureau Officer HQ)'
  ): Promise<EscalationPolicyConfig> {
    memoryEscalationPolicy = {
      ...memoryEscalationPolicy,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
      updatedBy: user,
    };

    memoryAuditLogs.unshift({
      id: `log_pol_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: user,
      role: 'bureau_officer',
      action: 'ESCALATION_POLICY_UPDATED',
      applicationId: 'AICTE_ESCALATION_POLICY',
      details: `Escalation policy timelines and SLA thresholds reconfigured. Auto-dedup: ${memoryEscalationPolicy.autoPreventDuplicates ? 'Active' : 'Disabled'}.`,
    });

    return { ...memoryEscalationPolicy };
  },

  async runScheduledEscalationSweep(): Promise<ScheduledSweepResult> {
    const policy = memoryEscalationPolicy;
    const now = new Date();
    const timestamp = now.toISOString();
    const logSummary: string[] = [];

    let evaluatedCount = 0;
    let newAlertsTriggered = 0;
    let duplicatesPrevented = 0;

    logSummary.push(`[${timestamp}] Initiated backend scheduled escalation sweep under APH 2026-27 policy.`);

    memoryApplications.forEach((app) => {
      if (app.currentStatus === 'Approved' || app.currentStatus === 'Rejected') return;

      evaluatedCount++;
      const todayStr = timestamp.split('T')[0];
      const isDeadlineCrossed = app.deadlineDate < todayStr || app.deadlineStatus === 'Overdue';
      
      let daysOverdue = 0;
      if (isDeadlineCrossed) {
        const deadlineMs = new Date(app.deadlineDate).getTime();
        const nowMs = now.getTime();
        daysOverdue = Math.max(1, Math.floor((nowMs - deadlineMs) / (1000 * 60 * 60 * 24)));
      }

      // 1. Deadline Crossed
      if (isDeadlineCrossed) {
        let level: EscalationLevel = 1;
        if (daysOverdue >= policy.level3OverdueDays) level = 3;
        else if (daysOverdue >= policy.level2OverdueDays) level = 2;

        const category: EscalationCategory = 'deadline_breach';
        const reason = `Configured statutory deadline (${app.deadlineDate}) crossed by ${daysOverdue} days in ${app.currentStage}.`;

        const existing = memoryEscalations.find(
          e => e.caseId === app.id && e.escalationCategory === category && e.resolutionStatus !== 'Resolved'
        );

        if (policy.autoPreventDuplicates && existing) {
          duplicatesPrevented++;
          existing.daysOverdue = daysOverdue;
          if (level > existing.escalationLevel) {
            existing.escalationLevel = level;
            existing.history.unshift({
              id: `h_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              timestamp,
              actor: 'Backend Rule Scheduler',
              role: 'system',
              action: `ESCALATION_UPGRADED_L${level}`,
              details: `Escalation upgraded to Level ${level} due to ${daysOverdue} days overdue.`,
              level,
            });
          }
        } else if (!existing) {
          newAlertsTriggered++;
          const newEsc: EscalationCase = {
            id: `esc_${app.id}_dl_${Date.now()}`,
            caseId: app.id,
            applicationNumber: app.applicationNumber,
            complianceReference: `COMP-${app.academicYear.substring(0, 4)}-${app.region.substring(0, 3).toUpperCase()}-${app.instituteCode.replace('1-', '')}`,
            institutionId: app.institutionId,
            institutionName: app.institutionName,
            instituteCode: app.instituteCode,
            region: app.region,
            state: app.state,
            currentStage: app.currentStage,
            currentStatus: app.currentStatus,
            assignedRole: `Regional Officer (${app.assignedOfficer})`,
            assignedOfficer: app.assignedOfficer,
            assignedOfficerEmail: app.assignedOfficerEmail,
            originalDeadline: app.deadlineDate,
            daysOverdue,
            escalationLevel: level,
            escalationCategory: category,
            reason,
            daysInCurrentStage: app.daysInCurrentStage,
            deficienciesCount: app.deficienciesCount,
            expiringDocumentsCount: app.expiringDocumentsCount,
            evcStatus: app.evcStatus,
            triggeredAt: timestamp,
            triggeredBy: 'system_scheduler',
            resolutionStatus: 'Open',
            administrativeRemarks: [],
            followUpDirectives: [],
            history: [
              {
                id: `h_trig_${Date.now()}`,
                timestamp,
                actor: 'Backend Rule Scheduler',
                role: 'system',
                action: `LEVEL_${level}_ALERT_TRIGGERED`,
                details: reason,
                level,
              }
            ],
          };
          memoryEscalations.unshift(newEsc);
          app.isEscalated = true;
          logSummary.push(`Triggered Level ${level} alert for ${app.applicationNumber}: ${category}`);
        }
      }

      // 2. EVC Delay
      const isEvcDelay = app.evcStatus === 'Delayed' || 
        (app.evcStatus === 'Pending Scheduling' && app.daysInCurrentStage > policy.evcSchedulingSlaDays);

      if (isEvcDelay) {
        const category: EscalationCategory = 'evc_delay';
        const level: EscalationLevel = (app.daysInCurrentStage > 15 || app.evcStatus === 'Delayed') ? 2 : 1;
        const reason = app.evcStatus === 'Delayed'
          ? `EVC physical committee inspection report delayed beyond statutory ${policy.evcReportingSlaDays}-day window.`
          : `EVC panel constitution and visit scheduling pending for ${app.daysInCurrentStage} days (exceeds ${policy.evcSchedulingSlaDays}-day SLA).`;

        const existing = memoryEscalations.find(
          e => e.caseId === app.id && e.escalationCategory === category && e.resolutionStatus !== 'Resolved'
        );

        if (policy.autoPreventDuplicates && existing) {
          duplicatesPrevented++;
        } else if (!existing) {
          newAlertsTriggered++;
          const newEsc: EscalationCase = {
            id: `esc_${app.id}_evc_${Date.now()}`,
            caseId: app.id,
            applicationNumber: app.applicationNumber,
            complianceReference: `COMP-${app.academicYear.substring(0, 4)}-${app.region.substring(0, 3).toUpperCase()}-${app.instituteCode.replace('1-', '')}`,
            institutionId: app.institutionId,
            institutionName: app.institutionName,
            instituteCode: app.instituteCode,
            region: app.region,
            state: app.state,
            currentStage: app.currentStage,
            currentStatus: app.currentStatus,
            assignedRole: `Regional Inspection Committee & RO (${app.assignedOfficer})`,
            assignedOfficer: app.assignedOfficer,
            assignedOfficerEmail: app.assignedOfficerEmail,
            originalDeadline: app.deadlineDate,
            daysOverdue: Math.max(1, app.daysInCurrentStage - policy.evcSchedulingSlaDays),
            escalationLevel: level,
            escalationCategory: category,
            reason,
            daysInCurrentStage: app.daysInCurrentStage,
            deficienciesCount: app.deficienciesCount,
            expiringDocumentsCount: app.expiringDocumentsCount,
            evcStatus: app.evcStatus,
            triggeredAt: timestamp,
            triggeredBy: 'system_scheduler',
            resolutionStatus: 'Open',
            administrativeRemarks: [],
            followUpDirectives: [],
            history: [
              {
                id: `h_evc_${Date.now()}`,
                timestamp,
                actor: 'Backend Rule Scheduler',
                role: 'system',
                action: `LEVEL_${level}_ALERT_TRIGGERED`,
                details: reason,
                level,
              }
            ],
          };
          memoryEscalations.unshift(newEsc);
          app.isEscalated = true;
          logSummary.push(`Triggered EVC delay alert for ${app.applicationNumber}`);
        }
      }

      // 3. Overdue Compliance
      const isComplianceOverdue = app.complianceStatus === 'Critical Deficiency' || 
        (app.deficienciesCount > 0 && app.daysInCurrentStage > policy.deficiencyRectificationSlaDays);

      if (isComplianceOverdue) {
        const category: EscalationCategory = 'compliance_deficiency';
        const level: EscalationLevel = app.deficienciesCount >= 3 ? 2 : 1;
        const reason = `${app.deficienciesCount} critical deficiencies remain unrectified past the ${policy.deficiencyRectificationSlaDays}-day statutory limit.`;

        const existing = memoryEscalations.find(
          e => e.caseId === app.id && e.escalationCategory === category && e.resolutionStatus !== 'Resolved'
        );

        if (policy.autoPreventDuplicates && existing) {
          duplicatesPrevented++;
        } else if (!existing) {
          newAlertsTriggered++;
          const newEsc: EscalationCase = {
            id: `esc_${app.id}_comp_${Date.now()}`,
            caseId: app.id,
            applicationNumber: app.applicationNumber,
            complianceReference: `COMP-${app.academicYear.substring(0, 4)}-${app.region.substring(0, 3).toUpperCase()}-${app.instituteCode.replace('1-', '')}`,
            institutionId: app.institutionId,
            institutionName: app.institutionName,
            instituteCode: app.instituteCode,
            region: app.region,
            state: app.state,
            currentStage: app.currentStage,
            currentStatus: app.currentStatus,
            assignedRole: `Regional Scrutiny Committee & RO (${app.assignedOfficer})`,
            assignedOfficer: app.assignedOfficer,
            assignedOfficerEmail: app.assignedOfficerEmail,
            originalDeadline: app.deadlineDate,
            daysOverdue: Math.max(1, app.daysInCurrentStage - policy.deficiencyRectificationSlaDays),
            escalationLevel: level,
            escalationCategory: category,
            reason,
            daysInCurrentStage: app.daysInCurrentStage,
            deficienciesCount: app.deficienciesCount,
            expiringDocumentsCount: app.expiringDocumentsCount,
            evcStatus: app.evcStatus,
            triggeredAt: timestamp,
            triggeredBy: 'system_scheduler',
            resolutionStatus: 'Open',
            administrativeRemarks: [],
            followUpDirectives: [],
            history: [
              {
                id: `h_comp_${Date.now()}`,
                timestamp,
                actor: 'Backend Rule Scheduler',
                role: 'system',
                action: `LEVEL_${level}_ALERT_TRIGGERED`,
                details: reason,
                level,
              }
            ],
          };
          memoryEscalations.unshift(newEsc);
          app.isEscalated = true;
          logSummary.push(`Triggered Compliance Deficiency alert for ${app.applicationNumber}`);
        }
      }

      // 4. Expired Documents
      const isDocExpiring = app.expiringDocumentsCount > 0 || app.complianceStatus === 'Documents Expiring Soon';
      if (isDocExpiring) {
        const category: EscalationCategory = 'document_expiry';
        const level: EscalationLevel = app.expiringDocumentsCount >= 2 ? 2 : 1;
        const reason = `${app.expiringDocumentsCount} mandatory statutory certificates (Fire NOC / Building Safety / Land Title) are expired or expiring within ${policy.documentExpiryWarningDays} days.`;

        const existing = memoryEscalations.find(
          e => e.caseId === app.id && e.escalationCategory === category && e.resolutionStatus !== 'Resolved'
        );

        if (policy.autoPreventDuplicates && existing) {
          duplicatesPrevented++;
        } else if (!existing) {
          newAlertsTriggered++;
          const newEsc: EscalationCase = {
            id: `esc_${app.id}_doc_${Date.now()}`,
            caseId: app.id,
            applicationNumber: app.applicationNumber,
            complianceReference: `COMP-${app.academicYear.substring(0, 4)}-${app.region.substring(0, 3).toUpperCase()}-${app.instituteCode.replace('1-', '')}`,
            institutionId: app.institutionId,
            institutionName: app.institutionName,
            instituteCode: app.instituteCode,
            region: app.region,
            state: app.state,
            currentStage: app.currentStage,
            currentStatus: app.currentStatus,
            assignedRole: `Regional Officer & Document Scrutinizer`,
            assignedOfficer: app.assignedOfficer,
            assignedOfficerEmail: app.assignedOfficerEmail,
            originalDeadline: app.deadlineDate,
            daysOverdue: 0,
            escalationLevel: level,
            escalationCategory: category,
            reason,
            daysInCurrentStage: app.daysInCurrentStage,
            deficienciesCount: app.deficienciesCount,
            expiringDocumentsCount: app.expiringDocumentsCount,
            evcStatus: app.evcStatus,
            triggeredAt: timestamp,
            triggeredBy: 'system_scheduler',
            resolutionStatus: 'Open',
            administrativeRemarks: [],
            followUpDirectives: [],
            history: [
              {
                id: `h_doc_${Date.now()}`,
                timestamp,
                actor: 'Backend Rule Scheduler',
                role: 'system',
                action: `LEVEL_${level}_ALERT_TRIGGERED`,
                details: reason,
                level,
              }
            ],
          };
          memoryEscalations.unshift(newEsc);
          logSummary.push(`Triggered Document Expiry alert for ${app.applicationNumber}`);
        }
      }

      // 5. Inactivity Threshold
      const isDormant = app.daysInCurrentStage > policy.stageInactivityThresholdDays;
      if (isDormant) {
        const category: EscalationCategory = 'stage_inactivity';
        const level: EscalationLevel = app.daysInCurrentStage > 18 ? 2 : 1;
        const reason = `Application remained pending beyond configured inactivity threshold (${policy.stageInactivityThresholdDays} days). Currently ${app.daysInCurrentStage} days elapsed in ${app.currentStage}.`;

        const existing = memoryEscalations.find(
          e => e.caseId === app.id && e.escalationCategory === category && e.resolutionStatus !== 'Resolved'
        );

        if (policy.autoPreventDuplicates && existing) {
          duplicatesPrevented++;
        } else if (!existing) {
          newAlertsTriggered++;
          const newEsc: EscalationCase = {
            id: `esc_${app.id}_dorm_${Date.now()}`,
            caseId: app.id,
            applicationNumber: app.applicationNumber,
            complianceReference: `COMP-${app.academicYear.substring(0, 4)}-${app.region.substring(0, 3).toUpperCase()}-${app.instituteCode.replace('1-', '')}`,
            institutionId: app.institutionId,
            institutionName: app.institutionName,
            instituteCode: app.instituteCode,
            region: app.region,
            state: app.state,
            currentStage: app.currentStage,
            currentStatus: app.currentStatus,
            assignedRole: `Assigned Scrutiny Panel & RO (${app.assignedOfficer})`,
            assignedOfficer: app.assignedOfficer,
            assignedOfficerEmail: app.assignedOfficerEmail,
            originalDeadline: app.deadlineDate,
            daysOverdue: app.daysInCurrentStage - policy.stageInactivityThresholdDays,
            escalationLevel: level,
            escalationCategory: category,
            reason,
            daysInCurrentStage: app.daysInCurrentStage,
            deficienciesCount: app.deficienciesCount,
            expiringDocumentsCount: app.expiringDocumentsCount,
            evcStatus: app.evcStatus,
            triggeredAt: timestamp,
            triggeredBy: 'system_scheduler',
            resolutionStatus: 'Open',
            administrativeRemarks: [],
            followUpDirectives: [],
            history: [
              {
                id: `h_dorm_${Date.now()}`,
                timestamp,
                actor: 'Backend Rule Scheduler',
                role: 'system',
                action: `LEVEL_${level}_ALERT_TRIGGERED`,
                details: reason,
                level,
              }
            ],
          };
          memoryEscalations.unshift(newEsc);
          app.isEscalated = true;
          logSummary.push(`Triggered Stage Inactivity alert for ${app.applicationNumber}`);
        }
      }
    });

    const activeEscalationsCount = memoryEscalations.filter(e => e.resolutionStatus !== 'Resolved').length;
    const resolvedCount = memoryEscalations.filter(e => e.resolutionStatus === 'Resolved').length;

    logSummary.push(`Sweep complete. Evaluated ${evaluatedCount} active applications. Triggered ${newAlertsTriggered} new alerts, prevented ${duplicatesPrevented} duplicate alerts. Active escalations: ${activeEscalationsCount}.`);

    memoryAuditLogs.unshift({
      id: `log_sched_${Date.now()}`,
      timestamp,
      actor: 'AICTE Automated Rule Scheduler (Backend Cron)',
      role: 'system',
      action: 'SCHEDULED_ESCALATION_SWEEP',
      applicationId: 'PAN_INDIA_ESCALATIONS',
      details: `Backend scheduler evaluated ${evaluatedCount} applications. New alerts: ${newAlertsTriggered}, Duplicates prevented: ${duplicatesPrevented}, Active: ${activeEscalationsCount}`,
    });

    return {
      executionTimestamp: timestamp,
      evaluatedCount,
      activeEscalationsCount,
      newAlertsTriggered,
      duplicatesPrevented,
      resolvedCount,
      logSummary,
    };
  },

  async acknowledgeEscalation(escId: string, officerName: string, role: string): Promise<boolean> {
    const esc = memoryEscalations.find(e => e.id === escId);
    if (!esc) return false;

    esc.resolutionStatus = 'Acknowledged';
    esc.acknowledgedAt = new Date().toISOString();
    esc.acknowledgedBy = `${officerName} (${role})`;

    esc.history.unshift({
      id: `h_ack_${Date.now()}`,
      timestamp: esc.acknowledgedAt,
      actor: officerName,
      role,
      action: 'ESCALATION_ACKNOWLEDGED',
      details: `Official acknowledgement recorded. Case transitioned to Acknowledged status.`,
      level: esc.escalationLevel,
    });

    memoryAuditLogs.unshift({
      id: `log_ack_${Date.now()}`,
      timestamp: esc.acknowledgedAt,
      actor: officerName,
      role,
      action: 'ESCALATION_ACKNOWLEDGED',
      applicationId: esc.applicationNumber,
      details: `Escalation alert acknowledged by ${officerName} (${role}). Priority Level: ${esc.escalationLevel}`,
    });

    return true;
  },

  async recordFollowUpDirective(
    escId: string, 
    directive: { 
      type: 'Notice of Hearing' | 'Deficiency Rectification Summons' | 'EVC Expedite Order' | 'Show Cause Notice' | 'Document Renewal Requisition';
      priority: 'Standard' | 'High' | 'Emergency';
      text: string;
      recipientRole: string;
      author: string;
      role: string;
    }
  ): Promise<boolean> {
    const esc = memoryEscalations.find(e => e.id === escId);
    if (!esc) return false;

    const timestamp = new Date().toISOString();
    const newDirective: FollowUpDirective = {
      id: `dir_${Date.now()}`,
      type: directive.type,
      priority: directive.priority,
      recipientRole: directive.recipientRole,
      instructionText: directive.text,
      dispatchedBy: directive.author,
      dispatchedAt: timestamp,
    };

    esc.followUpDirectives.unshift(newDirective);
    esc.resolutionStatus = 'In Progress';

    esc.history.unshift({
      id: `h_dir_${Date.now()}`,
      timestamp,
      actor: directive.author,
      role: directive.role,
      action: `STATUTORY_DIRECTIVE_DISPATCHED`,
      details: `Dispatched [${directive.type}] (${directive.priority} priority) to ${directive.recipientRole}: ${directive.text}`,
      level: esc.escalationLevel,
    });

    memoryAuditLogs.unshift({
      id: `log_dir_${Date.now()}`,
      timestamp,
      actor: directive.author,
      role: directive.role,
      action: 'STATUTORY_DIRECTIVE_ISSUED',
      applicationId: esc.applicationNumber,
      details: `Dispatched ${directive.type} (${directive.priority}): ${directive.text}`,
    });

    return true;
  },

  async addAdministrativeRemark(
    escId: string,
    remark: {
      author: string;
      role: string;
      category: 'General' | 'Scrutiny Directive' | 'Legal Compliance' | 'SAC Referral' | 'Inspection Note' | 'Chairman Memo';
      text: string;
    }
  ): Promise<boolean> {
    const esc = memoryEscalations.find(e => e.id === escId);
    if (!esc) return false;

    const timestamp = new Date().toISOString();
    const newRemark: AdministrativeRemark = {
      id: `rem_${Date.now()}`,
      author: remark.author,
      role: remark.role,
      category: remark.category,
      text: remark.text,
      timestamp,
    };

    esc.administrativeRemarks.unshift(newRemark);

    esc.history.unshift({
      id: `h_rem_${Date.now()}`,
      timestamp,
      actor: remark.author,
      role: remark.role,
      action: 'ADMINISTRATIVE_REMARK_RECORDED',
      details: `[${remark.category}] ${remark.text}`,
      level: esc.escalationLevel,
    });

    memoryAuditLogs.unshift({
      id: `log_rem_${Date.now()}`,
      timestamp,
      actor: remark.author,
      role: remark.role,
      action: 'ADMINISTRATIVE_REMARK_RECORDED',
      applicationId: esc.applicationNumber,
      details: `Authorised administrative remark recorded under category '${remark.category}': ${remark.text}`,
    });

    return true;
  },

  async reassignEscalationOfficer(
    escId: string,
    newOfficer: string,
    reason: string,
    author: string,
    role: string
  ): Promise<boolean> {
    const esc = memoryEscalations.find(e => e.id === escId);
    if (!esc) return false;

    const prevOfficer = esc.assignedOfficer;
    const timestamp = new Date().toISOString();

    esc.assignedOfficer = newOfficer;
    esc.assignedRole = `Assigned Officer (${newOfficer})`;

    // Also update on linked application if present
    const appIndex = memoryApplications.findIndex(a => a.id === esc.caseId);
    if (appIndex !== -1) {
      memoryApplications[appIndex].assignedOfficer = newOfficer;
      memoryApplications[appIndex].lastUpdated = timestamp;
    }

    esc.history.unshift({
      id: `h_reas_${Date.now()}`,
      timestamp,
      actor: author,
      role,
      action: 'OFFICER_REASSIGNED',
      details: `Lead responsibility reassigned from '${prevOfficer}' to '${newOfficer}'. Reason: ${reason}`,
      level: esc.escalationLevel,
    });

    memoryAuditLogs.unshift({
      id: `log_reas_${Date.now()}`,
      timestamp,
      actor: author,
      role,
      action: 'OFFICER_REASSIGNED',
      applicationId: esc.applicationNumber,
      details: `Reassigned from '${prevOfficer}' to '${newOfficer}'. Justification: ${reason}`,
    });

    return true;
  },

  async resolveEscalation(
    escId: string,
    resolution: {
      resolvedBy: string;
      role: string;
      notes: string;
      proofRef?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const esc = memoryEscalations.find(e => e.id === escId);
    if (!esc) return { success: false, message: 'Escalation case not found.' };

    if (!resolution.notes || resolution.notes.trim().length < 10) {
      return { 
        success: false, 
        message: 'A detailed statutory justification (minimum 10 characters) is required to resolve an active escalation.' 
      };
    }

    const timestamp = new Date().toISOString();

    esc.resolutionStatus = 'Resolved';
    esc.resolvedAt = timestamp;
    esc.resolvedBy = `${resolution.resolvedBy} (${resolution.role})`;
    esc.resolutionNotes = resolution.notes;
    esc.resolutionProofRef = resolution.proofRef || `AICTE/RES/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    esc.history.unshift({
      id: `h_res_${Date.now()}`,
      timestamp,
      actor: resolution.resolvedBy,
      role: resolution.role,
      action: 'ESCALATION_RESOLVED',
      details: `Escalation marked as resolved. Justification: ${resolution.notes}. Verification Order Ref: ${esc.resolutionProofRef}`,
      level: esc.escalationLevel,
    });

    // Check if any other active escalations remain on this application
    const remainingActive = memoryEscalations.filter(
      e => e.caseId === esc.caseId && e.id !== escId && e.resolutionStatus !== 'Resolved'
    );
    if (remainingActive.length === 0) {
      const app = memoryApplications.find(a => a.id === esc.caseId);
      if (app) {
        app.isEscalated = false;
        app.lastUpdated = timestamp;
      }
    }

    memoryAuditLogs.unshift({
      id: `log_res_${Date.now()}`,
      timestamp,
      actor: resolution.resolvedBy,
      role: resolution.role,
      action: 'ESCALATION_RESOLVED',
      applicationId: esc.applicationNumber,
      details: `Escalation resolved with verified clearance order ${esc.resolutionProofRef}. Notes: ${resolution.notes}`,
    });

    return { 
      success: true, 
      message: `Escalation ${esc.applicationNumber} successfully resolved with verification order ${esc.resolutionProofRef}.` 
    };
  },

  async getReportsData(reportType: ReportType, filters?: ReportFilterState) {
    // 1. Synchronize real live data from canonical applications service
    try {
      const canonicalApps = await canonicalApplications.getAll();
      if (canonicalApps && canonicalApps.length > 0) {
        canonicalApps.forEach((cApp) => {
          const mapped = canonicalToAuthorityRecord(cApp);
          const existingIdx = memoryApplications.findIndex(
            (a) => a.id === mapped.id || a.applicationNumber === mapped.applicationNumber
          );
          if (existingIdx >= 0) {
            memoryApplications[existingIdx] = {
              ...memoryApplications[existingIdx],
              currentStatus: mapped.currentStatus,
              currentStage: mapped.currentStage,
              deadlineStatus: mapped.deadlineStatus,
              deficienciesCount: mapped.deficienciesCount,
              evcStatus: mapped.evcStatus,
              complianceStatus: mapped.complianceStatus,
              isEscalated: mapped.isEscalated,
              lastUpdated: mapped.lastUpdated,
            };
          } else {
            memoryApplications.unshift(mapped);
          }
        });
      }
    } catch (err) {
      console.warn('authorityApi: could not sync canonical applications:', err);
    }

    let dataset = [...memoryApplications];

    if (filters) {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        dataset = dataset.filter(a =>
          a.applicationNumber.toLowerCase().includes(q) ||
          a.institutionName.toLowerCase().includes(q) ||
          a.instituteCode.toLowerCase().includes(q)
        );
      }
      if (filters.region && filters.region !== 'All' && filters.region !== 'All Regions') {
        dataset = dataset.filter(a => a.region.toLowerCase() === filters.region.toLowerCase());
      }
      if (filters.stage && filters.stage !== 'All' && filters.stage !== 'All Stages') {
        dataset = dataset.filter(a => a.currentStage === filters.stage);
      }
      if (filters.status && filters.status !== 'All' && filters.status !== 'All Statuses') {
        dataset = dataset.filter(a => a.currentStatus === filters.status);
      }
      if (filters.academicYear && filters.academicYear !== 'All') {
        dataset = dataset.filter(a => a.academicYear === filters.academicYear);
      }
    }

    const kpis = computeKPICounters(dataset);

    switch (reportType) {
      case 'overall_pendency': {
        const STAGES: ApplicationStage[] = [
          'Submission',
          'Document Scrutiny',
          'Deficiency Rectification',
          'EVC Inspection',
          'Regional Committee (RC)',
          'Standing Appellate Committee (SAC)',
          'Bureau HQ Final Review'
        ];

        const stageBreakdown = STAGES.map(stage => {
          const count = dataset.filter(a => a.currentStage === stage && a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected').length;
          const totalInStage = dataset.filter(a => a.currentStage === stage).length;
          const avgDays = totalInStage > 0
            ? Math.round(dataset.filter(a => a.currentStage === stage).reduce((s, a) => s + a.daysInCurrentStage, 0) / totalInStage)
            : 0;
          return {
            stage,
            count,
            totalInStage,
            avgDays,
            percentage: dataset.length > 0 ? Math.round((count / dataset.length) * 100) : 0,
          };
        });

        const TYPES = [
          'Extension of Approval (EoA)',
          'New Technical Institution',
          'Increase in Intake',
          'Introduction of New Course',
          'Closure of Course/Institute'
        ];

        const typeBreakdown = TYPES.map(t => {
          const matching = dataset.filter(a => a.applicationType === t);
          return {
            type: t,
            total: matching.length,
            pending: matching.filter(a => a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected').length,
            approved: matching.filter(a => a.currentStatus === 'Approved').length,
            rejected: matching.filter(a => a.currentStatus === 'Rejected').length,
          };
        });

        return {
          reportType,
          total: dataset.length,
          pending: kpis.applicationsPending,
          approved: dataset.filter(a => a.currentStatus === 'Approved').length,
          rejected: dataset.filter(a => a.currentStatus === 'Rejected').length,
          underScrutiny: kpis.applicationsUnderScrutiny,
          overdue: kpis.overdueApplications,
          stageBreakdown,
          typeBreakdown,
          applications: dataset,
        };
      }

      case 'region_workload': {
        const regions = AICTE_REGIONS_REGISTRY.map(r => {
          const rApps = dataset.filter(a => a.region.toLowerCase() === r.name.toLowerCase());
          const total = rApps.length;
          const pending = rApps.filter(a => a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected').length;
          const overdue = rApps.filter(a => a.deadlineStatus === 'Overdue' && a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected').length;
          const delinquencyRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
          const avgDays = total > 0 ? Math.round(rApps.reduce((s, a) => s + (a.processingTimeDays || 0), 0) / total) : 0;
          const evcPending = rApps.filter(a => a.evcStatus === 'Delayed' || a.evcStatus === 'Pending Scheduling').length;
          const escalations = memoryEscalations.filter(e => e.region.toLowerCase() === r.name.toLowerCase() && e.resolutionStatus !== 'Resolved').length;

          return {
            regionId: r.id,
            regionName: r.name,
            headquarters: r.hq,
            assignedOfficer: r.officer,
            officerEmail: r.email,
            total,
            pending,
            overdue,
            delinquencyRate,
            avgDays,
            evcPending,
            activeEscalations: escalations,
          };
        });

        return {
          reportType,
          regions,
          totalApplications: dataset.length,
          totalPending: kpis.applicationsPending,
          totalOverdue: kpis.overdueApplications,
        };
      }

      case 'stage_delays': {
        const STAGES_CONFIG: { stage: ApplicationStage; sla: number }[] = [
          { stage: 'Submission', sla: 7 },
          { stage: 'Document Scrutiny', sla: 15 },
          { stage: 'Deficiency Rectification', sla: 10 },
          { stage: 'EVC Inspection', sla: 10 },
          { stage: 'Regional Committee (RC)', sla: 7 },
          { stage: 'Standing Appellate Committee (SAC)', sla: 14 },
          { stage: 'Bureau HQ Final Review', sla: 7 },
        ];

        const stages = STAGES_CONFIG.map(({ stage, sla }) => {
          const inStage = dataset.filter(a => a.currentStage === stage && a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected');
          const count = inStage.length;
          const avgDays = count > 0 ? Math.round(inStage.reduce((s, a) => s + a.daysInCurrentStage, 0) / count) : 0;
          const breaches = inStage.filter(a => a.daysInCurrentStage > sla).length;
          const variance = avgDays - sla;

          return {
            stage,
            inFlightCount: count,
            avgDays,
            slaBenchmark: sla,
            variance: variance > 0 ? `+${variance} days` : `${variance} days`,
            slaBreachesCount: breaches,
            isBottleneck: avgDays > sla || count >= 2,
            bottleneckStatus: avgDays > sla * 1.5 ? 'Critical Delay' : (avgDays > sla ? 'Moderate Delay' : 'Within SLA'),
          };
        });

        return {
          reportType,
          stages,
          totalPending: kpis.applicationsPending,
        };
      }

      case 'evc_status': {
        const statuses = ['Not Required', 'Pending Scheduling', 'Scheduled', 'Inspection Completed', 'Report Submitted', 'Delayed'];
        const statusDistribution = statuses.map(st => ({
          status: st,
          count: dataset.filter(a => a.evcStatus === st).length,
        }));

        const delayedCases = dataset
          .filter(a => (a.evcStatus === 'Delayed' || a.evcStatus === 'Pending Scheduling') && a.currentStatus !== 'Approved' && a.currentStatus !== 'Rejected')
          .map(a => ({
            applicationNumber: a.applicationNumber,
            institutionName: a.institutionName,
            region: a.region,
            evcStatus: a.evcStatus,
            scheduledDate: a.evcScheduledDate || 'Not Yet Scheduled',
            daysPending: a.daysInCurrentStage,
            assignedOfficer: a.assignedOfficer,
            delayReason: a.escalationReason || 'Inspection committee report delayed past statutory 10-day window.',
          }));

        return {
          reportType,
          statusDistribution,
          delayedCases,
          totalRequiringEVC: dataset.filter(a => a.evcStatus !== 'Not Required').length,
          delayedCount: dataset.filter(a => a.evcStatus === 'Delayed').length,
          pendingSchedulingCount: dataset.filter(a => a.evcStatus === 'Pending Scheduling').length,
        };
      }

      case 'compliance_health': {
        const healthBreakdown = [
          { status: 'Compliant', count: dataset.filter(a => a.complianceStatus === 'Compliant').length },
          { status: 'Under Review', count: dataset.filter(a => a.complianceStatus === 'Under Review').length },
          { status: 'Pending Submission', count: dataset.filter(a => a.complianceStatus === 'Pending Submission').length },
          { status: 'Critical Deficiency', count: dataset.filter(a => a.complianceStatus === 'Critical Deficiency').length },
          { status: 'Documents Expiring Soon', count: dataset.filter(a => a.complianceStatus === 'Documents Expiring Soon').length },
        ];

        const deficientCases = dataset
          .filter(a => a.deficienciesCount > 0)
          .map(a => ({
            applicationNumber: a.applicationNumber,
            institutionName: a.institutionName,
            region: a.region,
            currentStage: a.currentStage,
            complianceStatus: a.complianceStatus,
            deficienciesCount: a.deficienciesCount,
            daysInStage: a.daysInCurrentStage,
            assignedOfficer: a.assignedOfficer,
          }));

        return {
          reportType,
          healthBreakdown,
          deficientCases,
          totalDeficienciesLogged: dataset.reduce((s, a) => s + (a.deficienciesCount || 0), 0),
          criticalCount: dataset.filter(a => a.complianceStatus === 'Critical Deficiency').length,
        };
      }

      case 'document_expiry': {
        const documentRegistry = [
          {
            institutionName: 'JNTU College of Engineering Hyderabad',
            applicationNumber: 'AICTE/2026-27/1-9382120491',
            region: 'South-Central',
            documentType: 'Fire Safety NOC',
            issuingAuthority: 'State Disaster Response & Fire Services',
            expiryDate: '2026-11-05',
            status: 'Expiring Soon (14 days)',
            daysRemaining: 14,
            statutoryAction: 'Direct institution to submit renewal receipt or provisional NOC',
          },
          {
            institutionName: 'JNTU College of Engineering Hyderabad',
            applicationNumber: 'AICTE/2026-27/1-9382120491',
            region: 'South-Central',
            documentType: 'Building Stability Certificate',
            issuingAuthority: 'PWD Executive Engineer',
            expiryDate: '2026-11-12',
            status: 'Expiring Soon (21 days)',
            daysRemaining: 21,
            statutoryAction: 'Upload certified structural engineer fitness affidavit',
          },
          {
            institutionName: 'Maulana Azad National Institute of Technology',
            applicationNumber: 'AICTE/2026-27/1-9382110452',
            region: 'Central',
            documentType: 'Land Conversion Order / Revenue NOC',
            issuingAuthority: 'District Collector Revenue Court',
            expiryDate: '2026-10-10',
            status: 'Expired (Overdue)',
            daysRemaining: -12,
            statutoryAction: 'Withhold approval order until valid non-agricultural conversion is verified',
          },
          {
            institutionName: 'Delhi Technological University (Affiliated Extension)',
            applicationNumber: 'AICTE/2026-27/1-9382105118',
            region: 'Northern',
            documentType: 'Municipal Occupancy Certificate',
            issuingAuthority: 'Municipal Corporation of Delhi (MCD)',
            expiryDate: '2026-10-28',
            status: 'Expiring Soon (6 days)',
            daysRemaining: 6,
            statutoryAction: 'Verify provisional occupancy extension before final scrutiny',
          },
          {
            institutionName: 'R. V. College of Engineering',
            applicationNumber: 'AICTE/2026-27/1-9382112390',
            region: 'South-Western',
            documentType: 'Pollution Control Board Consent to Operate',
            issuingAuthority: 'KSPCB',
            expiryDate: '2026-11-25',
            status: 'Valid (Expiring in 34 days)',
            daysRemaining: 34,
            statutoryAction: 'Routine renewal notification to be queued by RO South-Western',
          }
        ];

        const expiredCount = documentRegistry.filter(d => d.daysRemaining < 0).length;
        const expiringSoonCount = documentRegistry.filter(d => d.daysRemaining >= 0 && d.daysRemaining <= 30).length;

        return {
          reportType,
          documentRegistry,
          expiredCount,
          expiringSoonCount,
          totalTracked: documentRegistry.length,
        };
      }

      case 'escalation_history': {
        const escalations = [...memoryEscalations];
        return {
          reportType,
          escalations,
          totalEscalations: escalations.length,
          activeCount: escalations.filter(e => e.resolutionStatus !== 'Resolved').length,
          resolvedCount: escalations.filter(e => e.resolutionStatus === 'Resolved').length,
          level1Count: escalations.filter(e => e.escalationLevel === 1).length,
          level2Count: escalations.filter(e => e.escalationLevel === 2).length,
          level3Count: escalations.filter(e => e.escalationLevel === 3).length,
        };
      }

      case 'processing_performance': {
        const monthlyPerformance = [
          { month: 'May 2026', submitted: 140, approved: 120, rejected: 10, avgTurnaroundDays: 38, slaCompliancePct: 94 },
          { month: 'Jun 2026', submitted: 320, approved: 280, rejected: 25, avgTurnaroundDays: 42, slaCompliancePct: 91 },
          { month: 'Jul 2026', submitted: 490, approved: 410, rejected: 38, avgTurnaroundDays: 46, slaCompliancePct: 88 },
          { month: 'Aug 2026', submitted: 310, approved: 240, rejected: 28, avgTurnaroundDays: 49, slaCompliancePct: 84 },
          { month: 'Sep 2026', submitted: 180, approved: 130, rejected: 22, avgTurnaroundDays: 52, slaCompliancePct: 81 },
          { month: 'Oct 2026 (MTD)', submitted: 95, approved: 45, rejected: 12, avgTurnaroundDays: 54, slaCompliancePct: 78 },
        ];

        return {
          reportType,
          monthlyPerformance,
          avgOverallCycleDays: 45,
          overallSlaCompliancePct: 86,
        };
      }

      default:
        return { reportType, dataset };
    }
  }
};

// ============================================================================
// PHASE 3: REGIONAL GEOMETRIC & DELAY INTELLIGENCE ENGINES
// ============================================================================

export interface RegionOfficeMeta {
  id: string;
  name: string;
  hq: string;
  lat: number;
  lng: number;
  states: string[];
  officer: string;
  email: string;
}

export const AICTE_REGIONS_REGISTRY: RegionOfficeMeta[] = [
  {
    id: 'Western',
    name: 'Western',
    hq: 'Mumbai (WRO)',
    lat: 19.0760,
    lng: 72.8777,
    states: ['Maharashtra', 'Goa', 'Gujarat', 'Daman & Diu'],
    officer: 'Dr. S. K. Mahajan',
    email: 'ro.western@aicte-india.org',
  },
  {
    id: 'Northern',
    name: 'Northern',
    hq: 'Kanpur / New Delhi (NRO)',
    lat: 28.6139,
    lng: 77.2090,
    states: ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Rajasthan'],
    officer: 'Er. Rajesh Bansal',
    email: 'ro.northern@aicte-india.org',
  },
  {
    id: 'Southern',
    name: 'Southern',
    hq: 'Chennai (SRO)',
    lat: 13.0827,
    lng: 80.2707,
    states: ['Tamil Nadu', 'Puducherry'],
    officer: 'Dr. K. Ramanathan',
    email: 'ro.southern@aicte-india.org',
  },
  {
    id: 'Central',
    name: 'Central',
    hq: 'Bhopal (CRO)',
    lat: 23.2599,
    lng: 77.4126,
    states: ['Madhya Pradesh', 'Chhattisgarh'],
    officer: 'Er. Alok Sharma',
    email: 'ro.central@aicte-india.org',
  },
  {
    id: 'South-Western',
    name: 'South-Western',
    hq: 'Bengaluru (SWRO)',
    lat: 12.9716,
    lng: 77.5946,
    states: ['Karnataka', 'Kerala', 'Lakshadweep'],
    officer: 'Dr. Manjunath Swamy',
    email: 'ro.swro@aicte-india.org',
  },
  {
    id: 'Eastern',
    name: 'Eastern',
    hq: 'Kolkata (ERO)',
    lat: 22.5726,
    lng: 88.3639,
    states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'A&N Islands'],
    officer: 'Dr. Debabrata Roy',
    email: 'ro.eastern@aicte-india.org',
  },
  {
    id: 'North-Western',
    name: 'North-Western',
    hq: 'Chandigarh (NWRO)',
    lat: 30.7333,
    lng: 76.7794,
    states: ['Chandigarh', 'Punjab', 'Himachal Pradesh', 'Jammu & Kashmir', 'Ladakh'],
    officer: 'Er. Harvinder Singh',
    email: 'ro.nwro@aicte-india.org',
  },
  {
    id: 'South-Central',
    name: 'South-Central',
    hq: 'Hyderabad (SCRO)',
    lat: 17.3850,
    lng: 78.4867,
    states: ['Telangana', 'Andhra Pradesh'],
    officer: 'Dr. B. V. Ramana',
    email: 'ro.scro@aicte-india.org',
  },
  {
    id: 'North-Eastern',
    name: 'North-Eastern',
    hq: 'Guwahati (NERO)',
    lat: 26.1445,
    lng: 91.7362,
    states: ['Assam', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Sikkim'],
    officer: 'Dr. Pranjal Saikia',
    email: 'ro.nero@aicte-india.org',
  },
];

/**
 * Computes regional geographic metrics from real case records.
 * Rules for layer colors are completely traceable and objective:
 * - Green: within processing timeline / healthy
 * - Amber: deadline approaching / warning
 * - Red: overdue SLA / critical attention
 * - Grey: unavailable / zero cases
 */
export function computeRegionalGeoMetrics(records: ApplicationRecord[]): RegionalGeoMetric[] {
  return AICTE_REGIONS_REGISTRY.map((regionMeta) => {
    const regionApps = records.filter(r => r.region.toLowerCase() === regionMeta.name.toLowerCase());
    const totalApplications = regionApps.length;

    const pendingApplications = regionApps.filter(
      r => r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
    ).length;

    const completedApplications = regionApps.filter(
      r => r.currentStatus === 'Approved' || r.currentStatus === 'Rejected'
    ).length;

    const overdueApplications = regionApps.filter(
      r => r.deadlineStatus === 'Overdue' && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
    ).length;

    const evcPendingOrDelayed = regionApps.filter(
      r => r.evcStatus === 'Delayed' || r.evcStatus === 'Pending Scheduling'
    ).length;

    const complianceDeficiencies = regionApps.reduce(
      (sum, r) => sum + (r.deficienciesCount || 0), 0
    );

    const expiringDocuments = regionApps.reduce(
      (sum, r) => sum + (r.expiringDocumentsCount || 0), 0
    );

    const avgProcessingDays = regionApps.length > 0
      ? Math.round(regionApps.reduce((sum, r) => sum + (r.processingTimeDays || 0), 0) / regionApps.length)
      : 0;

    // Layer 1: Application Pendency
    let pendencyHealth: AlertHealthStatus = 'green';
    if (totalApplications === 0) pendencyHealth = 'grey';
    else if (pendingApplications >= 2) pendencyHealth = 'red';
    else if (pendingApplications === 1) pendencyHealth = 'amber';

    // Layer 2: Overdue Applications
    let overdueHealth: AlertHealthStatus = 'green';
    if (totalApplications === 0) overdueHealth = 'grey';
    else if (overdueApplications >= 1) overdueHealth = 'red';

    // Layer 3: EVC Scheduling & Reporting
    let evcHealth: AlertHealthStatus = 'green';
    if (totalApplications === 0) evcHealth = 'grey';
    else if (evcPendingOrDelayed >= 2) evcHealth = 'red';
    else if (evcPendingOrDelayed === 1) evcHealth = 'amber';

    // Layer 4: Compliance Submissions
    let complianceHealth: AlertHealthStatus = 'green';
    if (totalApplications === 0) complianceHealth = 'grey';
    else if (complianceDeficiencies >= 3) complianceHealth = 'red';
    else if (complianceDeficiencies > 0) complianceHealth = 'amber';

    // Layer 5: Expiring & Expired Documents
    let expiringHealth: AlertHealthStatus = 'green';
    if (totalApplications === 0) expiringHealth = 'grey';
    else if (expiringDocuments >= 2) expiringHealth = 'red';
    else if (expiringDocuments === 1) expiringHealth = 'amber';

    return {
      regionId: regionMeta.id,
      regionName: regionMeta.name,
      headquarters: regionMeta.hq,
      lat: regionMeta.lat,
      lng: regionMeta.lng,
      statesCovered: regionMeta.states,
      totalApplications,
      pendingApplications,
      completedApplications,
      overdueApplications,
      evcPendingOrDelayed,
      complianceDeficiencies,
      expiringDocuments,
      avgProcessingDays,
      layerHealth: {
        pendency: pendencyHealth,
        overdue: overdueHealth,
        evc: evcHealth,
        compliance: complianceHealth,
        expiring_docs: expiringHealth,
      },
      layerMetricValue: {
        pendency: pendingApplications,
        overdue: overdueApplications,
        evc: evcPendingOrDelayed,
        compliance: complianceDeficiencies,
        expiring_docs: expiringDocuments,
      },
      responsibleOfficer: regionMeta.officer,
      officerEmail: regionMeta.email,
    };
  });
}

/**
 * Computes stage bottlenecks, workload comparisons, and transparent rule-based risk indicators.
 */
export function computeDelayIntelligence(records: ApplicationRecord[]): DelayIntelligenceData {
  const STAGES_CONFIG: { stage: ApplicationStage; sla: number }[] = [
    { stage: 'Submission', sla: 7 },
    { stage: 'Document Scrutiny', sla: 15 },
    { stage: 'Deficiency Rectification', sla: 10 },
    { stage: 'EVC Inspection', sla: 10 },
    { stage: 'Regional Committee (RC)', sla: 7 },
    { stage: 'Standing Appellate Committee (SAC)', sla: 14 },
    { stage: 'Bureau HQ Final Review', sla: 7 },
  ];

  const bottleneckStages: DelayBottleneckStage[] = STAGES_CONFIG.map(({ stage, sla }) => {
    const stageRecords = records.filter(
      r => r.currentStage === stage && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
    );
    const pendingCount = stageRecords.length;
    const avgDaysInStage = pendingCount > 0
      ? Math.round(stageRecords.reduce((sum, r) => sum + (r.daysInCurrentStage || 0), 0) / pendingCount)
      : 0;
    
    const isBottleneck = avgDaysInStage > sla || pendingCount >= 2;
    let status: 'normal' | 'moderate' | 'critical' = 'normal';
    if (avgDaysInStage > sla * 1.5 || (pendingCount >= 2 && avgDaysInStage > sla)) {
      status = 'critical';
    } else if (avgDaysInStage > sla || pendingCount >= 1) {
      status = 'moderate';
    }

    return {
      stage,
      pendingCount,
      avgDaysInStage,
      slaTargetDays: sla,
      isBottleneck,
      status,
    };
  });

  const approachingDeadlines = records.filter(
    r => r.deadlineStatus === 'Approaching Deadline' && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
  );

  const overdueCases = records.filter(
    r => r.deadlineStatus === 'Overdue' && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
  );

  const regionalWorkloadComparison = AICTE_REGIONS_REGISTRY.map(regionMeta => {
    const regionApps = records.filter(r => r.region.toLowerCase() === regionMeta.name.toLowerCase());
    const totalCases = regionApps.length;
    const pendingCases = regionApps.filter(
      r => r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
    ).length;
    const overdueCount = regionApps.filter(
      r => r.deadlineStatus === 'Overdue' && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected'
    ).length;
    const overdueRatio = totalCases > 0 ? Math.round((overdueCount / totalCases) * 100) : 0;

    return {
      region: regionMeta.name,
      totalCases,
      pendingCases,
      overdueRatio,
      assignedOfficer: regionMeta.officer,
    };
  });

  const evcBottlenecks = records
    .filter(r => (r.evcStatus === 'Delayed' || r.evcStatus === 'Pending Scheduling') && r.currentStatus !== 'Approved' && r.currentStatus !== 'Rejected')
    .map(r => ({
      applicationId: r.id,
      applicationNumber: r.applicationNumber,
      institutionName: r.institutionName,
      region: r.region,
      evcStatus: r.evcStatus,
      scheduledDate: r.evcScheduledDate,
      daysPending: r.daysInCurrentStage,
      bottleneckReason: r.escalationReason || (r.evcStatus === 'Delayed'
        ? 'Physical committee inspection report delayed beyond statutory 10-day window'
        : 'Inspection committee panel constitution awaiting Regional Officer selection'),
    }));

  // Transparent Rule-Based Risk Indicators (APH 2026-27 Norms)
  const riskIndicators: RuleBasedRiskIndicator[] = [];

  records.forEach((app) => {
    if (app.currentStatus === 'Approved' || app.currentStatus === 'Rejected') return;

    // Rule 1: Deadline Exceeded
    if (app.deadlineStatus === 'Overdue') {
      riskIndicators.push({
        ruleId: `risk_od_${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institutionName,
        region: app.region,
        currentStage: app.currentStage,
        currentStatus: app.currentStatus,
        riskFactor: 'Statutory deadline exceeded (Overdue SLA)',
        severity: 'high',
        traceableDataEvidence: `Exceeded statutory deadline (${app.deadlineDate}); processing elapsed time ${app.processingTimeDays} days vs Citizen Charter SLA.`,
        recommendation: `Attention required: the application is overdue in ${app.currentStage}. Issue Bureau statutory directive to clear backlog.`,
        assignedOfficer: app.assignedOfficer,
      });
    }

    // Rule 2: Approaching Deadline
    if (app.deadlineStatus === 'Approaching Deadline') {
      riskIndicators.push({
        ruleId: `risk_appr_${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institutionName,
        region: app.region,
        currentStage: app.currentStage,
        currentStatus: app.currentStatus,
        riskFactor: 'Approaching statutory deadline (≤ 7 days)',
        severity: 'medium',
        traceableDataEvidence: `Configured deadline is ${app.deadlineDate}; currently ${app.daysInCurrentStage} days elapsed in ${app.currentStage}.`,
        recommendation: `Attention required: the application is waiting for a scrutiny action and its configured deadline is approaching.`,
        assignedOfficer: app.assignedOfficer,
      });
    }

    // Rule 3: Required Preceding Stage Incomplete
    if (app.currentStage === 'Bureau HQ Final Review' && (app.evcStatus === 'Pending Scheduling' || app.deficienciesCount > 0)) {
      riskIndicators.push({
        ruleId: `risk_preceding_${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institutionName,
        region: app.region,
        currentStage: app.currentStage,
        currentStatus: app.currentStatus,
        riskFactor: 'Required preceding stage incomplete',
        severity: 'high',
        traceableDataEvidence: `Case reached Bureau Final Review while ${app.deficienciesCount} deficiencies remain unrectified or EVC inspection is incomplete.`,
        recommendation: `Withhold statutory approval order until Regional Committee submits verified compliance clearance.`,
        assignedOfficer: app.assignedOfficer,
      });
    }

    // Rule 4: EVC Inspection Not Scheduled When Required
    if ((app.applicationType === 'New Technical Institution' || app.applicationType === 'Increase in Intake') && 
        app.evcStatus === 'Pending Scheduling' && app.daysInCurrentStage >= 10) {
      riskIndicators.push({
        ruleId: `risk_evc_sched_${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institutionName,
        region: app.region,
        currentStage: app.currentStage,
        currentStatus: app.currentStatus,
        riskFactor: 'EVC inspection not scheduled when required',
        severity: 'high',
        traceableDataEvidence: `Application requires mandatory physical EVC inspection, but committee scheduling has been pending for ${app.daysInCurrentStage} days.`,
        recommendation: `Issue reminder to Regional Officer (${app.assignedOfficer}) to schedule Expert Visiting Committee panel within 48 hours.`,
        assignedOfficer: app.assignedOfficer,
      });
    }

    // Rule 5: Mandatory Statutory Document Missing or Expired
    if (app.deficienciesCount > 0 || app.expiringDocumentsCount > 0) {
      riskIndicators.push({
        ruleId: `risk_docs_${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institutionName,
        region: app.region,
        currentStage: app.currentStage,
        currentStatus: app.currentStatus,
        riskFactor: 'Mandatory statutory document missing or expired',
        severity: (app.deficienciesCount >= 3 || app.expiringDocumentsCount >= 2) ? 'high' : 'medium',
        traceableDataEvidence: `${app.deficienciesCount} compliance deficiency records logged; ${app.expiringDocumentsCount} statutory NOCs/certificates expiring soon.`,
        recommendation: `Direct institution to upload updated Building Safety / Fire NOC / Land affidavit before academic intake freeze.`,
        assignedOfficer: app.assignedOfficer,
      });
    }
  });

  return {
    bottleneckStages,
    approachingDeadlines,
    overdueCases,
    regionalWorkloadComparison,
    evcBottlenecks,
    riskIndicators,
  };
}

