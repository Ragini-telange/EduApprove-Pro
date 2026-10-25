import { describe, it, expect, beforeEach } from 'vitest';
import { MockEduApproveRepository } from '../services/mockRepository';
import { canTransitionStatus } from '../types/workflowTransitions';
import {
  getDefaultChecklistForType,
  getChecklistTemplateSummary,
} from '../modules/regional-officer/utils/checklistTemplates';

describe('Phase 4 — Document Scrutiny, Deficiencies & Re-Scrutiny Workspace', () => {
  let repository: MockEduApproveRepository;

  beforeEach(() => {
    repository = new MockEduApproveRepository();
  });

  // A. Configurable Regulatory Checklist Tests
  describe('A. Configurable Regulatory Checklist by Application Type', () => {
    it('generates application-specific checklist tailored to application type', () => {
      // 1. New Institution has Land and NA conversion clauses
      const newInstChecklist = getDefaultChecklistForType('new_institution', 'app-test-new');
      const newCodes = newInstChecklist.map((c) => c.code);
      expect(newCodes).toContain('CHK-NEW-01'); // Land ownership
      expect(newCodes).toContain('CHK-NEW-02'); // NA Conversion
      expect(newCodes).toContain('CHK-NEW-06'); // Endowment FD

      // 2. Increase in Intake has Surplus Area and Lab Equipment clauses
      const intakeChecklist = getDefaultChecklistForType('increase_in_intake', 'app-test-intake');
      const intakeCodes = intakeChecklist.map((c) => c.code);
      expect(intakeCodes).toContain('CHK-INC-01'); // Surplus instructional area
      expect(intakeCodes).toContain('CHK-INC-03'); // Lab equipment & computing ratio

      // 3. Closure of Course has Resolution, Student Migration, Faculty Dues
      const closureChecklist = getDefaultChecklistForType('closure_of_course', 'app-test-close');
      const closeCodes = closureChecklist.map((c) => c.code);
      expect(closeCodes).toContain('CHK-CLS-01'); // Resolution for closure
      expect(closeCodes).toContain('CHK-CLS-03'); // Student protection & transfer plan
      expect(closeCodes).toContain('CHK-CLS-04'); // Faculty terminal dues affidavit
    });

    it('summarizes checklist categories per application type', () => {
      const summary = getChecklistTemplateSummary('extension_of_approval');
      expect(summary.totalItems).toBeGreaterThanOrEqual(4);
      expect(summary.categories).toContain('Statutory Affidavits');
      expect(summary.categories).toContain('Faculty & HR');
    });

    it('updates checklist item compliance status with reviewer attribution', async () => {
      const result = await repository.updateChecklistItem(
        'chk-001',
        'compliant',
        'Verified registered title deed and 7/12 extract on record.'
      );
      expect(result.success).toBe(true);
      expect(result.item.status).toBe('compliant');
      expect(result.item.officerNotes).toContain('Verified registered title deed');
      expect(result.item.reviewedBy).toBe('Ragini Telange');
      expect(result.item.reviewedAt).toBeDefined();
    });
  });

  // B. Document Review & Mandatory Remarks Validation
  describe('B. Document Review & Mandatory Remarks Enforcement', () => {
    it('rejects document scrutiny evaluation when remarks are omitted', async () => {
      const result = await repository.updateDocumentScrutiny({
        documentId: 'doc-001',
        applicationId: 'app-wro-2026-001',
        status: 'verified',
        observations: '   ', // Blank whitespace
        officerName: 'Ragini Telange',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Officer remarks and justification are mandatory');
    });

    it('requires deficiency reason when marking document as correction_required', async () => {
      const result = await repository.updateDocumentScrutiny({
        documentId: 'doc-004',
        applicationId: 'app-wro-2026-001',
        status: 'correction_required',
        observations: 'Deficiency found during review.',
        deficiencyReason: '', // missing specific reason
        deficiencyRemarks: '',
        officerName: 'Ragini Telange',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Deficiency reason and remedial remarks are required');
    });

    it('successfully saves document review with audit log and version retention', async () => {
      const result = await repository.updateDocumentScrutiny({
        documentId: 'doc-001',
        applicationId: 'app-wro-2026-001',
        status: 'verified',
        observations: 'Verified clear 7.5 acres title and urban zoning certificate.',
        officerName: 'Ragini Telange',
      });

      expect(result.success).toBe(true);
      expect(result.document.status).toBe('verified');
      expect(result.document.verifiedBy).toBe('Ragini Telange');
      expect(result.document.versions).toBeDefined();
      expect(result.document.versions!.length).toBeGreaterThan(0);

      // Verify audit log entry was generated
      const logs = await repository.getAuditLogs('app-wro-2026-001');
      const scrutinyLog = logs.find((l) => l.action === 'DOCUMENT_SCRUTINY_DECISION');
      expect(scrutinyLog).toBeDefined();
      expect(scrutinyLog?.actorName).toBe('Ragini Telange');
    });
  });

  // C. Deficiency Management & Draft Lifecycle
  describe('C. Deficiency Management & Draft Lifecycle', () => {
    it('saves a draft deficiency without incrementing application active deficiency count', async () => {
      const appBefore = await repository.getApplicationById('app-wro-2026-001');
      const initialCount = appBefore?.deficiencyCount || 0;

      const draftResult = await repository.saveDraftDeficiency({
        applicationId: 'app-wro-2026-001',
        category: 'Laboratories & Equipment',
        clauseReference: 'AICTE APH 2026-27 Clause 4.18',
        severity: 'minor',
        deficiencyTitle: 'Draft: CAD Software License Expiry Notice',
        detailedReason: 'CAD workstation license expires before term end.',
        remedialActionRequired: 'Provide license renewal receipt.',
        rectificationDeadline: '2026-11-05',
        officerName: 'Ragini Telange',
      });

      expect(draftResult.success).toBe(true);
      expect(draftResult.deficiency.isDraft).toBe(true);
      expect(draftResult.deficiency.status).toBe('draft');

      const appAfter = await repository.getApplicationById('app-wro-2026-001');
      expect(appAfter?.deficiencyCount).toBe(initialCount); // Unchanged for draft
    });

    it('deletes a draft deficiency cleanly', async () => {
      const draft = await repository.saveDraftDeficiency({
        applicationId: 'app-wro-2026-001',
        category: 'General',
        clauseReference: 'Clause 1.1',
        severity: 'minor',
        deficiencyTitle: 'Temporary Draft Item',
        detailedReason: 'Test reason',
        remedialActionRequired: 'Test action',
        rectificationDeadline: '2026-11-05',
        officerName: 'Ragini Telange',
      });

      const delResult = await repository.deleteDeficiency(draft.deficiency.id);
      expect(delResult.success).toBe(true);

      const allDefs = await repository.getDeficienciesByApplicationId('app-wro-2026-001');
      expect(allDefs.some((d) => d.id === draft.deficiency.id)).toBe(false);
    });
  });

  // D. Correction Request Generation & Notice Serving
  describe('D. Correction Request Notice Generation', () => {
    it('promotes drafts, transitions to correction_required, and issues formal CorrectionNotice', async () => {
      const result = await repository.submitCorrectionRequest(
        'app-wro-2026-001',
        'ro-usr-001',
        'Ragini Telange',
        'Deficiencies in fire safety NOC and municipal permissions noted. Rectify within 7 days.',
        '2026-10-28'
      );

      expect(result.success).toBe(true);
      expect(result.notice).toBeDefined();
      expect(result.notice.noticeNumber).toContain('AICTE/CORR/WRO');
      expect(result.notice.rectificationDeadline).toBe('2026-10-28');
      expect(result.notice.deficiencies.length).toBeGreaterThan(0);
      expect(result.notice.statutoryInstructions).toContain('rectify each of the itemized deficiencies');

      // Verify application transitioned to correction_required
      const updatedApp = await repository.getApplicationById('app-wro-2026-001');
      expect(updatedApp?.status).toBe('correction_required');
      expect(updatedApp?.remarksHistory[0].remarks).toContain('Official Deficiency Memo');
    });

    it('rejects correction request if application is in illegal status for correction', async () => {
      // app-wro-2026-002 is in 'submitted' (needs to be 'under_scrutiny' first)
      const result = await repository.submitCorrectionRequest(
        'app-wro-2026-002',
        'ro-usr-001',
        'Ragini Telange',
        'Premature request',
        '2026-10-28'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot issue correction request from workflow status');
    });
  });

  // E. Re-Scrutiny & Document Version Diffing
  describe('E. Re-Scrutiny & Document Diffing', () => {
    it('identifies updated document versions in resubmitted application', async () => {
      // app-wro-2026-004 is a resubmitted application with doc-005 (v2)
      const docs = await repository.getDocumentsByApplicationId('app-wro-2026-004');
      const updatedDoc = docs.find((d) => d.id === 'doc-005');

      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.version).toBe(2);
      expect(updatedDoc?.isUpdatedInResubmission).toBe(true);
      expect(updatedDoc?.previousVersionRemarks).toBeDefined();
      expect(updatedDoc?.versions).toBeDefined();
      expect(updatedDoc?.versions?.length).toBe(2);

      // Verify v1 retains earlier scrutiny record
      const v1 = updatedDoc?.versions?.find((v) => v.version === 1);
      expect(v1?.status).toBe('correction_required');
      expect(v1?.observations).toContain('Affiliation letter only covers existing');
    });

    it('records deficiency resolution in re-scrutiny with mandatory remarks', async () => {
      const defs = await repository.getDeficienciesByApplicationId('app-wro-2026-004');
      const targetDef = defs[0];
      expect(targetDef).toBeDefined();

      // Missing remarks should fail
      const failResult = await repository.updateDeficiencyResolution(
        targetDef.id,
        'resolved',
        '  ',
        'Ragini Telange'
      );
      expect(failResult.success).toBe(false);
      expect(failResult.error).toContain('Officer remarks are mandatory');

      // Valid resolution succeeds
      const passResult = await repository.updateDeficiencyResolution(
        targetDef.id,
        'resolved',
        'Verified Goa University notification GU/Acad/Affil/2026/1429 sanctioning 60 MCA seats.',
        'Ragini Telange'
      );
      expect(passResult.success).toBe(true);
      expect(passResult.deficiency.isResolved).toBe(true);
      expect(passResult.deficiency.resolutionStatus).toBe('resolved');
      expect(passResult.deficiency.resolvedAt).toBeDefined();
    });
  });

  // F. Workflow Integrity & Error Handling
  describe('F. Workflow Integrity & Error Handling', () => {
    it('strictly prohibits arbitrary transition from submitted to completed or correction_required', () => {
      const directComplete = canTransitionStatus('submitted', 'completed', 'regional_officer');
      expect(directComplete.allowed).toBe(false);

      const directCorrection = canTransitionStatus('submitted', 'correction_required', 'regional_officer');
      expect(directCorrection.allowed).toBe(false);
    });

    it('handles non-existent document or application queries gracefully', async () => {
      const fakeApp = await repository.getApplicationById('non-existent-app-999');
      expect(fakeApp).toBeNull();

      const fakeDocRes = await repository.updateDocumentScrutiny({
        documentId: 'fake-doc-999',
        applicationId: 'fake-app-999',
        status: 'verified',
        observations: 'Test',
        officerName: 'Ragini Telange',
      });
      expect(fakeDocRes.success).toBe(false);
      expect(fakeDocRes.error).toContain('Document not found');
    });
  });
});
