export interface Institution {
  id: string;
  name: string;
  code?: string;
  category: string;
  institution_type: string;
  email: string;
  phone?: string;
  address?: string;
  state: string;
  district: string;
  pincode: string;
  establishment_year: number;
  approval_status: string;
  current_academic_year: string;
  is_active: boolean;
}

export interface SummaryCardsData {
  total_applications: number;
  under_scrutiny: number;
  correction_required: number;
  compliance_pending: number;
  documents_expiring: number;
  expired_documents: number;
}

export interface ApplicationChartItem {
  name: string;
  count: number;
  color: string;
}

export interface ApplicationSummaryData {
  total: number;
  distribution: ApplicationChartItem[];
}

export interface RecentApplication {
  id: number;
  application_number: string;
  application_type: string;
  submitted_date?: string;
  current_stage: string;
  status: string;
}

export interface ApplicationTimelineStep {
  stage: string;
  status: 'completed' | 'current' | 'pending' | 'action_required' | 'rejected';
  date?: string;
  notes?: string;
}

export interface ApplicationFull extends RecentApplication {
  institution_id: string;
  academic_year: string;
  submitted_at?: string;
  last_updated_at?: string;
  correction_deadline?: string;
  rejection_reason?: string;
  remarks?: string;
  timeline?: ApplicationTimelineStep[];
  created_at: string;
  updated_at: string;
}

export interface ActionRequiredItem {
  id: string;
  type: string;
  title: string;
  description: string;
  button_label: string;
  button_action: string;
  severity: 'critical' | 'high' | 'medium';
  entity_id?: string;
}

export interface DeadlineItem {
  id: string;
  date_display: string;
  title: string;
  days_remaining: number;
  days_text: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface DocumentHistoryEntry {
  version: number;
  uploaded_at: string;
  uploaded_by: string;
  file_name: string;
  file_size_kb: number;
  action: 'initial_upload' | 'renewal_replacement' | 'resubmission';
}

export interface DocumentVerificationEntry {
  verified_at: string;
  verified_by: string;
  status: 'Verified' | 'Verification Pending' | 'Rejected' | 'Expired';
  remarks?: string;
}

export interface DocumentPassportItem {
  id: number;
  document_type: string;
  document_name: string;
  document_code?: string;
  application_id?: string;
  application_number?: string;
  uploaded_at?: string;
  verification_status: string;
  expiry_date?: string;
  expiry_status: 'Valid' | 'Expiring Soon' | 'Critical' | 'Expired' | 'Permanent' | 'Verification Pending';
  renewal_status?: 'Up to Date' | 'Renewal Due' | 'Renewal Submitted' | 'Not Applicable';
  days_remaining?: number;
  file_url?: string;
  upload_history?: DocumentHistoryEntry[];
  verification_history?: DocumentVerificationEntry[];
}

export interface DocumentFull extends DocumentPassportItem {
  institution_id: string;
  file_path: string;
  uploaded_at: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  file_size_kb: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSummaryData {
  total_requirements: number;
  completed_requirements: number;
  pending_requirements: number;
  overdue_requirements: number;
  progress_percentage: number;
}

export interface ComplianceRequirement {
  id: number;
  institution_id: string;
  requirement_name: string;
  category: string;
  description?: string;
  due_date: string;
  status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected' | 'Overdue';
  submitted_at?: string;
  verified_at?: string;
  remarks?: string;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface EVCStatusData {
  is_applicable: boolean;
  id?: number;
  application_id?: number;
  application_number?: string;
  visit_date?: string;
  formatted_date?: string;
  visit_time?: string;
  visit_type?: string;
  status?: string;
  committee_members_count?: number;
  preparation_status_pct?: number;
  venue_or_mode?: string;
  contact_person?: string;
  remarks?: string;
  days_until_visit?: number;
  required_documents?: string[];
  instructions?: string[];
  committee_panel?: Array<{ name: string; role: string; institution: string }>;
}

export interface NotificationItem {
  id: number;
  institution_id: string;
  title: string;
  message: string;
  notification_type: 'Application' | 'Correction Required' | 'Document Expiring' | 'Compliance' | 'EVC Scheduled' | 'System';
  severity: 'info' | 'warning' | 'critical' | 'success';
  is_read: boolean;
  related_entity_type?: 'application' | 'document' | 'compliance' | 'evc';
  related_entity_id?: string;
  created_at: string;
  time_ago?: string;
}

export interface AlertItem {
  id: number;
  institution_id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'High Priority' | 'Medium' | 'Upcoming';
  category: string;
  action_url?: string;
  action_label?: string;
  is_dismissed: boolean;
  created_at: string;
}

export interface HealthScoreData {
  score: number;
  max_score: number;
  status: string;
  breakdown: {
    application_compliance: number;
    document_validity: number;
    undertaking_compliance: number;
    pending_actions: number;
  };
  disclaimer: string;
}

export interface ConsolidatedDashboard {
  institution: Institution;
  summary: SummaryCardsData;
  application_summary: ApplicationSummaryData;
  recent_applications: RecentApplication[];
  action_required: ActionRequiredItem[];
  deadlines: DeadlineItem[];
  document_passport: DocumentPassportItem[];
  compliance: ComplianceSummaryData;
  evc: EVCStatusData;
  notifications: NotificationItem[];
  alerts: AlertItem[];
  health_score: HealthScoreData;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  related_items?: Array<{
    id?: string;
    title: string;
    type: string;
    link?: string;
  }>;
  suggestions?: string[];
}
