import { describe, it, expect, beforeEach } from 'vitest';
import { MockEduApproveRepository } from '../services/mockRepository';
import { UserRole } from '../types';

describe('Phase 7 — AI-Assisted Document Intelligence & Scrutiny Copilot', () => {
  let repository: MockEduApproveRepository;

  beforeEach(() => {
    repository = new MockEduApproveRepository();
  });

  // 1. OCR Engine Status
  describe('1. Truthful OCR Engine Status Detection', () => {
    it('returns factual status of the host OCR engine without pretending', async () => {
      const status = await repository.getOcrEngineStatus();
      expect(status).toBeDefined();
      expect(status.statusCode).toBeDefined();
      expect(['available', 'unavailable']).toContain(status.statusCode);
      expect(status.setupInstructions).toContain('Tesseract');
    });
  });

  // 2. Document Access Control & Unsupported File Types
  describe('2. Document Access Control & Format Validation', () => {
    it('prevents unauthorized roles from performing regulatory document intelligence', async () => {
      const result = await repository.analyzeDocumentWithAI(
        'app-wro-2026-001',
        'doc-001',
        'Institution Principal',
        'institution_admin' as UserRole
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(result.error).toContain('institution_admin');
    });

    it('rejects unsupported document file types with statutory message', async () => {
      // Modify a document's file name to unsupported extension
      const docs = await repository.getDocumentsByApplicationId('app-wro-2026-001');
      const testDoc = docs[0];
      const origFileName = testDoc.fileName;
      testDoc.fileName = 'system_payload.exe';

      const result = await repository.analyzeDocumentWithAI(
        'app-wro-2026-001',
        testDoc.id,
        'Ragini Telange',
        'regional_officer'
      );

      // Restore
      testDoc.fileName = origFileName;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported document format');
      expect(result.error).toContain('.exe');
    });
  });

  // 3. Document Analysis & Structured Findings
  describe('3. Document Analysis & Findings Generation', () => {
    it('successfully analyzes supported document and returns structured findings', async () => {
      const result = await repository.analyzeDocumentWithAI(
        'app-wro-2026-001',
        'doc-003', // Fire NOC
        'Ragini Telange',
        'regional_officer'
      );

      expect(result.success).toBe(true);
      expect(result.result.documentId).toBe('doc-003');
      expect(result.result.findings.length).toBeGreaterThanOrEqual(1);

      const finding = result.result.findings[0];
      expect(finding.title).toBeDefined();
      expect(finding.summary).toBeDefined();
      expect(finding.isMachineGenerated).toBe(true);
      expect(finding.relevantChecklistCode).toBeDefined();
    });

    it('identifies uncertain / low-confidence findings when document scan is unreadable or blurry', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const uncertainFinding = suggestions.find((s) => s.type === 'unreadable_scan' || (s.confidenceScore && s.confidenceScore < 0.60));

      expect(uncertainFinding).toBeDefined();
      expect(uncertainFinding?.confidenceScore).toBeLessThan(0.60);
      expect(uncertainFinding?.confidenceLabel).toContain('Uncertain');
    });

    it('supplies page reference only when actually provided by extraction', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const withLocation = suggestions.filter((s) => s.pageReference !== undefined);
      expect(withLocation.length).toBeGreaterThan(0);
      withLocation.forEach((item) => {
        expect(item.pageReference).toMatch(/Page \d/);
      });
    });
  });

  // 4. Officer Review Lifecycle: Confirm, Edit, Dismiss
  describe('4. Finding Review Lifecycle (Confirm, Edit, Dismiss)', () => {
    it('officer confirms finding and updates audit trail', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const target = suggestions.find((s) => s.reviewState === 'pending_review' || s.status === 'pending_review') || suggestions[0];

      const res = await repository.updateAISuggestionReview(target.id, {
        status: 'confirmed',
        officerName: 'Ragini Telange',
        officerFeedback: 'Confirmed discrepancy against original Municipal Fire NOC.',
      });

      expect(res.success).toBe(true);
      expect(res.suggestion.reviewState).toBe('confirmed');
      expect(res.suggestion.reviewedBy).toBe('Ragini Telange');

      // Verify audit log
      const logs = await repository.getAuditLogs('app-wro-2026-001');
      const lastLog = logs[0];
      expect(lastLog.action).toBe('AI_FINDING_REVIEWED');
      expect(lastLog.newState).toBe('confirmed');
    });

    it('officer edits finding title and explanation before confirming', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const target = suggestions[0];

      const res = await repository.updateAISuggestionReview(target.id, {
        status: 'edited',
        editedTitle: 'Refined: Lack of 2026-27 Fire Renewal Certificate',
        editedSummary: 'The certificate explicitly lapses in October 2026, creating statutory non-compliance.',
        officerFeedback: 'Customized based on Zonal Municipal Regulations.',
        officerName: 'Ragini Telange',
      });

      expect(res.success).toBe(true);
      expect(res.suggestion.reviewState).toBe('edited');
      expect(res.suggestion.editedTitle).toContain('Refined');
      expect(res.suggestion.editedSummary).toContain('statutory non-compliance');
    });

    it('officer dismisses finding with clarification remarks', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const target = suggestions[1];

      const res = await repository.updateAISuggestionReview(target.id, {
        status: 'dismissed',
        officerFeedback: 'Resolved after cross-verifying affiliated university endorsement letter.',
        officerName: 'Ragini Telange',
      });

      expect(res.success).toBe(true);
      expect(res.suggestion.reviewState).toBe('dismissed');
      expect(res.suggestion.officerFeedback).toContain('Resolved after');
    });
  });

  // 5. Converting Finding to Draft Deficiency & Statutory Workflow Safeguards
  describe('5. Deficiency Conversion & Statutory Workflow Safeguards', () => {
    it('converts confirmed finding to an official draft deficiency in Deficiency Studio', async () => {
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      const target = suggestions[0];

      const res = await repository.convertFindingToDraftDeficiency(
        target.id,
        'Ragini Telange',
        'AICTE APH 2026-27 Clause 4.12',
        'major',
        '2026-11-05'
      );

      expect(res.success).toBe(true);
      expect(res.deficiency.id).toBeDefined();
      expect(res.deficiency.category).toBe('Document Intelligence & Scrutiny');
      expect(res.deficiency.clauseReference).toBe('AICTE APH 2026-27 Clause 4.12');
      expect(res.deficiency.severity).toBe('major');
      expect(res.deficiency.isDraft).toBe(true);
      expect(res.deficiency.status).toBe('draft');

      // Verify it appears in repository deficiencies list
      const defs = await repository.getDeficienciesByApplicationId('app-wro-2026-001');
      const created = defs.find((d) => d.id === res.deficiency.id);
      expect(created).toBeDefined();
    });

    it('CRITICAL REGULATORY RULE: AI findings and draft conversions NEVER alter official application status', async () => {
      const appBefore = await repository.getApplicationById('app-wro-2026-001');
      const originalStatus = appBefore?.status;

      // 1. Analyze document
      await repository.analyzeDocumentWithAI(
        'app-wro-2026-001',
        'doc-003',
        'Ragini Telange',
        'regional_officer'
      );

      const appAfterAnalysis = await repository.getApplicationById('app-wro-2026-001');
      expect(appAfterAnalysis?.status).toBe(originalStatus);

      // 2. Convert finding to deficiency
      const suggestions = await repository.getAISuggestionsByApplicationId('app-wro-2026-001');
      await repository.convertFindingToDraftDeficiency(
        suggestions[0].id,
        'Ragini Telange',
        'Clause 4.12',
        'fatal',
        '2026-11-05'
      );

      const appAfterConversion = await repository.getApplicationById('app-wro-2026-001');
      expect(appAfterConversion?.status).toBe(originalStatus);
    });
  });
});
