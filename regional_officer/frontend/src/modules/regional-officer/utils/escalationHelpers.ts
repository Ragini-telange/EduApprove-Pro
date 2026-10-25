import { Application, EVCRecord, ComplianceItem, EscalationItem } from '../../../types';

export interface EscalationThresholds {
  overdueGraceDays: number; // default: 0
  longRunningScrutinyDays: number; // default: 5
  repeatedCorrectionThreshold: number; // default: 2
  missingEVCReportDays: number; // default: 2 (48 hours)
  complianceOverdueGraceDays: number; // default: 0
}

export const DEFAULT_ESCALATION_THRESHOLDS: EscalationThresholds = {
  overdueGraceDays: 0,
  longRunningScrutinyDays: 5,
  repeatedCorrectionThreshold: 1, // Flag cases with 1 or more re-scrutiny cycles
  missingEVCReportDays: 2,
  complianceOverdueGraceDays: 0,
};

const EVALUATION_DATE = '2026-10-22';

/**
 * Calculates actionable escalations across applications, EVC visits, and compliance items.
 *
 * CRITICAL REGULATORY RULE:
 * Escalation indicators are advisory and operational; they NEVER automatically
 * reject an application or mutate official regulatory decisions or deadlines.
 */
export function calculateEscalations(
  applications: Application[],
  evcRecords: EVCRecord[],
  complianceItems: ComplianceItem[],
  thresholds: EscalationThresholds = DEFAULT_ESCALATION_THRESHOLDS
): EscalationItem[] {
  const escalations: EscalationItem[] = [];
  const todayMs = new Date(EVALUATION_DATE).getTime();

  // 1. Overdue Deadlines & Long-Running Scrutiny & Repeated Corrections
  applications.forEach((app) => {
    // Exclude terminal states
    if (app.status === 'completed' || app.status === 'rejected' || app.status === 'withdrawn') {
      return;
    }

    // A. Overdue Scrutiny Deadline
    if (app.deadlineDate) {
      const deadlineMs = new Date(app.deadlineDate).getTime();
      const diffDays = Math.floor((todayMs - deadlineMs) / (1000 * 60 * 60 * 24));
      if (diffDays > thresholds.overdueGraceDays) {
        escalations.push({
          id: `esc-due-${app.id}`,
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          institutionName: app.institution.name,
          triggerType: 'overdue_deadline',
          title: `Statutory Scrutiny Deadline Lapsed`,
          description: `Application ${app.applicationNumber} has lapsed past statutory scrutiny deadline without determination.`,
          basisExplanation: `Statutory cutoff was ${app.deadlineDate}. Exactly ${diffDays} calendar day${diffDays === 1 ? '' : 's'} elapsed past official cutoff without final regional officer action.`,
          severity: 'critical',
          thresholdDaysApplied: thresholds.overdueGraceDays,
          elapsedDays: diffDays,
          deadlineDate: app.deadlineDate,
          actionUrl: `/regional-officer/applications/${app.id}`,
        });
      }
    }

    // B. Long-Running Scrutiny
    if (app.status === 'under_scrutiny' || app.status === 'under_re_scrutiny') {
      const refDateMs = new Date(app.submittedAt).getTime();
      const scrutinyDays = Math.floor((todayMs - refDateMs) / (1000 * 60 * 60 * 24));
      if (scrutinyDays >= thresholds.longRunningScrutinyDays) {
        escalations.push({
          id: `esc-long-${app.id}`,
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          institutionName: app.institution.name,
          triggerType: 'long_running_scrutiny',
          title: `Long-Running Scrutiny Review`,
          description: `Application is in '${app.status.replace(/_/g, ' ')}' for ${scrutinyDays} days.`,
          basisExplanation: `Scrutiny commenced on ${app.submittedAt.split('T')[0]}. Elapsed ${scrutinyDays} days in regional officer queue, exceeding standard ${thresholds.longRunningScrutinyDays}-day evaluation target.`,
          severity: scrutinyDays >= thresholds.longRunningScrutinyDays * 2 ? 'urgent' : 'warning',
          thresholdDaysApplied: thresholds.longRunningScrutinyDays,
          elapsedDays: scrutinyDays,
          deadlineDate: app.deadlineDate,
          actionUrl: `/regional-officer/scrutiny-workspace/${app.id}`,
        });
      }
    }

    // C. Repeated Correction Cycles
    if (app.reScrutinyCount && app.reScrutinyCount >= thresholds.repeatedCorrectionThreshold) {
      escalations.push({
        id: `esc-rep-${app.id}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionName: app.institution.name,
        triggerType: 'repeated_correction_cycles',
        title: `Repeated Correction Iterations (${app.reScrutinyCount} Cycles)`,
        description: `Institution has resubmitted corrected dossiers ${app.reScrutinyCount} times without full compliance.`,
        basisExplanation: `Case has undergone ${app.reScrutinyCount} re-scrutiny iteration cycle${app.reScrutinyCount === 1 ? '' : 's'}, exceeding threshold of ${thresholds.repeatedCorrectionThreshold}. Recurring deficiencies require senior authority appraisal.`,
        severity: app.reScrutinyCount >= 2 ? 'critical' : 'urgent',
        thresholdDaysApplied: thresholds.repeatedCorrectionThreshold,
        elapsedDays: app.reScrutinyCount,
        actionUrl: `/regional-officer/scrutiny-workspace/${app.id}`,
      });
    }
  });

  // 2. Missing EVC Reports
  evcRecords.forEach((evc) => {
    if (
      (evc.status === 'visit_completed' || evc.status === 'completed') &&
      !evc.reportSubmittedAt &&
      evc.confirmedDate
    ) {
      const visitDateMs = new Date(evc.confirmedDate).getTime();
      const elapsedDays = Math.floor((todayMs - visitDateMs) / (1000 * 60 * 60 * 24));
      if (elapsedDays >= thresholds.missingEVCReportDays) {
        escalations.push({
          id: `esc-evc-${evc.id}`,
          applicationId: evc.applicationId,
          applicationNumber: evc.applicationNumber,
          institutionName: evc.institutionName,
          triggerType: 'missing_evc_report',
          title: `EVC Inspection Report Outstanding`,
          description: `Physical visit completed on ${evc.confirmedDate} but committee report has not been submitted.`,
          basisExplanation: `Visit completed on ${evc.confirmedDate}. Report has been outstanding for ${elapsedDays} days, exceeding the statutory 48-hour (${thresholds.missingEVCReportDays}-day) reporting deadline.`,
          severity: 'critical',
          thresholdDaysApplied: thresholds.missingEVCReportDays,
          elapsedDays,
          actionUrl: `/regional-officer/evc`,
        });
      }
    }
  });

  // 3. Compliance Delays
  complianceItems.forEach((comp) => {
    if (comp.status === 'overdue' || comp.escalationLevel === 'critical_overdue') {
      const dueDateMs = new Date(comp.dueDate).getTime();
      const elapsedDays = Math.max(1, Math.floor((todayMs - dueDateMs) / (1000 * 60 * 60 * 24)));
      if (elapsedDays > thresholds.complianceOverdueGraceDays) {
        escalations.push({
          id: `esc-comp-${comp.id}`,
          applicationId: comp.applicationId || '',
          applicationNumber: comp.institutionName,
          institutionName: comp.institutionName,
          triggerType: 'compliance_delay',
          title: `Statutory Compliance Lapsed: ${comp.title}`,
          description: `Mandatory undertaking for clause ${comp.clause} is overdue by ${elapsedDays} days.`,
          basisExplanation: `Compliance requirement due on ${comp.dueDate}. Exactly ${elapsedDays} day${elapsedDays === 1 ? '' : 's'} elapsed past due date without compliant verified affidavit.`,
          severity: comp.escalationLevel === 'critical_overdue' ? 'critical' : 'urgent',
          thresholdDaysApplied: thresholds.complianceOverdueGraceDays,
          elapsedDays,
          deadlineDate: comp.dueDate,
          actionUrl: `/regional-officer/compliance`,
        });
      }
    }
  });

  // Sort critical first, then urgent, then warning
  const severityOrder: Record<string, number> = { critical: 1, urgent: 2, warning: 3 };
  return escalations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
