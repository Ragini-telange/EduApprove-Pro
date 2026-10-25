import { EVCStatusData } from '../types';

export const mockEVCDetail: EVCStatusData = {
  is_applicable: true,
  id: 1,
  application_id: 3,
  application_number: 'APP-2026-1008',
  visit_date: '2026-11-20',
  formatted_date: '20 Nov 2026',
  visit_time: '10:30 AM',
  visit_type: 'Expert Visiting Committee (EVC) — Physical Inspection',
  status: 'Scheduled',
  committee_members_count: 3,
  preparation_status_pct: 75,
  venue_or_mode: 'On-site Physical Campus Inspection',
  contact_person: 'Dr. R. K. Sharma (Dean Academics & AICTE Coordinator)',
  remarks:
    'Inspection team empaneled by AICTE Western Regional Office for physical verification of labs, instructional area, and faculty dossiers.',
  days_until_visit: 29,
  committee_panel: [
    {
      name: 'Prof. P. V. Rao',
      role: 'Committee Chairman',
      institution: 'Indian Institute of Technology (IIT) Delhi',
    },
    {
      name: 'Dr. Sunita Kulkarni',
      role: 'Subject Expert (Academic)',
      institution: 'COEP Technological University, Pune',
    },
    {
      name: 'Er. M. N. Deshmukh',
      role: 'State PWD / Infrastructure Nominee',
      institution: 'Public Works Department, Chief Engineer Office',
    },
  ],
  required_documents: [
    'Original faculty appointment orders, joining reports, and Form 16 / Bank salary passbooks for last 12 months',
    'Departmental laboratory equipment stock registers with annual functional calibration certificates',
    'Central Library digital NDLI access logs, physical book accession registers, and e-journal subscription invoices',
    'Fire Safety NOC original physical certificate endorsed by Municipal Chief Fire Officer',
    'Barrier-free accessibility compliance certificate with ramp gradient & elevator audit report',
    'Government revenue land title sanad and executed registered land lease agreement deed',
    'Student Grievance Redressal and Anti-Ragging committee resolution records with incident logs',
  ],
  instructions: [
    'All original dossiers must be arranged in the Administrative Boardroom in labeled physical folders prior to 09:30 AM on the day of the visit.',
    'A dedicated high-speed presentation terminal (HDMI enabled) must be kept operational for presenting the institutional compliance deck.',
    'The Principal, AICTE Liaison Officer, and all Department Heads must remain physically available on campus throughout the committee review.',
    'Confidential interactive sessions between committee members and enrolled students/faculty will be held in closed session without administrative staff present.',
    'No original documents are to be removed from the inspection boardroom without the signed receipt of the Committee Chairman.',
  ],
};
