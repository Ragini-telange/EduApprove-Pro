import {
  SummaryCardsData,
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
  ConsolidatedDashboard,
} from '../types';
import { defaultMockInstitution } from './mockInstitution';
import { mockAlertsList } from './mockAlerts';
import { mockNotificationsList } from './mockNotifications';
import { mockEVCDetail } from './mockEVC';

export const mockSummaryCards: SummaryCardsData = {
  total_applications: 12,
  under_scrutiny: 4,
  correction_required: 2,
  compliance_pending: 2,
  documents_expiring: 2,
  expired_documents: 2,
};

export const mockApplicationSummary: ApplicationSummaryData = {
  total: 12,
  distribution: [
    { name: 'Draft', count: 2, color: '#94a3b8' },
    { name: 'Submitted', count: 2, color: '#38bdf8' },
    { name: 'Under Scrutiny', count: 4, color: '#4f46e5' },
    { name: 'Correction Required', count: 2, color: '#f97316' },
    { name: 'EVC', count: 1, color: '#8b5cf6' },
    { name: 'Completed', count: 1, color: '#10b981' },
    { name: 'Rejected', count: 0, color: '#ef4444' },
  ],
};

export const mockRecentApplications: RecentApplication[] = [
  {
    id: 1,
    application_number: 'APP-2026-1024',
    application_type: 'New Institution',
    submitted_date: '18 Oct 2026',
    current_stage: 'Scrutiny',
    status: 'Under Scrutiny',
  },
  {
    id: 2,
    application_number: 'APP-2026-1019',
    application_type: 'Course Extension',
    submitted_date: '15 Oct 2026',
    current_stage: 'Document Verification',
    status: 'Correction Required',
  },
  {
    id: 3,
    application_number: 'APP-2026-1008',
    application_type: 'Increase in Intake',
    submitted_date: '10 Oct 2026',
    current_stage: 'EVC',
    status: 'EVC',
  },
  {
    id: 4,
    application_number: 'APP-2026-1025',
    application_type: 'Introduction of New Course (Robotics)',
    submitted_date: '19 Oct 2026',
    current_stage: 'Queue for Scrutiny',
    status: 'Submitted',
  },
  {
    id: 5,
    application_number: 'APP-2026-1002',
    application_type: 'Extension of Approval (AY 2025-26)',
    submitted_date: '01 Aug 2026',
    current_stage: 'Approved',
    status: 'Completed',
  },
];

export const mockActionRequired: ActionRequiredItem[] = [
  {
    id: 'action-1',
    type: 'Correction Required',
    title: 'Application APP-2026-1019 requires correction',
    description:
      'Discrepancy detected in Faculty Cadre Ratio for Mechanical Department. Upload revised endorsement.',
    button_label: 'Review Application',
    button_action: '/institution/applications?id=2',
    severity: 'critical',
    entity_id: 'APP-2026-1019',
  },
  {
    id: 'action-2',
    type: 'Document Expired',
    title: 'Fire Safety Certificate is expired',
    description: 'Certificate expired 5 days ago. Upload renewed municipal fire safety certificate.',
    button_label: 'Renew Document',
    button_action: '/institution/documents?type=Fire%20Safety%20Certificate',
    severity: 'critical',
    entity_id: 'doc-3',
  },
  {
    id: 'action-3',
    type: 'Document Expiring',
    title: 'Lease document expires in 12 days',
    description: 'Campus land lease renewal agreement is due on 03 Nov 2026.',
    button_label: 'Renew Document',
    button_action: '/institution/documents?type=Lease%20Agreement',
    severity: 'high',
    entity_id: 'doc-1',
  },
  {
    id: 'action-4',
    type: 'Compliance Deadline',
    title: 'Compliance submission due in 7 days',
    description: 'Mandatory compliance Industry-Academia MoU Endorsement is due on 29 Oct 2026.',
    button_label: 'Submit Compliance',
    button_action: '/institution/compliance?id=9',
    severity: 'high',
    entity_id: 'comp-9',
  },
];

export const mockUpcomingDeadlines: DeadlineItem[] = [
  {
    id: 'dl-1',
    date_display: '22 Oct',
    title: 'Compliance: Industry MoU Endorsement',
    days_remaining: 7,
    days_text: '7 days remaining',
    category: 'Compliance',
    severity: 'critical',
  },
  {
    id: 'dl-2',
    date_display: '28 Oct',
    title: 'Lease Document Renewal',
    days_remaining: 13,
    days_text: '13 days remaining',
    category: 'Document',
    severity: 'warning',
  },
  {
    id: 'dl-3',
    date_display: '05 Nov',
    title: 'EVC Committee Preparation',
    days_remaining: 21,
    days_text: '21 days remaining',
    category: 'EVC',
    severity: 'warning',
  },
  {
    id: 'dl-4',
    date_display: '15 Nov',
    title: 'Faculty Cadre Ratio Endorsement',
    days_remaining: 24,
    days_text: '24 days remaining',
    category: 'Document',
    severity: 'info',
  },
];

export const mockDocumentPassport: DocumentPassportItem[] = [
  {
    id: 1,
    document_type: 'Lease Agreement',
    document_name: 'Land_Lease_Agreement_Campus_2026.pdf',
    verification_status: 'Verified',
    expiry_date: '2026-11-03',
    expiry_status: 'Expiring Soon',
    days_remaining: 12,
    file_url: '/api/institution/documents/download/1',
  },
  {
    id: 2,
    document_type: 'Building Completion Certificate',
    document_name: 'Building_Completion_Cert_PWD.pdf',
    verification_status: 'Verified',
    expiry_date: '2028-08-20',
    expiry_status: 'Valid',
    days_remaining: 667,
    file_url: '/api/institution/documents/download/2',
  },
  {
    id: 3,
    document_type: 'Fire Safety Certificate',
    document_name: 'Fire_Safety_NOC_Pune_Municipal.pdf',
    verification_status: 'Expired',
    expiry_date: '2026-10-17',
    expiry_status: 'Expired',
    days_remaining: -5,
    file_url: '/api/institution/documents/download/3',
  },
  {
    id: 4,
    document_type: 'Affiliation Certificate',
    document_name: 'SPPU_University_Affiliation_2026.pdf',
    verification_status: 'Expired',
    expiry_date: '2026-10-05',
    expiry_status: 'Expired',
    days_remaining: -17,
    file_url: '/api/institution/documents/download/4',
  },
  {
    id: 5,
    document_type: 'Land Ownership Document',
    document_name: 'Govt_Revenue_Land_Title_Sanad.pdf',
    verification_status: 'Verified',
    expiry_status: 'Permanent',
    file_url: '/api/institution/documents/download/5',
  },
  {
    id: 6,
    document_type: 'Infrastructure Certificate',
    document_name: 'Barrier_Free_Access_Audit_Report.pdf',
    verification_status: 'Verified',
    expiry_date: '2027-04-20',
    expiry_status: 'Valid',
    days_remaining: 180,
    file_url: '/api/institution/documents/download/6',
  },
];

export const mockComplianceSummary: ComplianceSummaryData = {
  total_requirements: 10,
  completed_requirements: 8,
  pending_requirements: 1,
  overdue_requirements: 1,
  progress_percentage: 80.0,
};

export const mockEVCStatus: EVCStatusData = mockEVCDetail;

export const mockNotifications: NotificationItem[] = mockNotificationsList;

export const mockAlerts: AlertItem[] = mockAlertsList;

export const mockHealthScore: HealthScoreData = {
  score: 82,
  max_score: 100,
  status: 'Good',
  breakdown: {
    application_compliance: 90.0,
    document_validity: 75.0,
    undertaking_compliance: 85.0,
    pending_actions: 80.0,
  },
  disclaimer: 'AICTE SmartAssist Institutional Health Indicator. Not an official AICTE score.',
};

export const mockConsolidatedDashboard: ConsolidatedDashboard = {
  institution: defaultMockInstitution,
  summary: mockSummaryCards,
  application_summary: mockApplicationSummary,
  recent_applications: mockRecentApplications,
  action_required: mockActionRequired,
  deadlines: mockUpcomingDeadlines,
  document_passport: mockDocumentPassport,
  compliance: mockComplianceSummary,
  evc: mockEVCStatus,
  notifications: mockNotifications,
  alerts: mockAlerts,
  health_score: mockHealthScore,
};
