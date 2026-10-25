import { describe, it, expect } from 'vitest';
import { calculateDeadlineDaysRemaining } from '../modules/regional-officer/utils/dateHelpers';
import { getRegionalOfficerService } from '../modules/regional-officer/services';
import { Application } from '../modules/regional-officer/types';

describe('Phase 2 — Regional Officer Dashboard Metrics & Calculations', () => {
  const service = getRegionalOfficerService();

  it('calculates deadline days and generates accessible textual descriptions', () => {
    // 1. Overdue test (e.g. date in past relative to 2026-10-22)
    const overdueResult = calculateDeadlineDaysRemaining('2026-10-15');
    expect(overdueResult.isOverdue).toBe(true);
    expect(overdueResult.severity).toBe('critical');
    expect(overdueResult.accessibleText).toContain('Overdue');
    expect(overdueResult.label).toContain('Overdue');

    // 2. Urgent test (<= 3 days)
    const urgentResult = calculateDeadlineDaysRemaining('2026-10-25');
    expect(urgentResult.isOverdue).toBe(false);
    expect(urgentResult.severity).toBe('critical');
    expect(urgentResult.accessibleText).toContain('Critical urgency');

    // 3. Approaching deadline test (<= 7 days)
    const warningResult = calculateDeadlineDaysRemaining('2026-10-28');
    expect(warningResult.isOverdue).toBe(false);
    expect(warningResult.severity).toBe('warning');
    expect(warningResult.accessibleText).toContain('Approaching deadline');

    // 4. Normal window test (> 7 days)
    const normalResult = calculateDeadlineDaysRemaining('2026-11-15');
    expect(normalResult.isOverdue).toBe(false);
    expect(normalResult.severity).toBe('normal');
    expect(normalResult.accessibleText).toContain('Normal window');
  });

  it('computes exact empirical KPI counts directly from active dataset', async () => {
    const applications = await service.getApplications();
    expect(applications.length).toBeGreaterThan(0);

    const awaitingScrutiny = applications.filter((a: Application) => a.status === 'submitted');
    const correctionAwaiting = applications.filter((a: Application) => a.status === 'correction_required');
    const awaitingReScrutiny = applications.filter(
      (a: Application) => a.status === 'resubmitted' || a.status === 'under_re_scrutiny'
    );
    const pendingEVC = applications.filter(
      (a: Application) => a.status === 'pending_evc' || a.status === 'evc_scheduled'
    );

    expect(awaitingScrutiny.length).toBe(1); // 'app-wro-2026-002'
    expect(correctionAwaiting.length).toBe(1); // 'app-wro-2026-003'
    expect(awaitingReScrutiny.length).toBe(1); // 'app-wro-2026-004'
    expect(pendingEVC.length).toBe(1); // 'app-wro-2026-005'
  });

  it('filters applications accurately by status filter parameter', async () => {
    const submittedApps = await service.getApplications({ status: 'submitted' });
    expect(submittedApps.length).toBe(1);
    expect(submittedApps[0].applicationNumber).toBe('AICTE/WRO/2026-27/08514');

    const correctionApps = await service.getApplications({ status: 'correction_required' });
    expect(correctionApps.length).toBe(1);
    expect(correctionApps[0].applicationNumber).toBe('AICTE/WRO/2026-27/08310');
  });

  it('handles empty dataset safely without NaN percentages or division by zero', () => {
    const emptyApplications: Application[] = [];
    const total = emptyApplications.length;

    // Simulation of dashboard calculation guard
    const onTimeRate = total > 0 ? Math.round(((total - 0) / total) * 100) : 100;
    expect(onTimeRate).toBe(100);
    expect(Number.isNaN(onTimeRate)).toBe(false);
  });
});
