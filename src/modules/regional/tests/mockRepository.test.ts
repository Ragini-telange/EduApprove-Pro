import { describe, it, expect, beforeEach } from 'vitest';
import { MockEduApproveRepository } from '../services/mockRepository';

describe('Data Access Layer (Mock Repository Resilience)', () => {
  let repo: MockEduApproveRepository;

  beforeEach(() => {
    repo = new MockEduApproveRepository();
  });

  it('retrieves applications and reports mock fallback health', async () => {
    const status = repo.getServiceStatus();
    expect(status.connectionStatus).toBe('mock_fallback');
    expect(status.isLiveSupabase).toBe(false);

    const apps = await repo.getApplications();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0]).toHaveProperty('applicationNumber');
  });

  it('filters applications by status accurately', async () => {
    const submittedApps = await repo.getApplications({ status: 'submitted' });
    expect(submittedApps.every((a) => a.status === 'submitted')).toBe(true);
  });

  it('records audit log entries upon document scrutiny decision', async () => {
    const apps = await repo.getApplications();
    const app = apps[0];
    const docs = await repo.getDocumentsByApplicationId(app.id);
    expect(docs.length).toBeGreaterThan(0);

    const targetDoc = docs[0];
    const updateRes = await repo.updateDocumentScrutiny({
      documentId: targetDoc.id,
      applicationId: app.id,
      status: 'verified',
      observations: 'Verified clear title on 7/12 extract.',
      officerName: 'Ragini Telange',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.document.status).toBe('verified');

    const logs = await repo.getAuditLogs(app.id);
    expect(logs.some((l) => l.action === 'DOCUMENT_SCRUTINY_DECISION')).toBe(true);
  });

  it('records deficiencies and updates application count', async () => {
    const apps = await repo.getApplications();
    const app = apps[0];
    const initialCount = app.deficiencyCount;

    const defRes = await repo.createDeficiency({
      applicationId: app.id,
      category: 'Safety & Compliance',
      clauseReference: 'AICTE APH 2026-27 Clause 4.12',
      severity: 'major',
      deficiencyTitle: 'Fire NOC Overdue',
      detailedReason: 'Fire NOC validity expired.',
      remedialActionRequired: 'Upload valid renewal receipt.',
      rectificationDeadline: '2026-10-30',
      officerName: 'Ragini Telange',
    });

    expect(defRes.success).toBe(true);
    const updatedApp = await repo.getApplicationById(app.id);
    expect(updatedApp?.deficiencyCount).toBe(initialCount + 1);
  });
});
