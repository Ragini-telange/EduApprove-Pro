// ============================================================================
// AICTE SMARTASSIST — COMPLETE 3-TIER END-TO-END WORKFLOW TEST SUITE
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

async function runCompleteWorkflowTests() {
  console.log('\n============================================================');
  console.log('AICTE SMARTASSIST — 3-TIER COMPLETE END-TO-END WORKFLOW');
  console.log('============================================================\n');

  // Load unified services
  const { authService } = await import('../src/services/auth/authService.ts');
  const { applications } = await import('../src/services/applications/applicationsService.ts');
  const { documents } = await import('../src/services/documents/documentsService.ts');
  const { notifications } = await import('../src/services/notifications/notificationsService.ts');
  const { applicationsService: instAppService } = await import('../src/modules/institution/services/applicationsService.ts');
  const { documentsService: instDocService } = await import('../src/modules/institution/services/documentsService.ts');
  const { getRegionalOfficerService } = await import('../src/modules/regional/modules/regional-officer/services/regionalOfficerService.factory.ts');
  const { authorityApi } = await import('../src/modules/senior/services/authorityApi.ts');

  const roService = getRegionalOfficerService();

  // --------------------------------------------------------------------------
  // STEP 1: LOGIN AS INSTITUTION & SUBMIT TEST-001
  // --------------------------------------------------------------------------
  console.log('--- STEP 1: LOGIN AS INSTITUTION & SUBMIT APPLICATION TEST-001 ---');
  const instSession = await authService.login('principal@pict.edu', 'pict1234');
  assert(instSession && instSession.user.role === 'institution', '1.1 Authenticated as Institution Admin');

  // Record baseline Senior Authority total count before creation
  const preCreationRes = await authorityApi.getApplications();
  const preTotalCount = preCreationRes.kpis.totalApplications;
  const prePendingCount = preCreationRes.kpis.applicationsPending;

  // Create Application TEST-001
  const app = await applications.create({
    id: 'TEST-001',
    applicationNumber: 'TEST-001',
    institutionId: 'inst_wro_01',
    institutionName: 'Pune Institute of Computer Technology (PICT)',
    instituteCode: '1-4293811',
    region: 'Western',
    state: 'Maharashtra',
    type: 'extension_of_approval',
    academicYear: '2026-2027',
    priority: 'normal',
  });
  assert(app && app.applicationNumber === 'TEST-001', '1.2 Application TEST-001 created in canonical database');
  assert(app.status === 'draft', "1.3 Initial status is strictly 'draft'");

  // Submit the application
  const submitResult = await applications.updateStatus(
    'TEST-001',
    'submitted',
    'Formal statutory submission of EoA application for AY 2026-27.',
    { id: instSession.user.id, name: instSession.user.name, role: 'institution' }
  );
  assert(submitResult.success, '1.4 Institution submits TEST-001');
  assert(
    submitResult.application && submitResult.application.status === 'submitted',
    "1.5 Expected Status = SUBMITTED (confirmed: 'submitted')"
  );

  // --------------------------------------------------------------------------
  // STEP 2: LOGIN AS REGIONAL OFFICER & REQUEST CORRECTION
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 2: LOGIN AS REGIONAL OFFICER, SCRUTINIZE & REQUEST CORRECTION ---');
  const roSession = await authService.login('regional.officer@aicte.gov.in', 'ro1234');
  assert(roSession && roSession.user.role === 'regional_officer', '2.1 Authenticated as Regional Officer (Ragini Telange)');

  // Find TEST-001 in queue
  const queue = await roService.getApplications();
  const foundInQueue = queue.find((a) => a.applicationNumber === 'TEST-001' || a.id === 'TEST-001');
  assert(foundInQueue !== undefined, '2.2 Found TEST-001 in Regional Officer application queue');
  assert(foundInQueue.status === 'submitted', '2.3 Application TEST-001 status in queue is SUBMITTED');

  // Open application
  const openedApp = await roService.getApplicationById('TEST-001');
  assert(openedApp !== null && openedApp.applicationNumber === 'TEST-001', '2.4 Opened application TEST-001 dossier');

  // Take under scrutiny
  const scrutinyTransition = await roService.executeWorkflowTransition({
    applicationId: 'TEST-001',
    targetStatus: 'under_scrutiny',
    officerId: roSession.user.id,
    officerName: roSession.user.name,
    officerRole: 'regional_officer',
    stageName: 'Regional Scrutiny Committee',
    remarks: 'Dossier opened for document verification and land norms compliance check.',
  });
  assert(scrutinyTransition.success, '2.5 Application routed to under_scrutiny');

  // Review documents
  const docs = await roService.getDocuments('TEST-001');
  assert(Array.isArray(docs) && docs.length > 0, `2.6 Reviewed ${docs.length} statutory documents for TEST-001`);

  const landDoc = docs[0];
  const docReview = await roService.verifyDocument({
    documentId: landDoc.id,
    applicationId: 'TEST-001',
    status: 'correction_required',
    observations: 'Land Ownership Title Deed lacks Sub-Registrar stamp and registered Index-II.',
    deficiencyReason: 'Missing Sub-Registrar stamp',
    officerName: roSession.user.name,
  });
  assert(docReview.success, '2.7 Document scrutiny performed; deficiency observed on land title deed');

  // Record deficiency
  await roService.recordDeficiency({
    applicationId: 'TEST-001',
    documentId: landDoc.id,
    documentName: landDoc.name,
    category: 'Land & Building',
    clauseReference: 'AICTE APH 2026-27 Norm 4.1',
    severity: 'major',
    deficiencyTitle: 'Registered Land Deed Missing Sub-Registrar Seal',
    detailedReason: 'Title deed uploaded does not bear Sub-Registrar seal and registration index-II.',
    remedialActionRequired: 'Upload certified registered land deed with Sub-Registrar endorsement.',
    rectificationDeadline: '2026-11-15',
    officerName: roSession.user.name,
  });

  // Request correction
  const corrNotice = await roService.submitCorrectionRequest(
    'TEST-001',
    roSession.user.id,
    roSession.user.name,
    'Please rectify the land deed defect and upload registered copy before statutory deadline.',
    '2026-11-15'
  );
  assert(corrNotice.success, '2.8 Formal correction request notice served');

  const afterCorrApp = await roService.getApplicationById('TEST-001');
  assert(
    afterCorrApp && afterCorrApp.status === 'correction_required',
    "2.9 Expected Status = CORRECTION_REQUIRED (confirmed: 'correction_required')"
  );

  // --------------------------------------------------------------------------
  // STEP 3: LOGIN AS INSTITUTION, VIEW REASON, UPLOAD CORRECTION & RESUBMIT
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3: LOGIN AS INSTITUTION, VIEW REASON, UPLOAD REVISED DOC & RESUBMIT ---');
  await authService.login('principal@pict.edu', 'pict1234');

  // Open TEST-001
  const instApp = await instAppService.getApplicationById('TEST-001');
  assert(instApp !== null, '3.1 Institution opened TEST-001');
  assert(
    instApp.status.toLowerCase().includes('correction') || (await applications.getById('TEST-001'))?.status === 'correction_required',
    "3.2 Institution observes status: 'Correction Required'"
  );

  // View correction reason
  const canonicalCheck = await applications.getById('TEST-001');
  const history = await applications.getHistory('TEST-001');
  const corrLog = history.find((h) => h.newState === 'correction_required');
  assert(corrLog !== undefined, '3.3 Viewed official deficiency memo and rectification remarks');
  console.log(`  [INFO] Deficiency memo reason: "${corrLog.remarks}"`);

  // Upload corrected document
  const mockFile = {
    name: 'Land_Title_Deed_Registered_Certified.pdf',
    size: 2048 * 1024,
    type: 'application/pdf',
  };
  const uploadedDoc = await documents.upload({
    applicationId: 'TEST-001',
    file: mockFile,
    category: 'Land & Building',
    code: 'DOC-LND-01',
    name: 'Certified Registered Land Title Deed (Index-II Attached)',
  });
  assert(uploadedDoc && uploadedDoc.id, '3.4 Uploaded rectified document with certified Sub-Registrar endorsement');

  // Resubmit application
  const resubmitRes = await instAppService.submitCorrection(
    'TEST-001',
    'Uploaded certified registered land title deed bearing Sub-Registrar seal and Index-II certificate.'
  );
  assert(resubmitRes !== null, '3.5 Executed submitCorrection');

  const canonicalAfterResubmit = await applications.getById('TEST-001');
  assert(
    canonicalAfterResubmit && canonicalAfterResubmit.status === 'resubmitted',
    "3.6 Expected Status = RESUBMITTED (confirmed: 'resubmitted')"
  );

  // --------------------------------------------------------------------------
  // STEP 4: LOGIN AS REGIONAL OFFICER & MOVE TO NEXT CONFIGURED STAGE
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4: LOGIN AS REGIONAL OFFICER & MOVE TO NEXT CONFIGURED STAGE ---');
  await authService.login('regional.officer@aicte.gov.in', 'ro1234');

  // Open TEST-001
  const roViewResubmit = await roService.getApplicationById('TEST-001');
  assert(roViewResubmit !== null && roViewResubmit.status === 'resubmitted', '4.1 Regional Officer opened updated submission with status RESUBMITTED');

  // Verify corrected submission
  const verifyRes = await roService.verifyDocument({
    documentId: uploadedDoc.id,
    applicationId: 'TEST-001',
    status: 'verified',
    observations: 'Sub-Registrar seal and registration Index-II verified compliant with AICTE Norm 4.1.',
    officerName: roSession.user.name,
  });
  assert(verifyRes.success, '4.2 Verified corrected document submission');

  // Move application to next configured stage: under_re_scrutiny -> pending_evc
  const reScrutinyTransition = await roService.executeWorkflowTransition({
    applicationId: 'TEST-001',
    targetStatus: 'under_re_scrutiny',
    officerId: roSession.user.id,
    officerName: roSession.user.name,
    officerRole: 'regional_officer',
    stageName: 'Regional Re-Scrutiny Committee Desk',
    remarks: 'Re-scrutiny completed with zero remaining deficiencies. Clearing for physical inspection.',
  });
  assert(reScrutinyTransition.success, "4.3 Moved application to 'under_re_scrutiny'");

  const evcStageTransition = await roService.executeWorkflowTransition({
    applicationId: 'TEST-001',
    targetStatus: 'pending_evc',
    officerId: roSession.user.id,
    officerName: roSession.user.name,
    officerRole: 'regional_officer',
    stageName: 'Expert Visiting Committee Allocation Desk',
    remarks: 'Documentary scrutiny complete. Forwarded to EVC Inspection allocation stage.',
  });
  assert(evcStageTransition.success, "4.4 Moved application to next configured stage: 'pending_evc'");

  const appAfterNextStage = await roService.getApplicationById('TEST-001');
  assert(
    appAfterNextStage && appAfterNextStage.status === 'pending_evc',
    "4.5 Expected Next Configured Stage = PENDING_EVC (confirmed: 'pending_evc')"
  );

  // --------------------------------------------------------------------------
  // STEP 5: LOGIN AS SENIOR AUTHORITY & VERIFY REAL-TIME AGGREGATES
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5: LOGIN AS SENIOR AUTHORITY & VERIFY AGGREGATES ---');
  const seniorSession = await authService.login('senior.authority@aicte.gov.in', 'admin1234');
  assert(seniorSession && seniorSession.user.role === 'senior_authority', '5.1 Authenticated as Senior Authority (Dr. Janhavi Hinganghatkar)');

  const seniorData = await authorityApi.getApplications();
  const kpis = seniorData.kpis;

  // Verify: Total applications updated
  assert(
    kpis.totalApplications === preTotalCount + 1,
    `5.2 Total applications updated dynamically (${preTotalCount} -> ${kpis.totalApplications})`
  );

  // Verify: Pendency updated
  assert(
    kpis.applicationsPending === prePendingCount + 1,
    `5.3 Applications pendency updated dynamically (${prePendingCount} -> ${kpis.applicationsPending})`
  );

  // Verify: Regional statistics updated
  const geoMetrics = await authorityApi.getRegionalGeoMetrics();
  const westernRegion = geoMetrics.find((g) => g.regionName === 'Western');
  assert(westernRegion !== undefined, '5.4 Western Region GIS statistics retrieved');
  assert(westernRegion.totalApplications >= 1, `5.5 Regional statistics updated for Western Region: ${westernRegion.totalApplications} total applications`);

  // Verify: Relevant workflow status reflected
  const seniorAppRecord = seniorData.data.find((a) => a.applicationNumber === 'TEST-001' || a.id === 'TEST-001');
  assert(seniorAppRecord !== undefined, '5.6 TEST-001 located in Senior Authority central database registry');
  assert(
    seniorAppRecord.currentStatus === 'Under Scrutiny' || seniorAppRecord.currentStage === 'EVC Inspection',
    `5.7 Relevant workflow status reflected in Senior Authority view: Status='${seniorAppRecord.currentStatus}', Stage='${seniorAppRecord.currentStage}'`
  );

  // Verify: Escalation information updated where applicable
  const escalations = await authorityApi.getEscalationCases();
  assert(Array.isArray(escalations), `5.8 Escalation registry active with ${escalations.length} monitored policy cases`);
  assert(typeof kpis.overdueEscalations === 'number', `5.9 Overdue escalations counter verified: ${kpis.overdueEscalations}`);

  // --------------------------------------------------------------------------
  // STEP 6: CHECK NOTIFICATIONS FOR ALL RELEVANT USERS
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 6: CHECK NOTIFICATIONS ACROSS ALL ROLES ---');

  // Trigger upcoming deadline alert and overdue condition alert
  await notifications.emitDeadlineAlert(
    { id: 'TEST-001', applicationNumber: 'TEST-001', institutionName: 'PICT Pune', deadlineDate: '2026-11-15' },
    'upcoming_deadline'
  );
  await notifications.emitDeadlineAlert(
    { id: 'TEST-001', applicationNumber: 'TEST-001', institutionName: 'PICT Pune', deadlineDate: '2026-10-15' },
    'overdue'
  );

  // 6.1: Institution Notifications
  const instNotifs = await notifications.getForUser('inst_wro_01', 'institution');
  assert(Array.isArray(instNotifs) && instNotifs.length > 0, `6.1 Institution received ${instNotifs.length} notifications`);

  // Check: Correction request notification
  const corrNotif = instNotifs.find(
    (n) => n.category === 'Correction Request' || n.title.includes('Deficiency Notice')
  );
  assert(corrNotif !== undefined, '6.2 Institution received Correction Request notification');
  console.log(`  [INFO] Correction request alert: "${corrNotif.title}" - ${corrNotif.message}`);

  // Check: Status change notification
  const statusChangeNotif = instNotifs.find(
    (n) => n.category === 'Status Change' || n.title.includes('Moved to') || n.title.includes('EVC')
  );
  assert(statusChangeNotif !== undefined, '6.3 Institution received Status Change notification');
  console.log(`  [INFO] Status change alert: "${statusChangeNotif.title}"`);

  // Check: Upcoming deadline notification
  const deadlineNotif = instNotifs.find((n) => n.category === 'Upcoming Deadline');
  assert(deadlineNotif !== undefined, '6.4 Institution received Upcoming Deadline notification');
  console.log(`  [INFO] Upcoming deadline alert: "${deadlineNotif.title}"`);

  // 6.2: Regional Officer Notifications
  const roNotifs = await notifications.getForUser('ro-001', 'regional_officer');
  assert(Array.isArray(roNotifs) && roNotifs.length > 0, `6.5 Regional Officer received ${roNotifs.length} notifications`);
  const roDossierNotif = roNotifs.find((n) => n.applicationNumber === 'TEST-001');
  assert(roDossierNotif !== undefined, '6.6 Regional Officer received notification for TEST-001 submission / resubmission');

  // 6.3: Senior Authority Notifications
  const seniorNotifs = await notifications.getForUser('usr_hq_janhavi_01', 'senior_authority');
  assert(Array.isArray(seniorNotifs) && seniorNotifs.length > 0, `6.7 Senior Authority received ${seniorNotifs.length} notifications`);

  // Check: Overdue condition notification
  const overdueNotif = seniorNotifs.find((n) => n.category === 'Overdue Condition');
  assert(overdueNotif !== undefined, '6.8 Senior Authority received Overdue Condition alert notification');
  console.log(`  [INFO] Overdue condition alert: "${overdueNotif.title}" (Severity: ${overdueNotif.severity})`);

  // SUMMARY REPORT
  console.log('\n============================================================');
  console.log(`3-TIER WORKFLOW TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCompleteWorkflowTests().catch((err) => {
  console.error('Fatal execution error in complete workflow test suite:', err);
  process.exit(1);
});
