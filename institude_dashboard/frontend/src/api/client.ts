import {
  ConsolidatedDashboard,
  SummaryCardsData,
  ApplicationSummaryData,
  RecentApplication,
  ApplicationFull,
  ActionRequiredItem,
  DeadlineItem,
  DocumentPassportItem,
  DocumentFull,
  ComplianceSummaryData,
  ComplianceRequirement,
  EVCStatusData,
  NotificationItem,
  AlertItem,
  HealthScoreData
} from '../types';

const API_BASE = '/api/institution';
const DEFAULT_INST_ID = 'AICTE-INS-10245';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-institution-id': DEFAULT_INST_ID,
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch {
      // use default message
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchJson<ConsolidatedDashboard>(`${API_BASE}/dashboard`),
  getSummaryCards: () => fetchJson<SummaryCardsData>(`${API_BASE}/dashboard/summary`),
  getApplicationSummary: () => fetchJson<ApplicationSummaryData>(`${API_BASE}/dashboard/application-summary`),
  getActionRequired: () => fetchJson<ActionRequiredItem[]>(`${API_BASE}/dashboard/action-required`),
  getDeadlines: () => fetchJson<DeadlineItem[]>(`${API_BASE}/dashboard/deadlines`),

  // Applications
  getApplications: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return fetchJson<ApplicationFull[]>(`${API_BASE}/applications?${params.toString()}`);
  },
  getRecentApplications: (limit = 5) =>
    fetchJson<RecentApplication[]>(`${API_BASE}/applications/recent?limit=${limit}`),
  getApplicationById: (id: number) => fetchJson<ApplicationFull>(`${API_BASE}/applications/${id}`),
  createApplication: (payload: { application_type: string; remarks?: string }) =>
    fetchJson<ApplicationFull>(`${API_BASE}/applications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Documents
  getDocuments: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('document_type', type);
    if (status) params.append('status', status);
    return fetchJson<DocumentFull[]>(`${API_BASE}/documents?${params.toString()}`);
  },
  getDocumentPassport: () => fetchJson<DocumentPassportItem[]>(`${API_BASE}/documents/passport`),
  uploadDocument: async (formData: FormData): Promise<DocumentFull> => {
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        'x-institution-id': DEFAULT_INST_ID,
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return response.json();
  },

  // Compliance
  getComplianceSummary: () => fetchJson<ComplianceSummaryData>(`${API_BASE}/compliance/summary`),
  getComplianceRequirements: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    return fetchJson<ComplianceRequirement[]>(`${API_BASE}/compliance?${params.toString()}`);
  },
  submitCompliance: (id: number, remarks?: string) =>
    fetchJson<ComplianceRequirement>(`${API_BASE}/compliance/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    }),

  // EVC
  getEVCStatus: () => fetchJson<EVCStatusData>(`${API_BASE}/evc/status`),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    fetchJson<NotificationItem[]>(`${API_BASE}/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id: number) =>
    fetchJson<NotificationItem>(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    fetchJson<{ message: string }>(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
    }),

  // Alerts
  getAlerts: () => fetchJson<AlertItem[]>(`${API_BASE}/alerts`),

  // Health Score
  getHealthScore: () => fetchJson<HealthScoreData>(`${API_BASE}/health-score`),

  // Assistant
  askAssistant: (message: string) =>
    fetchJson<{
      answer: string;
      related_items: Array<{ id?: string; title: string; type: string; link?: string }>;
      timestamp: string;
      suggestions: string[];
    }>(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
