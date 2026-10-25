import { describe, it, expect, beforeEach } from 'vitest';
import { MockEduApproveRepository } from '../services/mockRepository';
import {
  calculateDeadlineDaysRemaining,
  getDeadlineIndicator,
  calculateDocumentExpiry,
} from '../modules/regional-officer/utils/dateHelpers';
import { UserRole } from '../types';

describe('Phase 5 — EVC, Compliance, Document Expiry and Late Requests', () => {
  let repository: MockEduApproveRepository;

  beforeEach(() => {
    repository = new MockEduApproveRepository();
  });

  // ==========================================================================
  // A. EVC MANAGEMENT TESTS
  // ==========================================================================
  describe('A. EVC Status Validation & Operational Lifecycle', () => {
    it('retrieves all configured EVC records with visit types and statuses', async () => {
      const records = await repository.getEVCRecords();
      expect(records.length).toBeGreaterThanOrEqual(4);

      const statuses = records.map((r) => r.status);
      expect(statuses).toContain('evc_scheduled');
      expect(statuses).toContain('pending_scheduling');
      expect(statuses).toContain('visit_completed');
      expect(statuses).toContain('report_submitted');
    });

    it('schedules an EVC visit and transitions status from pending_scheduling to evc_scheduled', async () => {
      const pendingRecordId = 'evc-wro-2026-003'; // Pune Institute of Advanced Tech
      const committee = [
        {
          id: 'exp-test-01',
          name: 'Dr. Suresh Patil',
          designation: 'Professor',
          institution: 'VJTI Mumbai',
          specialization: 'Civil & Structural Norms',
          role: 'Chairman' as const,
        },
      ];

      const res = await repository.scheduleEVC(
        pendingRecordId,
        '2026-10-28',
        '2026-10-29',
        committee,
        'Ragini Telange',
        false,
        'Inspect new high performance lab cluster and emergency egress exits.',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.record.status).toBe('evc_scheduled');
      expect(res.record.confirmedDate).toBe('2026-10-29');
      expect(res.record.committeeMembers.length).toBe(1);
      expect(res.record.committeeMembers[0].name).toBe('Dr. Suresh Patil');

      // Verify audit log entry
      const auditLogs = await repository.getAuditLogs(res.record.applicationId);
      const scheduleLog = auditLogs.find((l) => l.action === 'EVC_VISIT_SCHEDULED');
      expect(scheduleLog).toBeDefined();
      expect(scheduleLog?.newState).toBe('evc_scheduled');
    });

    it('supports surprise / unannounced visits with confidentiality flag', async () => {
      const pendingRecordId = 'evc-wro-2026-003';
      const res = await repository.scheduleEVC(
        pendingRecordId,
        '2026-10-30',
        '2026-10-31',
        [],
        'Ragini Telange',
        true, // isUnannounced
        'Surprise verification of faculty physical presence during working hours.',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.record.isUnannounced).toBe(true);
    });

    it('rejects scheduling an already cancelled EVC visit', async () => {
      const cancelledId = 'evc-wro-2026-005';
      const res = await repository.scheduleEVC(
        cancelledId,
        '2026-11-01',
        '2026-11-02',
        [],
        'Ragini Telange',
        false,
        'Re-scheduling attempt',
        'regional_officer'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot schedule a cancelled EVC visit');
    });

    it('records EVC visit completion and transitions to visit_completed with mandatory remarks', async () => {
      const scheduledId = 'evc-wro-2026-001';

      // 1. Should fail without remarks
      const failRes = await repository.recordEVCVisitCompletion(
        scheduledId,
        '2026-10-22',
        '   ',
        'Ragini Telange',
        'regional_officer'
      );
      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain('Officer remarks are mandatory');

      // 2. Succeeds with valid remarks
      const successRes = await repository.recordEVCVisitCompletion(
        scheduledId,
        '2026-10-22',
        'Physical visit completed. Committee inspected robotics lab and signed inspection diary.',
        'Ragini Telange',
        'regional_officer'
      );
      expect(successRes.success).toBe(true);
      expect(successRes.record.status).toBe('visit_completed');
    });

    it('submits EVC inspection report with outcome recommendation and transitions to report_submitted', async () => {
      const completedVisitId = 'evc-wro-2026-004'; // Marathwada Institute of Pharmacy

      // 1. Rejects empty summary
      const emptyRes = await repository.submitEVCReport(
        completedVisitId,
        '  ',
        'Satisfactory',
        'Officer endorsement',
        'Ragini Telange',
        'regional_officer'
      );
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain('Report summary findings and official outcome recommendation are mandatory');

      // 2. Successfully submits report
      const validRes = await repository.submitEVCReport(
        completedVisitId,
        'Laboratory cleanroom HVAC verified; sprinkler pipeline now fully functional with water pressure test verified compliant.',
        'Satisfactory',
        'Recommended for intake sanction.',
        'Ragini Telange',
        'regional_officer'
      );
      expect(validRes.success).toBe(true);
      expect(validRes.record.status).toBe('report_submitted');
      expect(validRes.record.reportSubmittedAt).toBeDefined();
      expect(validRes.record.outcomeRecommendation).toBe('Satisfactory');
    });

    it('cancels EVC visit with mandatory justification reason', async () => {
      const visitId = 'evc-wro-2026-001';

      // 1. Fails without reason
      const failRes = await repository.cancelEVCVisit(visitId, '', 'Ragini Telange', 'regional_officer');
      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain('mandatory reason is required');

      // 2. Succeeds with reason
      const successRes = await repository.cancelEVCVisit(
        visitId,
        'Institution requested deferment due to university semester examinations.',
        'Ragini Telange',
        'regional_officer'
      );
      expect(successRes.success).toBe(true);
      expect(successRes.record.status).toBe('cancelled');
    });
  });

  // ==========================================================================
  // B. COMPLIANCE MANAGEMENT TESTS
  // ==========================================================================
  describe('B. Compliance Management & Review Workflows', () => {
    it('retrieves compliance items including anti-ragging, building stability, and ICC mandates', async () => {
      const items = await repository.getComplianceItems();
      expect(items.length).toBeGreaterThanOrEqual(4);

      const clauses = items.map((i) => i.clause);
      expect(clauses.some((c) => c.includes('Anti-Ragging') || c.includes('37-3/Legal'))).toBe(true);
      expect(clauses.some((c) => c.includes('4.14'))).toBe(true); // Building structural stability
    });

    it('allows authorized officer to record verification of submitted compliance undertaking', async () => {
      const compId = 'comp-001'; // Anti-Ragging submitted item
      const res = await repository.updateComplianceStatus(
        compId,
        'verified',
        'Verified anti-ragging squad notification and student portal undertaking registers.',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.item.status).toBe('verified');
      expect(res.item.officerRemarks).toContain('Verified anti-ragging squad');
    });

    it('allows authorized officer to request corrections on deficient compliance submissions', async () => {
      const compId = 'comp-001';
      const res = await repository.updateComplianceStatus(
        compId,
        'correction_required',
        'Affidavit missing district magistrate representative signature. Upload amended document.',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.item.status).toBe('correction_required');
    });

    it('rejects compliance updates when officer remarks are empty', async () => {
      const compId = 'comp-002';
      const res = await repository.updateComplianceStatus(
        compId,
        'verified',
        '   ',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Officer remarks are mandatory');
    });
  });

  // ==========================================================================
  // C. DOCUMENT EXPIRY MONITORING & CONFIGURABLE THRESHOLDS
  // ==========================================================================
  describe('C. Document Expiry Monitoring & Strict No-Inference Rules', () => {
    // Reference Evaluation Date is deterministic: 2026-10-22

    it('evaluates approaching expiry based on configurable thresholds (30, 15, 7 days)', () => {
      // Doc expiring on 2026-11-04 is 13 days away from 2026-10-22
      const exp13Days = '2026-11-04';

      // At 30-day threshold -> approaching
      const res30 = calculateDocumentExpiry(exp13Days, 30);
      expect(res30.hasExpiry).toBe(true);
      expect(res30.isExpired).toBe(false);
      expect(res30.isApproachingExpiry).toBe(true);
      expect(res30.daysRemaining).toBe(13);

      // At 15-day threshold -> approaching
      const res15 = calculateDocumentExpiry(exp13Days, 15);
      expect(res15.isApproachingExpiry).toBe(true);

      // At 7-day threshold -> NOT approaching yet
      const res7 = calculateDocumentExpiry(exp13Days, 7);
      expect(res7.isApproachingExpiry).toBe(false);
    });

    it('evaluates 27-day expiry accurately across thresholds', () => {
      // Doc expiring on 2026-11-18 is 27 days away from 2026-10-22
      const exp27Days = '2026-11-18';

      // At 30 days -> approaching
      expect(calculateDocumentExpiry(exp27Days, 30).isApproachingExpiry).toBe(true);
      // At 15 days -> not approaching
      expect(calculateDocumentExpiry(exp27Days, 15).isApproachingExpiry).toBe(false);
      // At 7 days -> not approaching
      expect(calculateDocumentExpiry(exp27Days, 7).isApproachingExpiry).toBe(false);
    });

    it('identifies expired documents and calculates exact overdue days', () => {
      // Lapsed on 2026-10-14, which is 8 days before 2026-10-22
      const pastDate = '2026-10-14';
      const res = calculateDocumentExpiry(pastDate, 30);

      expect(res.hasExpiry).toBe(true);
      expect(res.isExpired).toBe(true);
      expect(res.isApproachingExpiry).toBe(false);
      expect(res.daysRemaining).toBe(-8);
      expect(res.label).toContain('Expired (8d ago on 2026-10-14)');
      expect(res.accessibleText).toContain('expired 8 days ago');
    });

    it('STRICT REGULATORY RULE: Does NOT infer an expiry date when source record lacks one', () => {
      // Land deeds and master plans lack statutory expiration dates
      const undefinedExpiry = calculateDocumentExpiry(undefined);
      expect(undefinedExpiry.hasExpiry).toBe(false);
      expect(undefinedExpiry.isExpired).toBe(false);
      expect(undefinedExpiry.isApproachingExpiry).toBe(false);
      expect(undefinedExpiry.daysRemaining).toBeNull();
      expect(undefinedExpiry.label).toBe('No Statutory Expiry Date');

      const emptyExpiry = calculateDocumentExpiry('   ');
      expect(emptyExpiry.hasExpiry).toBe(false);
      expect(emptyExpiry.daysRemaining).toBeNull();

      const nullExpiry = calculateDocumentExpiry(null);
      expect(nullExpiry.hasExpiry).toBe(false);
      expect(nullExpiry.daysRemaining).toBeNull();
    });
  });

  // ==========================================================================
  // D. LATE SUBMISSION OR RE-APPLICATION REQUESTS
  // ==========================================================================
  describe('D. Late Submission & Condonation Requests Review', () => {
    it('retrieves late submission petitions with stated reason, category and disclaimer', async () => {
      const requests = await repository.getLateRequests();
      expect(requests.length).toBeGreaterThanOrEqual(3);

      const categories = requests.map((r) => r.reasonCategory);
      expect(categories).toContain('Natural Calamity');
      expect(categories).toContain('Technical Gateway Failure');
      expect(categories).toContain('Administrative Exigency');

      // Verify each contains statutory disclaimer
      requests.forEach((r) => {
        expect(r.statutoryDisclaimer).toContain('does NOT grant an official exemption or waiver');
      });
    });

    it('reviews late request and accepts for scrutiny processing with mandatory remarks', async () => {
      const reqId = 'late-001';
      const res = await repository.reviewLateRequest(
        reqId,
        'accepted_for_processing',
        'District collector notification of localized flash flooding verified. Admitted to regional scrutiny queue without waiver of final cutoff.',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.request.status).toBe('accepted_for_processing');
      expect(res.request.reviewedBy).toBe('Ragini Telange');
      expect(res.request.reviewedAt).toBeDefined();

      // Audit log check
      const logs = await repository.getAuditLogs(res.request.applicationId);
      const lateLog = logs.find((l) => l.action === 'LATE_REQUEST_REVIEWED');
      expect(lateLog).toBeDefined();
      expect(lateLog?.newState).toBe('accepted_for_processing');
    });

    it('supports requesting additional information from institution on late petition', async () => {
      const reqId = 'late-002';
      const res = await repository.reviewLateRequest(
        reqId,
        'more_info_required',
        'Certified bank transaction dispute reference number (UTR) required from branch manager.',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.request.status).toBe('more_info_required');
    });

    it('supports declining late petition with official justification remarks', async () => {
      const reqId = 'late-002';
      const res = await repository.reviewLateRequest(
        reqId,
        'not_accepted',
        'Sufficient prior notice was published for portal cutoff. Grounds for condonation not substantiated under APH Chapter 1 norms.',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(true);
      expect(res.request.status).toBe('not_accepted');
    });

    it('rejects review when reviewer remarks are empty', async () => {
      const reqId = 'late-001';
      const res = await repository.reviewLateRequest(
        reqId,
        'accepted_for_processing',
        '   ',
        'Ragini Telange',
        'regional_officer'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Officer remarks and recommendation justification are mandatory');
    });
  });

  // ==========================================================================
  // E. DEADLINE INDICATORS TESTS
  // ==========================================================================
  describe('E. Deadline Indicators & Non-Mutating Presentation', () => {
    it('distinguishes upcoming, due today, overdue, completed, and on-hold states', () => {
      // 1. Upcoming (6 days from 2026-10-22)
      const upcoming = getDeadlineIndicator('2026-10-28');
      expect(upcoming.type).toBe('upcoming');
      expect(upcoming.daysDiff).toBe(6);
      expect(upcoming.label).toContain('Upcoming (6d remaining)');

      // 2. Due Today (2026-10-22)
      const dueToday = getDeadlineIndicator('2026-10-22');
      expect(dueToday.type).toBe('due_today');
      expect(dueToday.daysDiff).toBe(0);
      expect(dueToday.label).toBe('Due Today');
      expect(dueToday.accessibleText).toContain('Due today. Final submission window expires midnight');

      // 3. Overdue (2026-10-15 is 7 days overdue)
      const overdue = getDeadlineIndicator('2026-10-15');
      expect(overdue.type).toBe('overdue');
      expect(overdue.daysDiff).toBe(-7);
      expect(overdue.label).toBe('Overdue by 7 days');
      expect(overdue.accessibleText).toContain('Overdue by 7 calendar days');

      // 4. Completed
      const completed = getDeadlineIndicator('2026-10-15', true);
      expect(completed.type).toBe('completed');
      expect(completed.label).toBe('Completed');

      // 5. On Hold
      const onHold = getDeadlineIndicator('2026-10-15', false, true);
      expect(onHold.type).toBe('on_hold');
      expect(onHold.label).toContain('On Hold');
    });

    it('calculates deadline days remaining and severity tiers', () => {
      const criticalLeft = calculateDeadlineDaysRemaining('2026-10-24'); // 2 days left
      expect(criticalLeft.severity).toBe('critical');
      expect(criticalLeft.isOverdue).toBe(false);
      expect(criticalLeft.daysRemaining).toBe(2);

      const warningLeft = calculateDeadlineDaysRemaining('2026-10-28'); // 6 days left
      expect(warningLeft.severity).toBe('warning');

      const normalLeft = calculateDeadlineDaysRemaining('2026-11-15'); // 24 days left
      expect(normalLeft.severity).toBe('normal');

      const overdueLeft = calculateDeadlineDaysRemaining('2026-10-18'); // 4 days overdue
      expect(overdueLeft.isOverdue).toBe(true);
      expect(overdueLeft.severity).toBe('critical');
      expect(overdueLeft.label).toBe('4d Overdue');
    });

    it('STRICT REGULATORY RULE: Calling deadline indicators does NOT mutate stored application statuses or deadlines', async () => {
      const apps = await repository.getApplications();
      const testApp = apps[0];
      const originalDeadline = testApp.deadlineDate;
      const originalStatus = testApp.status;

      // Calculate indicator on past date
      const indicator = getDeadlineIndicator('2026-10-01');
      expect(indicator.type).toBe('overdue');

      // Ensure application model was NOT modified
      const refetchedApp = await repository.getApplicationById(testApp.id);
      expect(refetchedApp?.deadlineDate).toBe(originalDeadline);
      expect(refetchedApp?.status).toBe(originalStatus);
    });
  });

  // ==========================================================================
  // F. ROLE PERMISSIONS & RBAC AUTHORIZATION TESTS
  // ==========================================================================
  describe('F. Role Permissions & Unauthorized Rejections', () => {
    const unauthorizedRole: UserRole = 'institution_admin';

    it('rejects EVC scheduling by unauthorized roles', async () => {
      const res = await repository.scheduleEVC(
        'evc-wro-2026-003',
        '2026-10-30',
        '2026-10-31',
        [],
        'College Principal',
        false,
        'Unauthorized visit schedule attempt',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects recording visit completion by unauthorized roles', async () => {
      const res = await repository.recordEVCVisitCompletion(
        'evc-wro-2026-001',
        '2026-10-22',
        'Principal self-completion note',
        'College Principal',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects EVC inspection report submission by unauthorized roles', async () => {
      const res = await repository.submitEVCReport(
        'evc-wro-2026-004',
        'Self reported findings',
        'Satisfactory',
        'Self notes',
        'College Principal',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects EVC visit cancellation by unauthorized roles', async () => {
      const res = await repository.cancelEVCVisit(
        'evc-wro-2026-001',
        'Principal attempt to cancel visit',
        'College Principal',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects compliance evaluation updates by unauthorized roles', async () => {
      const res = await repository.updateComplianceStatus(
        'comp-001',
        'verified',
        'Self verification',
        'College Principal',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects late petition review by unauthorized roles', async () => {
      const res = await repository.reviewLateRequest(
        'late-001',
        'accepted_for_processing',
        'Self acceptance',
        'College Principal',
        unauthorizedRole
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('permits authorized roles (regional_officer, senior_authority, super_admin)', async () => {
      const authorizedRoles: UserRole[] = ['regional_officer', 'senior_authority', 'super_admin'];

      for (const role of authorizedRoles) {
        const res = await repository.updateComplianceStatus(
          'comp-005',
          'verified',
          `Verified compliant by ${role}.`,
          'Authorized Officer',
          role
        );
        expect(res.success).toBe(true);
      }
    });
  });
});
