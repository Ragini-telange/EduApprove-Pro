import { ApplicationType, ScrutinyChecklistItem } from '../types';

export interface RegulatoryChecklistTemplate {
  code: string;
  category: string;
  title: string;
  requirementText: string;
  normReference: string;
  associatedDocCodes: string[];
}

export const CHECKLIST_TEMPLATES: Record<ApplicationType, RegulatoryChecklistTemplate[]> = {
  new_institution: [
    {
      code: 'CHK-NEW-01',
      category: 'Land & Infrastructure',
      title: 'Land Ownership & Registered Sale Deed',
      requirementText: 'Land must be owned or leased on long-term (min 30 years) with clear title registered in the name of the sponsoring Trust/Society.',
      normReference: 'AICTE APH 2026-27 Clause 4.1',
      associatedDocCodes: ['DOC-LND-01'],
    },
    {
      code: 'CHK-NEW-02',
      category: 'Land & Infrastructure',
      title: 'Non-Agricultural Land Conversion (NA) Order',
      requirementText: 'Competent revenue authority conversion order certifying land usage specifically for educational establishment.',
      normReference: 'AICTE APH 2026-27 Clause 4.3',
      associatedDocCodes: ['DOC-LND-02'],
    },
    {
      code: 'CHK-NEW-03',
      category: 'Building & Architecture',
      title: 'Sanctioned Master Plan & Building Approval',
      requirementText: 'Approved building architectural drawings with clear demarcation of instructional, administrative, and amenities areas.',
      normReference: 'AICTE APH 2026-27 Clause 4.5',
      associatedDocCodes: ['DOC-LND-03'],
    },
    {
      code: 'CHK-NEW-04',
      category: 'Safety & Compliance',
      title: 'Fire & Safety NOC from Competent Authority',
      requirementText: 'Valid Fire Safety NOC issued by Chief Fire Officer / Municipal Corporation with unexpired validity.',
      normReference: 'AICTE APH 2026-27 Clause 4.12',
      associatedDocCodes: ['DOC-SAF-01'],
    },
    {
      code: 'CHK-NEW-05',
      category: 'Safety & Compliance',
      title: 'Structural Stability Certificate',
      requirementText: 'Certificate issued by a licensed Structural Engineer / PWD verifying compliance with National Building Code.',
      normReference: 'AICTE APH 2026-27 Clause 4.11',
      associatedDocCodes: ['DOC-SAF-02'],
    },
    {
      code: 'CHK-NEW-06',
      category: 'Financial & Society',
      title: 'Endowment & Reserve Fund Fixed Deposit',
      requirementText: 'Joint Fixed Deposit in the name of Regional Officer AICTE and the Sponsoring Trust for the mandated corpus.',
      normReference: 'AICTE APH 2026-27 Clause 4.16',
      associatedDocCodes: ['DOC-FIN-01'],
    },
    {
      code: 'CHK-NEW-07',
      category: 'Affiliation & Approvals',
      title: 'State Government NOC & University Affiliation Intent',
      requirementText: 'State Government No-Objection Certificate and provisional Letter of Intent from affiliating university.',
      normReference: 'AICTE APH 2026-27 Clause 3.1',
      associatedDocCodes: ['DOC-AFF-01'],
    },
  ],
  extension_of_approval: [
    {
      code: 'CHK-EOA-01',
      category: 'Statutory Affidavits',
      title: 'Annual Compliance Affidavit (Affidavit 1 & 2)',
      requirementText: 'Duly notarized compliance declaration confirming maintenance of AICTE norms, non-excess charging, and fee fixation.',
      normReference: 'AICTE APH 2026-27 Clause 2.1',
      associatedDocCodes: ['DOC-AFF-02'],
    },
    {
      code: 'CHK-EOA-02',
      category: 'Faculty & HR',
      title: 'Cadre Ratio (1:2:6) and University Approved Faculty Roster',
      requirementText: 'Approved faculty list fulfilling Cadre Ratio and Faculty-Student Ratio (1:20 in Engg, 1:15 in Mgmt) with 7th CPC scale.',
      normReference: 'AICTE APH 2026-27 Clause 5.2',
      associatedDocCodes: ['DOC-FAC-01'],
    },
    {
      code: 'CHK-EOA-03',
      category: 'Safety & Compliance',
      title: 'Unexpired Fire Safety NOC & Occupancy Certificate',
      requirementText: 'Maintenance of active Fire NOC and Occupancy Certificate issued by the local municipal body.',
      normReference: 'AICTE APH 2026-27 Clause 4.12',
      associatedDocCodes: ['DOC-SAF-01'],
    },
    {
      code: 'CHK-EOA-04',
      category: 'Governance & Grievance',
      title: 'Anti-Ragging and Internal Complaint Committee Reports',
      requirementText: 'Constituted Anti-Ragging Squad, ICC, SC/ST Committee, and Online Grievance Redressal Portal registration.',
      normReference: 'AICTE APH 2026-27 Clause 6.1',
      associatedDocCodes: ['DOC-GOV-01'],
    },
  ],
  increase_in_intake: [
    {
      code: 'CHK-INC-01',
      category: 'Land & Infrastructure',
      title: 'Surplus Instructional & Laboratory Area',
      requirementText: 'Available built-up area must support existing students plus proposed enhanced division (min 66 sq.m per classroom).',
      normReference: 'AICTE APH 2026-27 Table 4.1',
      associatedDocCodes: ['DOC-LND-02'],
    },
    {
      code: 'CHK-INC-02',
      category: 'Faculty & HR',
      title: 'Faculty Cadre Ratio & Sanctioned Posts for Additional Division',
      requirementText: 'Appointment / sanction of additional Professors and Assistant Professors to maintain required SFR without dilution.',
      normReference: 'AICTE APH 2026-27 Clause 5.2',
      associatedDocCodes: ['DOC-FAC-01'],
    },
    {
      code: 'CHK-INC-03',
      category: 'Laboratories & Equipment',
      title: 'Specialized Laboratory Equipment & Computing Facilities',
      requirementText: 'Verification of purchased lab hardware, software licenses, and min 1:4 terminal-student computing ratio.',
      normReference: 'AICTE APH 2026-27 Clause 4.18',
      associatedDocCodes: ['DOC-LAB-01'],
    },
    {
      code: 'CHK-INC-04',
      category: 'Library & Learning Resources',
      title: 'Library Titles, Volumes & Online Subscriptions',
      requirementText: 'Minimum prescribed titles and e-journal subscriptions for proposed incremental student count.',
      normReference: 'AICTE APH 2026-27 Clause 4.20',
      associatedDocCodes: ['DOC-LIB-01'],
    },
    {
      code: 'CHK-INC-05',
      category: 'Safety & Compliance',
      title: 'Valid Fire Safety NOC',
      requirementText: 'Valid Fire Safety NOC covering enhanced floor / building sections used for additional intake.',
      normReference: 'AICTE APH 2026-27 Clause 4.12',
      associatedDocCodes: ['DOC-SAF-01'],
    },
  ],
  closure_of_course: [
    {
      code: 'CHK-CLS-01',
      category: 'Institutional Resolutions',
      title: 'Governing Body Resolution for Course Closure',
      requirementText: 'Unanimous resolution passed by Trust/Society recommending phase-out or complete closure of the specified programme.',
      normReference: 'AICTE APH 2026-27 Clause 7.1',
      associatedDocCodes: ['DOC-RES-01'],
    },
    {
      code: 'CHK-CLS-02',
      category: 'University Approvals',
      title: 'University No-Objection Certificate (NOC)',
      requirementText: 'Affiliating University approval permitting course closure with student migration safeguards.',
      normReference: 'AICTE APH 2026-27 Clause 7.2',
      associatedDocCodes: ['DOC-AFF-03'],
    },
    {
      code: 'CHK-CLS-03',
      category: 'Student Safeguards',
      title: 'Enrolled Student Protection & Transfer Plan',
      requirementText: 'Detailed plan ensuring existing students complete degree or transfer seamlessly to adjacent accredited institutes.',
      normReference: 'AICTE APH 2026-27 Clause 7.4',
      associatedDocCodes: ['DOC-STU-01'],
    },
    {
      code: 'CHK-CLS-04',
      category: 'Faculty & HR',
      title: 'Faculty Terminal Dues & Rehabilitation Undertaking',
      requirementText: 'Affidavit affirming that all faculty salaries, gratuity, and dues have been settled without legal disputes.',
      normReference: 'AICTE APH 2026-27 Clause 7.5',
      associatedDocCodes: ['DOC-FAC-02'],
    },
  ],
  change_of_site: [
    {
      code: 'CHK-SITE-01',
      category: 'Land & Infrastructure',
      title: 'Land Demarcation & Title Deed of New Premises',
      requirementText: 'Registered ownership and contiguous land title deed for new site meeting prescribed regional acreage.',
      normReference: 'AICTE APH 2026-27 Clause 8.1',
      associatedDocCodes: ['DOC-LND-01'],
    },
    {
      code: 'CHK-SITE-02',
      category: 'Building Approvals',
      title: 'Sanctioned Architectural Plans & OC at New Location',
      requirementText: 'Complete building drawings sanctioned by local development authority for new premises.',
      normReference: 'AICTE APH 2026-27 Clause 8.3',
      associatedDocCodes: ['DOC-LND-02'],
    },
    {
      code: 'CHK-SITE-03',
      category: 'Regulatory Clearances',
      title: 'University & State Government Shifting NOC',
      requirementText: 'State Government and Affiliating University clearance confirming jurisdiction coverage for new location.',
      normReference: 'AICTE APH 2026-27 Clause 8.5',
      associatedDocCodes: ['DOC-AFF-01'],
    },
    {
      code: 'CHK-SITE-04',
      category: 'Safety & Compliance',
      title: 'Fire Safety NOC & Environmental Clearance for New Site',
      requirementText: 'Fresh Fire NOC and State Pollution Control Board clearance for the new establishment.',
      normReference: 'AICTE APH 2026-27 Clause 8.7',
      associatedDocCodes: ['DOC-SAF-01'],
    },
  ],
  conversion_of_women_inst: [
    {
      code: 'CHK-WOM-01',
      category: 'Institutional Resolutions',
      title: 'Governing Council Resolution for Co-Education Conversion',
      requirementText: 'Resolution passed by Management Trust approving conversion from exclusive Women Institution to Co-Education.',
      normReference: 'AICTE APH 2026-27 Clause 9.1',
      associatedDocCodes: ['DOC-RES-01'],
    },
    {
      code: 'CHK-WOM-02',
      category: 'Infrastructure & Safety',
      title: 'Separate Restrooms, Common Rooms & Security Infrastructure',
      requirementText: 'Demarcated separate amenities, female faculty quarters, CCTV surveillance, and security measures.',
      normReference: 'AICTE APH 2026-27 Clause 9.3',
      associatedDocCodes: ['DOC-LND-04'],
    },
    {
      code: 'CHK-WOM-03',
      category: 'Regulatory Clearances',
      title: 'State Government & University Concurrence',
      requirementText: 'No Objection Certificate from State Technical Education Department and Affiliating University.',
      normReference: 'AICTE APH 2026-27 Clause 9.4',
      associatedDocCodes: ['DOC-AFF-01'],
    },
  ],
};

export function getDefaultChecklistForType(
  applicationType: ApplicationType,
  applicationId: string
): ScrutinyChecklistItem[] {
  const templates = CHECKLIST_TEMPLATES[applicationType] || CHECKLIST_TEMPLATES.extension_of_approval;

  return templates.map((tpl, index) => ({
    id: `chk-${applicationId}-${index + 1}`,
    applicationId,
    applicationType,
    category: tpl.category,
    code: tpl.code,
    title: tpl.title,
    requirementText: tpl.requirementText,
    normReference: tpl.normReference,
    status: 'pending',
    officerNotes: '',
    associatedDocCodes: tpl.associatedDocCodes,
  }));
}

export function getChecklistTemplateSummary(type: ApplicationType): {
  totalItems: number;
  categories: string[];
} {
  const items = CHECKLIST_TEMPLATES[type] || [];
  const categories = Array.from(new Set(items.map((i) => i.category)));
  return {
    totalItems: items.length,
    categories,
  };
}
