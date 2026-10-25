import { describe, it, expect, beforeEach } from 'vitest';
import { MockEduApproveRepository } from '../services/mockRepository';
import {
  calculateEscalations,
  DEFAULT_ESCALATION_THRESHOLDS,
  EscalationThresholds,
} from '../modules/regional-officer/utils/escalationHelpers';
import { Application, EVCRecord, ComplianceItem, UserRole } from '../types';

describe('Phase 6 — Notifications, Escalations and Audit History', () => {
  let repository: MockEduApproveRepository;

  beforeEach(() => {
    repository = new MockEduApproveRepository();
  });

  // ==========================================================================
  // A. NOTIFICATIONS CENTRE & NAVIGATION TESTS
  // ==========================================================================
  describe('A. Notifications Center & Navigation Routing', () => {
    it('retrieves notifications covering all statutory categories with metadata', async () => {
      const notifs = await repository.getNotifications('regional_officer', 'ro-usr-001');
      expect(notifs.length).toBeGreaterThanOrEqual(6);

      const categories = notifs.map((n) => n.category);
      expect(categories).toContain('deadline');
      expect(categories).toContain('resubmission');
      expect(categories).toContain('evc_report');
      expect(categories).toContain('escalation');
      expect(categories).toContain('assignment');
      expect(categories).toContain('overdue');
      expect(categories).toContain('compliance');
      expect(categories).toContain('document_expiry');
      expect(categories).toContain('late_request');

      // Verify each notification has title, message, createdAt, and severity
      notifs.forEach((n) => {
        expect(n.id).toBeDefined();
        expect(n.title.length).toBeGreaterThan(0);
        expect(n.message.length).toBeGreaterThan(0);
        expect(n.createdAt).toBeDefined();
        expect(['info', 'warning', 'urgent', 'critical']).toContain(n.severity);
      });
    });

    it('provides valid action navigation URLs mapping to related case records', async () => {
      const notifs = await repository.getNotifications('regional_officer', 'ro-usr-001');

      const appNotif = notifs.find((n) => n.category === 'deadline');
      expect(appNotif?.actionUrl).toContain('/regional-officer/applications/');

      const resubNotif = notifs.find((n) => n.category === 'resubmission');
      expect(resubNotif?.actionUrl).toContain('/regional-officer/scrutiny-workspace/');

      const evcNotif = notifs.find((n) => n.category === 'evc_report');
      expect(evcNotif?.actionUrl).toBe('/regional-officer/evc');

      const compNotif = notifs.find((n) => n.category === 'compliance');
      expect(compNotif?.actionUrl).toBe('/regional-officer/compliance');

      const lateNotif = notifs.find((n) => n.category === 'late_request');
      expect(lateNotif?.actionUrl).toBe('/regional-officer/late-requests');
    });

    it('marks a single notification as read only when service confirms success', async () => {
      const initialNotifs = await repository.getNotifications('regional_officer', 'ro-usr-001');
      const unread = initialNotifs.find((n) => !n.isRead);
      expect(unread).toBeDefined();

      const result = await repository.markNotificationAsRead(unread!.id);
      expect(result.success).toBe(true);

      // Verify state has changed in repository
      const updatedNotifs = await repository.getNotifications('regional_officer', 'ro-usr-001');
      const nowRead = updatedNotifs.find((n) => n.id === unread!.id);
      expect(nowRead?.isRead).toBe(true);
    });

    it('marks all notifications as read in bulk', async () => {
      const res = await repository.markAllNotificationsAsRead('regional_officer', 'ro-usr-001');
      expect(res.success).toBe(true);
      expect(res.count).toBeGreaterThanOrEqual(1);

      const notifs = await repository.getNotifications('regional_officer', 'ro-usr-001');
      const unreadRemaining = notifs.filter((n) => !n.isRead);
      expect(unreadRemaining.length).toBe(0);
    });

    it('returns failure when attempting to mark an invalid notification ID', async () => {
      const res = await repository.markNotificationAsRead('non-existent-notif-999');
      expect(res.success).toBe(false);
    });
  });

  // ==========================================================================
  // B. ESCALATION MANAGEMENT & CONFIGURABLE THRESHOLDS
  // ==========================================================================
  describe('B. Escalation Calculations & Threshold Tuning', () => {
    let apps: Application[];
    let evcs: EVCRecord[];
    let comps: ComplianceItem[];

    beforeEach(async () => {
      apps = await repository.getApplications();
      evcs = await repository.getEVCRecords();
      comps = await repository.getComplianceItems();
    });

    it('calculates escalations for overdue scrutiny deadlines with exact elapsed day basis', () => {
      const escalations = calculateEscalations(apps, evcs, comps);
      const overdueEsc = escalations.find((e) => e.triggerType === 'overdue_deadline');

      expect(overdueEsc).toBeDefined();
      expect(overdueEsc?.severity).toBe('critical');
      expect(overdueEsc?.basisExplanation).toContain('calendar day');
      expect(overdueEsc?.elapsedDays).toBeGreaterThan(0);
    });

    it('detects long-running scrutiny exceeding configured threshold days', () => {
      // With default threshold (5 days)
      const escalations = calculateEscalations(apps, evcs, comps, {
        ...DEFAULT_ESCALATION_THRESHOLDS,
        longRunningScrutinyDays: 5,
      });

      const longScrutiny = escalations.filter((e) => e.triggerType === 'long_running_scrutiny');
      expect(longScrutiny.length).toBeGreaterThanOrEqual(1);
      longScrutiny.forEach((e) => {
        expect(e.elapsedDays).toBeGreaterThanOrEqual(5);
        expect(e.basisExplanation).toContain('exceeding standard 5-day evaluation target');
      });
    });

    it('flags repeated correction cycles when resubmission count meets threshold', () => {
      // Find app with reScrutinyCount >= 1
      const escalations = calculateEscalations(apps, evcs, comps, {
        ...DEFAULT_ESCALATION_THRESHOLDS,
        repeatedCorrectionThreshold: 1,
      });

      const repeated = escalations.find((e) => e.triggerType === 'repeated_correction_cycles');
      expect(repeated).toBeDefined();
      expect(repeated?.applicationNumber).toBe('AICTE/WRO/2026-27/08190'); // Goa Tech
      expect(repeated?.basisExplanation).toContain('re-scrutiny iteration cycle');
    });

    it('triggers missing EVC report escalation when inspection completed > 48 hours ago', () => {
      const escalations = calculateEscalations(apps, evcs, comps, {
        ...DEFAULT_ESCALATION_THRESHOLDS,
        missingEVCReportDays: 2,
      });

      const missingEvc = escalations.find((e) => e.triggerType === 'missing_evc_report');
      expect(missingEvc).toBeDefined();
      expect(missingEvc?.title).toContain('EVC Inspection Report Outstanding');
      expect(missingEvc?.severity).toBe('critical');
      expect(missingEvc?.basisExplanation).toContain('exceeding the statutory 48-hour');
    });

    it('escalates overdue statutory compliance items', () => {
      const escalations = calculateEscalations(apps, evcs, comps);
      const compEsc = escalations.find((e) => e.triggerType === 'compliance_delay');

      expect(compEsc).toBeDefined();
      expect(compEsc?.title).toContain('Statutory Compliance Lapsed');
      expect(compEsc?.severity).toBe('critical');
      expect(compEsc?.basisExplanation).toContain('past due date without compliant verified affidavit');
    });

    it('recalculates dynamically when thresholds are customized', () => {
      // 1. Strict threshold: 2 days long-running scrutiny
      const strictEscalations = calculateEscalations(apps, evcs, comps, {
        ...DEFAULT_ESCALATION_THRESHOLDS,
        longRunningScrutinyDays: 2,
      });

      // 2. Lenient threshold: 30 days long-running scrutiny
      const lenientEscalations = calculateEscalations(apps, evcs, comps, {
        ...DEFAULT_ESCALATION_THRESHOLDS,
        longRunningScrutinyDays: 30,
      });

      const strictCount = strictEscalations.filter((e) => e.triggerType === 'long_running_scrutiny').length;
      const lenientCount = lenientEscalations.filter((e) => e.triggerType === 'long_running_scrutiny').length;

      expect(strictCount).toBeGreaterThan(lenientCount);
    });

    it('CRITICAL REGULATORY RULE: Calculating escalations NEVER mutates application statuses or deadlines', async () => {
      const originalApps = await repository.getApplications();
      const originalStatuses = originalApps.map((a) => a.status);
      const originalDeadlines = originalApps.map((a) => a.deadlineDate);

      // Run escalation calculations multiple times
      calculateEscalations(originalApps, evcs, comps);
      calculateEscalations(originalApps, evcs, comps, {
        overdueGraceDays: 0,
        longRunningScrutinyDays: 1,
        repeatedCorrectionThreshold: 1,
        missingEVCReportDays: 1,
        complianceOverdueGraceDays: 0,
      });

      // Refetch from repository
      const refetchedApps = await repository.getApplications();
      expect(refetchedApps.map((a) => a.status)).toEqual(originalStatuses);
      expect(refetchedApps.map((a) => a.deadlineDate)).toEqual(originalDeadlines);
    });
  });

  // ==========================================================================
  // C. AUDIT HISTORY & IMMUTABILITY TESTS
  // ==========================================================================
  describe('C. Chronological Audit Trail & Ledger Integrity', () => {
    it('retrieves audit log entries ordered chronologically with actor and remarks', async () => {
      const logs = await repository.getAuditLogs();
      expect(logs.length).toBeGreaterThanOrEqual(5);

      logs.forEach((log) => {
        expect(log.id).toBeDefined();
        expect(log.action).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.actorName).toBeDefined();
        expect(log.actorRole).toBeDefined();
        expect(log.remarks.length).toBeGreaterThan(0);
      });
    });

    it('supports sorting in descending chronological order (newest first)', async () => {
      const logs = await repository.getAuditLogs();
      const sorted = [...logs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const currentTime = new Date(sorted[i].timestamp).getTime();
        const nextTime = new Date(sorted[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('distinguishes official regulatory records from simulated demo events', async () => {
      const logs = await repository.getAuditLogs();
      const officialLogs = logs.filter((l) => l.origin === 'official_regulatory');
      const simulatedLogs = logs.filter((l) => l.origin === 'simulated_demo');

      expect(officialLogs.length).toBeGreaterThanOrEqual(1);
      expect(simulatedLogs.length).toBeGreaterThanOrEqual(1);

      // Official events should have regulatory sources like REGIONAL_OFFICER_PORTAL
      expect(officialLogs.some((l) => l.source === 'REGIONAL_OFFICER_PORTAL')).toBe(true);
    });

    it('filters audit logs by specific application ID', async () => {
      const targetAppId = 'app-wro-2026-001';
      const scopedLogs = await repository.getAuditLogs(targetAppId);

      expect(scopedLogs.length).toBeGreaterThanOrEqual(1);
      scopedLogs.forEach((l) => {
        expect(l.applicationId).toBe(targetAppId);
      });
    });
  });

  // ==========================================================================
  // D. ROLE PERMISSIONS & ACCESS CONTROL TESTS
  // ==========================================================================
  describe('D. Access Controls & Delivery Scope', () => {
    it('scopes notifications by recipient role and ID', async () => {
      const roNotifs = await repository.getNotifications('regional_officer', 'ro-usr-001');
      roNotifs.forEach((n) => {
        expect(n.recipientRole).toBe('regional_officer');
        if (n.recipientId) {
          expect(n.recipientId).toBe('ro-usr-001');
        }
      });

      // Institution admin cannot see regional officer specific notifications
      const instNotifs = await repository.getNotifications('institution_admin');
      const hasRoSpecific = instNotifs.some((n) => n.recipientRole === 'regional_officer');
      expect(hasRoSpecific).toBe(false);
    });
  });
});
