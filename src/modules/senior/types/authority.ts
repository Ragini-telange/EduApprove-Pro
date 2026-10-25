export type UserRole = 'bureau_officer' | 'regional_officer' | 'institution_admin' | 'evc_expert';

export type ApplicationType = 
  | 'New Technical Institution'
  | 'Extension of Approval (EoA)'
  | 'Increase in Intake'
  | 'Introduction of New Course'
  | 'Closure of Course/Institute'
  | 'Change of Site/Location';

export type ApplicationStage = 
  | 'Submission'
  | 'Document Scrutiny'
  | 'Deficiency Rectification'
  | 'EVC Inspection'
  | 'Regional Committee (RC)'
  | 'Standing Appellate Committee (SAC)'
  | 'Bureau HQ Final Review';

export type ApplicationStatus = 
  | 'Submitted'
  | 'Under Scrutiny'
  | 'Deficiency Communicated'
  | 'EVC Scheduled'
  | 'EVC Report Submitted'
  | 'RO Recommended'
  | 'Pending HQ Approval'
  | 'Approved'
  | 'Rejected'
  | 'Clarification Required';

export type DeadlineStatus = 'Normal' | 'Approaching Deadline' | 'Overdue';

export type EVCStatus = 'Not Required' | 'Pending Scheduling' | 'Scheduled' | 'Inspection Completed' | 'Report Submitted' | 'Delayed';

export type ComplianceStatus = 'Compliant' | 'Pending Submission' | 'Under Review' | 'Critical Deficiency' | 'Documents Expiring Soon';

export interface ApplicationRecord {
  id: string;
  applicationNumber: string;
  institutionId: string;
  institutionName: string;
  instituteCode: string;
  region: string;
  state: string;
  applicationType: ApplicationType;
  academicYear: string;
  currentStage: ApplicationStage;
  currentStatus: ApplicationStatus;
  assignedOfficer: string;
  assignedOfficerEmail?: string;
  submittedDate: string;
  deadlineDate: string;
  deadlineStatus: DeadlineStatus;
  evcStatus: EVCStatus;
  evcScheduledDate?: string;
  complianceStatus: ComplianceStatus;
  deficienciesCount: number;
  expiringDocumentsCount: number;
  daysInCurrentStage: number;
  processingTimeDays?: number;
  isEscalated: boolean;
  escalationReason?: string;
  responsibleTeam?: string;
  recommendedAction?: string;
  lastUpdated: string;
  intakeApplied: number;
  programs: string[];
}

export interface KPICounters {
  totalApplications: number;
  applicationsPending: number;
  applicationsUnderScrutiny: number;
  applicationsRequiringCorrection: number;
  overdueApplications: number;
  completedApplications: number;
  pendingEVCSchedulingOrReporting: number;
  pendingComplianceSubmissions: number;
  documentsExpiringSoon: number;
  overdueEscalations: number;
}

export interface DashboardFilters {
  searchQuery: string;
  region: string;
  applicationType: string;
  stage: string;
  status: string;
  deadlineStatus: string;
  evcStatus: string;
  complianceStatus: string;
  startDate: string;
  endDate: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  applicationId: string;
  details: string;
}

// ============================================================================
// PHASE 3: REGIONAL ALERT MAP & DELAY INTELLIGENCE TYPES
// ============================================================================

export type MapLayerId = 
  | 'pendency' 
  | 'overdue' 
  | 'evc' 
  | 'compliance' 
  | 'expiring_docs';

export type AlertHealthStatus = 'green' | 'amber' | 'red' | 'grey';

export interface RegionalGeoMetric {
  regionId: string;
  regionName: string;
  headquarters: string;
  lat: number;
  lng: number;
  statesCovered: string[];
  totalApplications: number;
  pendingApplications: number;
  completedApplications: number;
  overdueApplications: number;
  evcPendingOrDelayed: number;
  complianceDeficiencies: number;
  expiringDocuments: number;
  avgProcessingDays: number;
  layerHealth: Record<MapLayerId, AlertHealthStatus>;
  layerMetricValue: Record<MapLayerId, number>;
  responsibleOfficer: string;
  officerEmail: string;
}

export interface DelayBottleneckStage {
  stage: ApplicationStage;
  pendingCount: number;
  avgDaysInStage: number;
  slaTargetDays: number;
  isBottleneck: boolean;
  status: 'normal' | 'moderate' | 'critical';
}

export interface RuleBasedRiskIndicator {
  ruleId: string;
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  region: string;
  currentStage: ApplicationStage;
  currentStatus: ApplicationStatus;
  riskFactor: 
    | 'Approaching statutory deadline (≤ 7 days)'
    | 'Statutory deadline exceeded (Overdue SLA)'
    | 'Required preceding stage incomplete'
    | 'EVC inspection not scheduled when required'
    | 'Mandatory statutory document missing or expired';
  severity: 'high' | 'medium' | 'low';
  traceableDataEvidence: string;
  recommendation: string;
  assignedOfficer: string;
}

export interface DelayIntelligenceData {
  bottleneckStages: DelayBottleneckStage[];
  approachingDeadlines: ApplicationRecord[];
  overdueCases: ApplicationRecord[];
  regionalWorkloadComparison: {
    region: string;
    totalCases: number;
    pendingCases: number;
    overdueRatio: number;
    assignedOfficer: string;
  }[];
  evcBottlenecks: {
    applicationId: string;
    applicationNumber: string;
    institutionName: string;
    region: string;
    evcStatus: EVCStatus;
    scheduledDate?: string;
    daysPending: number;
    bottleneckReason: string;
  }[];
  riskIndicators: RuleBasedRiskIndicator[];
}

// ============================================================================
// PHASE 4: SENIOR AUTHORITY ESCALATION CENTRE & REPORTING TYPES
// ============================================================================

export type EscalationLevel = 1 | 2 | 3;

export type EscalationCategory = 
  | 'deadline_breach' 
  | 'evc_delay' 
  | 'compliance_deficiency' 
  | 'document_expiry' 
  | 'stage_inactivity';

export type EscalationResolutionStatus = 
  | 'Open' 
  | 'Acknowledged' 
  | 'In Progress' 
  | 'Resolved';

export interface EscalationHistoryEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  level?: EscalationLevel;
}

export interface AdministrativeRemark {
  id: string;
  author: string;
  role: string;
  category: 'General' | 'Scrutiny Directive' | 'Legal Compliance' | 'SAC Referral' | 'Inspection Note' | 'Chairman Memo';
  text: string;
  timestamp: string;
}

export interface FollowUpDirective {
  id: string;
  type: 'Notice of Hearing' | 'Deficiency Rectification Summons' | 'EVC Expedite Order' | 'Show Cause Notice' | 'Document Renewal Requisition';
  priority: 'Standard' | 'High' | 'Emergency';
  recipientRole: string;
  instructionText: string;
  dispatchedBy: string;
  dispatchedAt: string;
}

export interface EscalationCase {
  id: string;
  caseId: string;
  applicationNumber: string;
  complianceReference: string;
  institutionId: string;
  institutionName: string;
  instituteCode: string;
  region: string;
  state: string;
  currentStage: ApplicationStage;
  currentStatus: ApplicationStatus;
  assignedRole: string;
  assignedOfficer: string;
  assignedOfficerEmail?: string;
  originalDeadline: string;
  daysOverdue: number;
  escalationLevel: EscalationLevel;
  escalationCategory: EscalationCategory;
  reason: string;
  daysInCurrentStage: number;
  deficienciesCount: number;
  expiringDocumentsCount: number;
  evcStatus: EVCStatus;
  triggeredAt: string;
  triggeredBy: 'system_scheduler' | 'bureau_rule_engine' | 'manual_authority';
  resolutionStatus: EscalationResolutionStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  resolutionProofRef?: string;
  administrativeRemarks: AdministrativeRemark[];
  followUpDirectives: FollowUpDirective[];
  history: EscalationHistoryEvent[];
}

export interface EscalationPolicyConfig {
  scrutinySlaDays: number;
  evcSchedulingSlaDays: number;
  evcReportingSlaDays: number;
  deficiencyRectificationSlaDays: number;
  bureauReviewSlaDays: number;
  stageInactivityThresholdDays: number;
  level1OverdueDays: number;
  level2OverdueDays: number;
  level3OverdueDays: number;
  documentExpiryWarningDays: number;
  autoPreventDuplicates: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface ScheduledSweepResult {
  executionTimestamp: string;
  evaluatedCount: number;
  activeEscalationsCount: number;
  newAlertsTriggered: number;
  duplicatesPrevented: number;
  resolvedCount: number;
  logSummary: string[];
}

export type ReportType = 
  | 'overall_pendency' 
  | 'region_workload' 
  | 'stage_delays' 
  | 'evc_status' 
  | 'compliance_health' 
  | 'document_expiry' 
  | 'escalation_history' 
  | 'processing_performance';

export interface ReportFilterState {
  region: string;
  stage: string;
  academicYear: string;
  dateRange: string;
  status: string;
  searchQuery: string;
}


