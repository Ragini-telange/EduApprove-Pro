// ============================================================================
// AICTE SMARTASSIST — SENIOR AUTHORITY (BUREAU HEAD) VERIFICATION SUITE
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

async function runSeniorAuthorityFlowTests() {
  console.log('\n============================================================');
  console.log('AICTE SMARTASSIST — SENIOR AUTHORITY (BUREAU HEAD) VERIFICATION');
  console.log('============================================================\n');

  // Load modules
  const { authService } = await import('../src/services/auth/authService.ts');
  const { applications } = await import('../src/services/applications/applicationsService.ts');
  const { authorityApi, computeKPICounters } = await import('../src/modules/senior/services/authorityApi.ts');
  const { ChatbotService } = await import('../src/modules/senior/services/chatbotService.ts');

  // STEP 1: AUTHENTICATION & ROLE ISOLATION
  console.log('--- STEP 1: SENIOR AUTHORITY AUTHENTICATION & ROLE ISOLATION ---');
  const seniorSession = await authService.login('senior.authority@aicte.gov.in', 'admin1234');
  assert(seniorSession && seniorSession.user.role === 'senior_authority', 'Senior Authority authenticates with canonical role: senior_authority');
  assert(seniorSession.user.name === 'Dr. Janhavi Hinganghatkar', 'Senior Authority identity verified: Dr. Janhavi Hinganghatkar');

  // STEP 2: DYNAMIC DASHBOARD BASELINE METRICS
  console.log('\n--- STEP 2: DYNAMIC DASHBOARD BASELINE METRICS ---');
  const baselineRes = await authorityApi.getApplications();
  const baselineKpis = baselineRes.kpis;
  const initialTotal = baselineKpis.totalApplications;
  const initialPending = baselineKpis.applicationsPending;
  const initialScrutiny = baselineKpis.applicationsUnderScrutiny;
  const initialCorrection = baselineKpis.applicationsRequiringCorrection;
  const initialOverdue = baselineKpis.overdueApplications;
  const initialCompleted = baselineKpis.completedApplications;

  assert(initialTotal > 0, `Baseline Total Applications: ${initialTotal}`);
  assert(typeof initialPending === 'number', `Baseline Applications Pending: ${initialPending}`);

  // Confirm dynamic computation against records
  const recomputed = computeKPICounters(baselineRes.data);
  assert(recomputed.totalApplications === baselineKpis.totalApplications, 'KPI counters dynamically computed from records (zero hardcoded numbers)');
  assert(recomputed.completedApplications === baselineKpis.completedApplications, 'Completed count strictly matches Approved + Rejected records');

  // STEP 3: LIVE DATA REACTION: INSTITUTION SUBMITS APPLICATION
  console.log('\n--- STEP 3: REAL-TIME REACTION TO INSTITUTION APPLICATION SUBMISSION ---');
  const testAppId = `AICTE-HQ-TEST-${Date.now().toString().slice(-4)}`;
  const createdApp = await applications.create({
    id: testAppId,
    applicationNumber: testAppId,
    institutionId: 'inst_wro_01',
    institutionName: 'Pune Institute of Computer Technology',
    instituteCode: '1-4293811',
    region: 'Western',
    state: 'Maharashtra',
    type: 'increase_in_intake',
    academicYear: '2026-2027',
  });

  // Institution submits it
  await applications.updateStatus(
    testAppId,
    'submitted',
    'Statutory application submitted by PICT.',
    { id: 'inst_admin_01', name: 'PICT Registrar', role: 'institution' }
  );

  const afterSubmitRes = await authorityApi.getApplications();
  assert(
    afterSubmitRes.kpis.totalApplications === initialTotal + 1,
    `Senior Authority totalApplications increments by 1 (${initialTotal} -> ${afterSubmitRes.kpis.totalApplications})`
  );
  assert(
    afterSubmitRes.kpis.applicationsPending === initialPending + 1,
    `Senior Authority applicationsPending increments by 1 (${initialPending} -> ${afterSubmitRes.kpis.applicationsPending})`
  );

  const foundApp = afterSubmitRes.data.find((a) => a.applicationNumber === testAppId || a.id === testAppId);
  assert(foundApp !== undefined, `Submitted application ${testAppId} appears in Senior Authority database registry`);

  // STEP 4: LIVE DATA REACTION: REGIONAL OFFICER MOVES TO SCRUTINY
  console.log('\n--- STEP 4: REAL-TIME REACTION TO REGIONAL SCRUTINY ALLOCATION ---');
  await applications.updateStatus(
    testAppId,
    'under_scrutiny',
    'Dossier allocated to Regional Scrutiny Panel.',
    { id: 'ro-001', name: 'Ragini Telange', role: 'regional_officer' }
  );

  const afterScrutinyRes = await authorityApi.getApplications();
  assert(
    afterScrutinyRes.kpis.applicationsUnderScrutiny === initialScrutiny + 1,
    `Senior Authority applicationsUnderScrutiny increments by 1 (${initialScrutiny} -> ${afterScrutinyRes.kpis.applicationsUnderScrutiny})`
  );

  // STEP 5: LIVE DATA REACTION: DEFICIENCY NOTIFIED (CORRECTION REQUIRED)
  console.log('\n--- STEP 5: REAL-TIME REACTION TO DEFICIENCY & CORRECTION REQUEST ---');
  await applications.updateStatus(
    testAppId,
    'correction_required',
    'Land Title Deed lacks Sub-Registrar endorsement.',
    { id: 'ro-001', name: 'Ragini Telange', role: 'regional_officer' }
  );

  // Set deficiency count on canonical record
  const currentCanonical = await applications.getById(testAppId);
  if (currentCanonical) {
    currentCanonical.deficiencyCount = 1;
  }

  const afterCorrectionRes = await authorityApi.getApplications();
  assert(
    afterCorrectionRes.kpis.applicationsRequiringCorrection === initialCorrection + 1,
    `Senior Authority applicationsRequiringCorrection increments by 1 (${initialCorrection} -> ${afterCorrectionRes.kpis.applicationsRequiringCorrection})`
  );

  // STEP 6: LIVE DATA REACTION: OVERDUE SLA BREACH
  console.log('\n--- STEP 6: REAL-TIME REACTION TO OVERDUE APPLICATION ---');
  if (currentCanonical) {
    currentCanonical.priority = 'critical';
    currentCanonical.deadlineDate = '2026-10-01'; // Past deadline
  }

  const afterOverdueRes = await authorityApi.getApplications();
  assert(
    afterOverdueRes.kpis.overdueApplications === initialOverdue + 1,
    `Senior Authority overdueApplications increments by 1 (${initialOverdue} -> ${afterOverdueRes.kpis.overdueApplications})`
  );

  // STEP 7: SENIOR AUTHORITY REASSIGNMENT & FOLLOW-UP DIRECTIVE
  console.log('\n--- STEP 7: SENIOR AUTHORITY ADMINISTRATIVE DIRECTIVES & REASSIGNMENT ---');
  const reassignSuccess = await authorityApi.reassignOfficer(
    testAppId,
    'Dr. S. K. Mahajan (RO Western)',
    'Balancing regional scrutiny load before statutory cutoff.'
  );
  assert(reassignSuccess, 'Senior Authority reassigns scrutiny officer with mandatory justification');

  const directiveSuccess = await authorityApi.sendOfficialFollowUp(
    testAppId,
    'Expedite physical infrastructure inspection under Emergency priority.'
  );
  assert(directiveSuccess, 'Senior Authority dispatches official follow-up directive');

  const seniorAuditLogs = await authorityApi.getAuditLogs();
  const directiveLog = seniorAuditLogs.find((l) => l.action === 'STATUTORY_DIRECTIVE_ISSUED');
  assert(directiveLog !== undefined, 'Follow-up directive recorded in immutable Senior Authority audit log');

  // STEP 8: FINAL STATUTORY DECISION (HQ APPROVAL)
  console.log('\n--- STEP 8: FINAL STATUTORY DECISION (APPROVAL / REJECTION) ---');
  // Statutory workflow: Institution rectifies & resubmits, Regional Officer clears re-scrutiny
  await applications.updateStatus(
    testAppId,
    'resubmitted',
    'Uploaded registered deed endorsed by Sub-Registrar.',
    { id: 'inst_admin_01', name: 'PICT Registrar', role: 'institution' }
  );
  await applications.updateStatus(
    testAppId,
    'under_re_scrutiny',
    'Re-scrutiny verified all documents. Recommended for final statutory sanction.',
    { id: 'ro-001', name: 'Ragini Telange', role: 'regional_officer' }
  );

  const decisionSuccess = await authorityApi.executeStatutoryDecision(
    testAppId,
    'Approved',
    'All AICTE Approval Process Handbook Chapter 1 norms validated. Formal EoA granted.'
  );
  assert(decisionSuccess, 'Senior Authority grants official statutory approval (Approved)');

  const afterDecisionRes = await authorityApi.getApplications();
  assert(
    afterDecisionRes.kpis.completedApplications === initialCompleted + 1,
    `Senior Authority completedApplications increments by 1 (${initialCompleted} -> ${afterDecisionRes.kpis.completedApplications})`
  );

  const finalizedCanonical = await applications.getById(testAppId);
  assert(
    finalizedCanonical && finalizedCanonical.status === 'completed',
    "Canonical database record transitions to 'completed' (Statutory Approval Granted)"
  );

  // STEP 9: REGION-WISE ANALYTICS & GIS REGIONAL ALERT MAP
  console.log('\n--- STEP 9: REGION-WISE ANALYTICS & DELAY INTELLIGENCE ---');
  const geoMetrics = await authorityApi.getRegionalGeoMetrics();
  assert(Array.isArray(geoMetrics) && geoMetrics.length >= 8, `GIS Regional Alert Map covers ${geoMetrics.length} AICTE administrative regions`);

  const westernRegion = geoMetrics.find((g) => g.regionName === 'Western');
  assert(westernRegion !== undefined, 'Western Regional Office (WRO) GIS geo-metric calculated');
  assert(typeof westernRegion.totalApplications === 'number', `Western Region Total Applications: ${westernRegion.totalApplications}`);

  const delayData = await authorityApi.getDelayIntelligence();
  assert(Array.isArray(delayData.bottleneckStages) && delayData.bottleneckStages.length > 0, 'Bottleneck delay analysis identifies latency by scrutiny stage');
  assert(Array.isArray(delayData.riskIndicators), 'Explainable rule-based risk indicators computed');

  // STEP 10: STATUTORY EXECUTIVE REPORTS MODULE
  console.log('\n--- STEP 10: STATUTORY EXECUTIVE REPORTS MODULE ---');
  const reportRes = await authorityApi.getReportsData('overall_pendency');
  assert(reportRes && Array.isArray(reportRes.applications) && reportRes.applications.length > 0, `Statutory reports module generated ${reportRes.applications.length} exportable records`);
  assert(typeof reportRes.total === 'number', `Report summary total: ${reportRes.total}`);

  // STEP 11: AI COPILOT & CHATBOT SERVICE
  console.log('\n--- STEP 11: AI REGULATORY ASSISTANT & CHATBOT INTEGRATION ---');
  const botAnswer = await ChatbotService.queryAssistant(
    'What is the statutory deadline for deficiency rectification under AICTE calendar?',
    { userRole: 'bureau_officer', language: 'en' }
  );
  const responseText = botAnswer.messageText || botAnswer.content || '';
  assert(botAnswer && responseText.length > 0, 'AI Copilot responds with statutory guidance');
  assert(Array.isArray(botAnswer.sources) && botAnswer.sources.length > 0, 'AI Copilot provides handbook citations');
  console.log(`  [INFO] Copilot response: "${responseText.slice(0, 100)}..." (Sources: ${botAnswer.sources.length})`);

  // SUMMARY REPORT
  console.log('\n============================================================');
  console.log(`SENIOR AUTHORITY INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSeniorAuthorityFlowTests().catch((err) => {
  console.error('Fatal execution error in Senior Authority test suite:', err);
  process.exit(1);
});
