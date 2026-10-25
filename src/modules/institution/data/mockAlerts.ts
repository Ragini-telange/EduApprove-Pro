import { AlertItem } from '../types';

export const mockAlertsList: AlertItem[] = [
  {
    id: 1,
    institution_id: 'INS001',
    title: 'Fire Safety Certificate expired',
    description:
      'Certificate expired 5 days ago (17 Oct 2026). Mandatory renewal required to avoid provisional suspension of seat sanction.',
    severity: 'Critical',
    category: 'Document',
    action_url: '/institution/documents?type=Fire%20Safety%20Certificate',
    action_label: 'Renew Certificate',
    is_dismissed: false,
    created_at: '2026-10-22T05:00:00Z',
  },
  {
    id: 2,
    institution_id: 'INS001',
    title: 'Lease expires in 12 days',
    description:
      'Campus land lease renewal agreement is due on 03 Nov 2026. Submit executed renewal deed to maintain valid land title compliance.',
    severity: 'High',
    category: 'Document',
    action_url: '/institution/documents?type=Lease%20Agreement',
    action_label: 'Upload Renewal',
    is_dismissed: false,
    created_at: '2026-10-22T06:00:00Z',
  },
  {
    id: 3,
    institution_id: 'INS001',
    title: 'Compliance due in 7 days',
    description:
      'Statutory Industry-Academia MoU Endorsement (minimum 5 MoUs) deadline is approaching on 29 Oct 2026.',
    severity: 'Upcoming',
    category: 'Compliance',
    action_url: '/institution/compliance',
    action_label: 'Submit Compliance',
    is_dismissed: false,
    created_at: '2026-10-22T07:00:00Z',
  },
  {
    id: 4,
    institution_id: 'INS001',
    title: 'Biometric Attendance Gateway Latency',
    description:
      'Server packet synchronization latency observed between institutional biometric server and AICTE national portal.',
    severity: 'Medium',
    category: 'System',
    action_url: '/institution/settings',
    action_label: 'Check Gateway',
    is_dismissed: false,
    created_at: '2026-10-21T18:00:00Z',
  },
];
