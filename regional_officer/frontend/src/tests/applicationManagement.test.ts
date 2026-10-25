import { describe, it, expect } from 'vitest';
import { getRegionalOfficerService } from '../modules/regional-officer/services';
import { Application } from '../modules/regional-officer/types';

describe('Phase 3 — Application Management (Queue, Filtering, RBAC & Detail)', () => {
  const service = getRegionalOfficerService();

  it('searches applications by application number and institution name accurately', async () => {
    // Search by application number
    const byNumber = await service.getApplications({ search: '08492' });
    expect(byNumber.length).toBe(1);
    expect(byNumber[0].applicationNumber).toContain('08492');

    // Search by institution name (case-insensitive substring)
    const byName = await service.getApplications({ search: 'Sahyadri' });
    expect(byName.length).toBe(1);
    expect(byName[0].institution.name).toContain('Sahyadri');

    // Search by city
    const byCity = await service.getApplications({ search: 'Nagpur' });
    expect(byCity.length).toBe(1);
    expect(byCity[0].institution.city).toBe('Nagpur');
  });

  it('filters applications by status, application type, urgency and date range', async () => {
    // Status filter
    const underScrutiny = await service.getApplications({ status: 'under_scrutiny' });
    expect(underScrutiny.every((a: Application) => a.status === 'under_scrutiny')).toBe(true);

    // Type filter
    const newInst = await service.getApplications({ type: 'new_institution' });
    expect(newInst.every((a: Application) => a.type === 'new_institution')).toBe(true);

    // Urgency filter
    const critical = await service.getApplications({ priority: 'critical' });
    expect(critical.every((a: Application) => a.priority === 'critical')).toBe(true);

    // Date range filter (submitted after 2026-10-01)
    const recent = await service.getApplications({ dateFrom: '2026-10-01' });
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.every((a: Application) => new Date(a.submittedAt).getTime() >= new Date('2026-10-01').getTime())).toBe(true);
  });

  it('sorts applications accurately by deadline ascending and submission descending', async () => {
    // 1. Deadline ascending (nearest deadline first)
    const sortedAsc = await service.getApplications({ sortBy: 'deadline_asc' });
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      const d1 = new Date(sortedAsc[i].deadlineDate).getTime();
      const d2 = new Date(sortedAsc[i + 1].deadlineDate).getTime();
      expect(d1).toBeLessThanOrEqual(d2);
    }

    // 2. Submission descending (newest submissions first)
    const sortedSub = await service.getApplications({ sortBy: 'submitted_desc' });
    for (let i = 0; i < sortedSub.length - 1; i++) {
      const s1 = new Date(sortedSub[i].submittedAt).getTime();
      const s2 = new Date(sortedSub[i + 1].submittedAt).getTime();
      expect(s1).toBeGreaterThanOrEqual(s2);
    }
  });

  it('paginates application records into chunks of requested pageSize', async () => {
    const page1 = await service.getApplications({ page: 1, pageSize: 2 });
    expect(page1.length).toBe(2);

    const page2 = await service.getApplications({ page: 2, pageSize: 2 });
    expect(page2.length).toBe(2);

    // Verify disjoint records
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it('enforces Regional Officer jurisdiction access control restrictions', async () => {
    // Authorized jurisdiction (Maharashtra & Goa)
    const authorized = await service.getApplications({
      officerJurisdictions: ['Maharashtra', 'Goa'],
    });
    expect(authorized.length).toBeGreaterThan(0);
    expect(authorized.every((a: Application) => ['Maharashtra', 'Goa'].includes(a.institution.state))).toBe(true);

    // Restricted jurisdiction (officer only authorized for Karnataka)
    const restricted = await service.getApplications({
      officerJurisdictions: ['Karnataka'],
    });
    expect(restricted.length).toBe(0);
  });

  it('handles valid vs invalid application IDs with safe null return and error guards', async () => {
    // Valid ID
    const valid = await service.getApplicationById('app-wro-2026-001');
    expect(valid).not.toBeNull();
    expect(valid?.applicationNumber).toBe('AICTE/WRO/2026-27/08492');

    // Invalid ID
    const invalid = await service.getApplicationById('non-existent-app-999');
    expect(invalid).toBeNull();
  });
});
