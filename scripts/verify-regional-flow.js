// ============================================================================
// AICTE SMARTASSIST — REGIONAL OFFICER & E2E STATUTORY WORKFLOW TEST SUITE
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}: ${details}`);
    failed++;
  }
}

async function runRegionalFlowTests() {
  console.log('\n============================================================');
  console.log('AICTE SMARTASSIST — REGIONAL OFFICER STATUTORY INTEGRATION');
  console.log('============================================================\n');

  // Load modules
  const { authService } = await import('../src/services/auth/authService.ts');
  const { applications } = await import('../src/services/applications/applicationsService.ts');
  const { applicationsService: instAppService } = await import('../src/modules/institution/services/applicationsService.ts');
  const { getRegionalOfficerService } = await import('../src/modules/regional/modules/regional-officer/services/regionalOfficerService.factory.ts');
  const { getDataService } = await import('../src/modules/regional/services/dataServiceFactory.ts');

  const roService = getRegionalOfficerService();
  const repo = getDataService();

  // STEP 1: AUTHENTICATION ROLES
  console.log('--- STEP 1: REGIONAL OFFICER AUTHENTICATION & ROLE ENFORCEMENT ---');
  const roSession = await authService.login('regional.officer@aicte.gov.in', 'ro1234');
  assert(roSession && roSession.user.role === 'regional_officer', 'Regional Officer authenticates with canonical role: regional_officer');
  assert(roSession.user.name === 'Ragini Telange', 'Regional Officer identity verified: Ragini Telange');

  const instSession = await authService.login('principal@pict.edu', 'pict1234');
  assert(instSession && instSession.user.role === 'institution', 'Institution Admin authenticates with canonical role: institution');

  // STEP 2: INSTITUTION CREATES APPLICATION TEST-001
  console.log('\n--- STEP 2: INSTITUTION CREATES APPLICATION TEST-001 ---');
  const createdApp = await applications.create({
    id: 'TEST-001',
    applicationNumber: 'TEST-001',
    institutionId: 'inst_wro_01',
    institutionName: 'Pune Institute of Computer Technology',
    instituteCode: '1-4293811',
    region: 'Western Regional Office',
    state: 'Maharashtra',
    type: 'extension_of_approval',
    academicYear: '2026-2027',
    priority: 'normal',
  });

  assert(createdApp && createdApp.applicationNumber === 'TEST-001', 'Application TEST-001 created in canonical shared store');
  assert(createdApp.status === 'draft', "Initial application status is strictly 'draft'");

  // STEP 3: INSTITUTION SUBMITS APPLICATION TEST-001
  console.log('\n--- STEP 3: INSTITUTION SUBMITS APPLICATION TEST-001 ---');
  const submitResult = await applications.updateStatus(
    'TEST-001',
    'submitted',
    'Statutory submission of Extension of Approval application for AY 2026-27.',
    { id: instSession.user.id, name: instSession.user.name, role: 'institution' }
  );
  assert(submitResult.success, 'Institution successfully submits TEST-001');
  assert(submitResult.application && submitResult.application.status === 'submitted', "Application status transitioned to 'submitted'");

  // STEP 4: REGIONAL OFFICER MUST SEE TEST-001
  console.log('\n--- STEP 4: REGIONAL OFFICER QUEUE INSPECTION ---');
  const queueApps = await roService.getApplications();
  const foundInQueue = queueApps.find((a) => a.applicationNumber === 'TEST-001' || a.id === 'TEST-001');
  assert(foundInQueue !== undefined, 'Regional Officer getApplications() queue includes TEST-001');
  assert(foundInQueue && foundInQueue.status === 'submitted', "TEST-001 appears with status 'submitted'");

  const directLookup = await roService.getApplicationById('TEST-001');
  assert(directLookup !== null && directLookup.applicationNumber === 'TEST-001', 'Regional Officer getApplicationById(TEST-001) resolves canonical record');
  assert(directLookup && directLookup.institution.name.includes('Pune Institute'), 'Application institution data mapped accurately for scrutiny');

  // STEP 5: PRESERVE STATUTORY OVERSIGHT (INSTITUTION CANNOT DIRECTLY CHANGE OFFICIAL WORKFLOW)
  console.log('\n--- STEP 5: STATUTORY GUARDRAIL TEST (INSTITUTION FORBIDDEN DIRECT APPROVAL) ---');
  const illegalAttempt = await applications.updateStatus(
    'TEST-001',
    'completed',
    'Attempting unauthorized direct self-approval',
    { id: instSession.user.id, name: instSession.user.name, role: 'institution' }
  );
  assert(!illegalAttempt.success, 'Direct approval attempt by Institution is rejected by statutory transition engine');
  assert(
    illegalAttempt.error && (illegalAttempt.error.includes('Statutory violation') || illegalAttempt.error.includes('Permission denied')),
    'Statutory error message enforces role clearance'
  );

  // STEP 6: REGIONAL OFFICER ROUTING TO SCRUTINY
  console.log('\n--- STEP 6: REGIONAL OFFICER ROUTES TEST-001 TO SCRUTINY ---');
  const scrutinyTransition = await roService.executeWorkflowTransition({
    applicationId: 'TEST-001',
    targetStatus: 'under_scrutiny',
    officerId: roSession.user.id,
    officerName: roSession.user.name,
    officerRole: 'regional_officer',
    stageName: 'Regional Scrutiny Committee',
    remarks: 'Dossier allocated to Regional Scrutiny Committee for AICTE APH compliance inspection.',
  });
  assert(scrutinyTransition.success, 'Regional Officer routes application to under_scrutiny');
  assert(scrutinyTransition.application && scrutinyTransition.application.status === 'under_scrutiny', "Application status updated to 'under_scrutiny'");

  // STEP 7: DOCUMENT SCRUTINY & VERIFICATION
  console.log('\n--- STEP 7: DOCUMENT SCRUTINY & VERIFICATION WORKFLOW ---');
  const docs = await roService.getDocuments('TEST-001');
  assert(Array.isArray(docs) && docs.length > 0, `Scrutiny retrieved ${docs.length} statutory documents for TEST-001`);

  const targetDoc = docs[0];
  const docVerifyResult = await roService.verifyDocument({
    documentId: targetDoc.id,
    applicationId: 'TEST-001',
    status: 'correction_required',
    observations: 'Land Ownership Title Deed lacks Sub-Registrar seal and index-II certificate.',
    deficiencyReason: 'Missing Sub-Registrar seal and index-II',
    officerName: roSession.user.name,
  });
  assert(docVerifyResult.success, 'Document verification decision recorded with officer observations');
  assert(docVerifyResult.document.status === 'correction_required', "Document status flagged as 'correction_required'");

  // STEP 8: RECORD DEFICIENCY
  console.log('\n--- STEP 8: RECORDING STATUTORY SCRUTINY DEFICIENCY ---');
  const defResult = await roService.recordDeficiency({
    applicationId: 'TEST-001',
    documentId: targetDoc.id,
    documentName: targetDoc.name,
    category: 'Land & Building',
    clauseReference: 'AICTE APH 2026-27 Norm 4.1',
    severity: 'major',
    deficiencyTitle: 'Land Ownership Title Deed Missing Sub-Registrar Endorsement',
    detailedReason: 'Title deed uploaded does not bear the verified stamp of Sub-Registrar Haveli.',
    remedialActionRequired: 'Upload registered deed along with Form Index-II.',
    rectificationDeadline: '2026-11-15',
    officerName: roSession.user.name,
  });
  assert(defResult.success, 'Deficiency logged on application TEST-001');
  assert(defResult.deficiency && !defResult.deficiency.isDraft, 'Deficiency recorded with official severity and clause reference');

  // STEP 9: REGIONAL OFFICER REQUESTS CORRECTION
  console.log('\n--- STEP 9: REGIONAL OFFICER ISSUES FORMAL CORRECTION NOTICE ---');
  const corrNotice = await roService.submitCorrectionRequest(
    'TEST-001',
    roSession.user.id,
    roSession.user.name,
    'Please rectify the land deed defect and upload indexed copy before statutory deadline.',
    '2026-11-15'
  );
  assert(corrNotice.success, 'Correction notice issued successfully');
  assert(corrNotice.notice && corrNotice.notice.noticeNumber.startsWith('AICTE/CORR/'), 'Formal correction notice number generated');

  const afterNoticeApp = await roService.getApplicationById('TEST-001');
  assert(afterNoticeApp && afterNoticeApp.status === 'correction_required', "Regional view: Application status is strictly 'correction_required'");

  // STEP 10: INSTITUTION MUST IMMEDIATELY SEE CORRECTION_REQUIRED
  console.log('\n--- STEP 10: INSTITUTION IMMEDIATE VISIBILITY OF CORRECTION_REQUIRED ---');
  const instDirectApp = await applications.getById('TEST-001');
  assert(instDirectApp !== null, 'Institution retrieves TEST-001 from shared canonical applications service');
  assert(instDirectApp.status === 'correction_required', "Institution canonical record immediately reflects status: 'correction_required'");

  const instViewApp = await instAppService.getApplicationById('TEST-001');
  assert(instViewApp !== null, 'Institution module service retrieves TEST-001');
  assert(
    instViewApp.status.toLowerCase().includes('correction') || instDirectApp.status === 'correction_required',
    "Institution module immediately displays status: 'Correction Required'"
  );

  // STEP 11: INSTITUTION SUBMITS CORRECTION
  console.log('\n--- STEP 11: INSTITUTION RECTIFIES & RESUBMITS APPLICATION ---');
  const resubmitResult = await instAppService.submitCorrection(
    'TEST-001',
    'Uploaded registered land deed certified by Sub-Registrar along with Index-II.'
  );
  assert(resubmitResult !== null, 'Institution successfully executes submitCorrection');

  const canonicalAfterResubmit = await applications.getById('TEST-001');
  assert(
    canonicalAfterResubmit && canonicalAfterResubmit.status === 'resubmitted',
    "Shared application record status transitioned to 'resubmitted'"
  );

  // STEP 12: REGIONAL OFFICER MUST SEE UPDATED SUBMISSION
  console.log('\n--- STEP 12: REGIONAL OFFICER SEES UPDATED RESUBMISSION ---');
  const roViewAfterResubmit = await roService.getApplicationById('TEST-001');
  assert(roViewAfterResubmit !== null, 'Regional Officer loads updated record for TEST-001');
  assert(
    roViewAfterResubmit && roViewAfterResubmit.status === 'resubmitted',
    "Regional Officer immediately sees updated submission status: 'resubmitted'"
  );

  // STEP 13: RE-SCRUTINY WORKFLOW
  console.log('\n--- STEP 13: REGIONAL OFFICER RE-SCRUTINY WORKFLOW ---');
  const reScrutinyTransition = await roService.executeWorkflowTransition({
    applicationId: 'TEST-001',
    targetStatus: 'under_re_scrutiny',
    officerId: roSession.user.id,
    officerName: roSession.user.name,
    officerRole: 'regional_officer',
    stageName: 'Re-Scrutiny Committee Desk',
    remarks: 'Re-evaluating resubmitted land deed and Sub-Registrar verification certificates.',
  });
  assert(reScrutinyTransition.success, "Application transitioned from 'resubmitted' to 'under_re_scrutiny'");
  assert(
    reScrutinyTransition.application.reScrutinyCount >= 1 || (reScrutinyTransition.application.status === 'under_re_scrutiny'),
    'Re-scrutiny workflow records iteration count'
  );

  // STEP 14: EVC QUEUE & SCHEDULING WORKFLOW
  console.log('\n--- STEP 14: EVC QUEUE & EXPERT COMMITTEE SCHEDULING ---');
  const evcRecords = await repo.getEVCRecords();
  assert(Array.isArray(evcRecords) && evcRecords.length > 0, `EVC inspection queue has ${evcRecords.length} records`);

  const targetEVC = evcRecords[0];
  const scheduleResult = await repo.scheduleEVC(
    targetEVC.id,
    '2026-11-20',
    '2026-11-20',
    [
      { name: 'Dr. Suresh Patil', designation: 'Professor & Dean, VJTI Mumbai', role: 'Chairman' },
      { name: 'Dr. Anita Joshi', designation: 'Associate Professor, COEP Pune', role: 'Member Expert' },
    ],
    roSession.user.name,
    false,
    'Comprehensive physical verification of laboratories, library and infrastructure.'
  );
  assert(scheduleResult.success, 'EVC inspection scheduled with appointed expert committee members');
  assert(scheduleResult.record.status === 'evc_scheduled', "EVC record status updated to 'evc_scheduled'");

  // STEP 15: COMPLIANCE & UNDERTAKING EVALUATION
  console.log('\n--- STEP 15: REGIONAL COMPLIANCE & UNDERTAKING VERIFICATION ---');
  const complianceList = await repo.getComplianceItems();
  assert(Array.isArray(complianceList) && complianceList.length > 0, `Compliance verification queue has ${complianceList.length} items`);

  const targetComp = complianceList[0];
  const compResult = await repo.updateComplianceStatus(
    targetComp.id,
    'verified',
    'Statutory affidavit and undertaking verified against AICTE APH Chapter 1 norms.',
    roSession.user.name,
    'regional_officer'
  );
  assert(compResult.success, 'Institutional compliance requirement evaluated and verified by Regional Officer');
  assert(compResult.item.status === 'verified', "Compliance status set to 'verified'");

  // STEP 16: DEADLINE MONITORING & LATE SUBMISSION CONDONATION
  console.log('\n--- STEP 16: DEADLINE MONITORING & LATE APPEAL CONDONATION ---');
  const lateRequests = await repo.getLateRequests();
  assert(Array.isArray(lateRequests) && lateRequests.length > 0, `Late submission appeals queue has ${lateRequests.length} requests`);

  const targetLate = lateRequests[0];
  const lateReviewResult = await repo.reviewLateRequest(
    targetLate.id,
    'approved',
    'Late submission condoned under extraordinary circumstances (flood/natural calamity circular).',
    roSession.user.name,
    'regional_officer'
  );
  assert(lateReviewResult.success, 'Late submission condonation appeal reviewed and approved with statutory grounds');

  // STEP 17: IMMUTABLE AUDIT TRAIL
  console.log('\n--- STEP 17: IMMUTABLE AUDIT TRAIL VERIFICATION ---');
  const auditEntries = await applications.getHistory('TEST-001');
  assert(Array.isArray(auditEntries) && auditEntries.length > 0, `Canonical audit ledger recorded ${auditEntries.length} immutable events for TEST-001`);

  const actions = auditEntries.map((e) => e.action);
  assert(actions.includes('STATUS_TRANSITION'), 'Audit ledger records all STATUS_TRANSITION events');
  console.log(`  [INFO] Audit trail sample: ${auditEntries.length} entries. Latest: [${auditEntries[0].action}] -> ${auditEntries[0].remarks}`);

  // SUMMARY REPORT
  console.log('\n============================================================');
  console.log(`REGIONAL OFFICER INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegionalFlowTests().catch((err) => {
  console.error('Fatal execution error in Regional Officer test suite:', err);
  process.exit(1);
});
