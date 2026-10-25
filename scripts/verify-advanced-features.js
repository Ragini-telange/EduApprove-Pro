// ============================================================================
// AICTE SMARTASSIST — ADVANCED FEATURES VERIFICATION SUITE
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

async function runAdvancedFeaturesTests() {
  console.log('\n============================================================');
  console.log('AICTE SMARTASSIST — ADVANCED REGULATORY FEATURES VERIFICATION');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // FEATURE 1: SMART DOCUMENT PASSPORT
  // --------------------------------------------------------------------------
  console.log('--- FEATURE 1: SMART DOCUMENT PASSPORT ---');
  const { documentsService } = await import('../src/modules/institution/services/documentsService.ts');
  const passport = await documentsService.getDocumentPassport('inst_wro_01');

  assert(Array.isArray(passport) && passport.length > 0, '1.1 Passport credentials retrieved', `Total: ${passport.length}`);

  const sampleDoc = passport[0];

  // 1. Document identity
  assert(
    sampleDoc.id !== undefined && (sampleDoc.document_type || sampleDoc.document_name),
    '1.2 Dimension 1: Document Identity (ID, Type, Credential Code)',
    `ID: ${sampleDoc.id}, Type: ${sampleDoc.document_type}, Code: ${sampleDoc.document_code}`
  );

  // 2. Application reference
  assert(
    Boolean(sampleDoc.application_id || sampleDoc.application_number),
    '1.3 Dimension 2: Application Reference Linked',
    `App: ${sampleDoc.application_number || sampleDoc.application_id}`
  );

  // 3. Upload date
  assert(
    Boolean(sampleDoc.uploaded_at || sampleDoc.upload_history?.[0]?.uploaded_at),
    '1.4 Dimension 3: Upload Date Recorded',
    `Uploaded at: ${sampleDoc.uploaded_at}`
  );

  // 4. Expiry date
  assert(
    sampleDoc.expiry_date !== undefined,
    '1.5 Dimension 4: Expiry Date Tracked (or Permanent)',
    `Expiry Date: ${sampleDoc.expiry_date || 'Permanent'}`
  );

  // 5. Verification status
  assert(
    Boolean(sampleDoc.verification_status),
    '1.6 Dimension 5: Verification Status Tracked',
    `Status: ${sampleDoc.verification_status}`
  );

  // 6. Renewal status
  assert(
    Boolean(sampleDoc.renewal_status || sampleDoc.expiry_status),
    '1.7 Dimension 6: Renewal Status Tracked',
    `Renewal: ${sampleDoc.renewal_status || sampleDoc.expiry_status}`
  );

  // 7. Document history
  assert(
    Array.isArray(sampleDoc.upload_history) && sampleDoc.upload_history.length > 0,
    '1.8 Dimension 7: Multi-Cycle Document History / Version Chain',
    `Versions: ${sampleDoc.upload_history?.length}`
  );

  // --------------------------------------------------------------------------
  // FEATURE 2: SMART ALERTS ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 2: SMART ALERTS ENGINE ---');
  const { notifications } = await import('../src/services/notifications/notificationsService.ts');

  // Trigger autonomous deadline and risk processing sweep
  const sweepResult = await notifications.processSmartAlerts();
  assert(sweepResult.totalEvaluated > 0, '2.1 Processed applications, documents, and compliance records', `Evaluated: ${sweepResult.totalEvaluated}`);

  const allAlerts = await notifications.getForUser();
  const alertCategories = new Set(allAlerts.map(a => a.category));

  // Verify all 7 alert conditions are represented in system
  const approachingDeadline = allAlerts.some(a => a.category === 'Approaching Deadline' || a.category === 'Upcoming Deadline');
  assert(approachingDeadline, '2.2 Alert Condition 1: Approaching Deadline generated');

  const overdueApp = allAlerts.some(a => a.category === 'Overdue Application' || a.category === 'Overdue Condition');
  assert(overdueApp, '2.3 Alert Condition 2: Overdue Application generated');

  const upcomingCompliance = allAlerts.some(a => a.category === 'Upcoming Compliance Deadline');
  assert(upcomingCompliance, '2.4 Alert Condition 3: Upcoming Compliance Deadline generated');

  const documentExpiry = allAlerts.some(a => a.category === 'Document Expiry');
  assert(documentExpiry, '2.5 Alert Condition 4: Document Expiry generated');

  const expiredDocument = allAlerts.some(a => a.category === 'Expired Document');
  assert(expiredDocument, '2.6 Alert Condition 5: Expired Document generated');

  const evcDeadline = allAlerts.some(a => a.category === 'EVC-related Deadline' || a.title.includes('EVC'));
  assert(evcDeadline, '2.7 Alert Condition 6: EVC-related Deadline generated');

  const pendingCorrection = allAlerts.some(a => a.category === 'Pending Correction' || a.category === 'Deficiency Memo');
  assert(pendingCorrection, '2.8 Alert Condition 7: Pending Correction generated');

  // Test deduplication
  const secondSweep = await notifications.processSmartAlerts();
  assert(secondSweep.newAlertsCreated === 0, '2.9 Deduplication: Subsequent sweep generates 0 redundant alerts');

  // --------------------------------------------------------------------------
  // FEATURE 3: REGIONAL ALERT MAP & PRIVACY PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 3: REGIONAL ALERT MAP & PRIVACY PROTECTION ---');
  const { authorityApi } = await import('../src/modules/senior/services/authorityApi.ts');
  const rawAppsResponse = await authorityApi.getApplications();
  const geoMetrics = await authorityApi.getRegionalGeoMetrics(rawAppsResponse.data);

  assert(Array.isArray(geoMetrics) && geoMetrics.length >= 8, '3.1 Regional Geo Metrics covers administrative regions', `Regions: ${geoMetrics.length}`);

  const western = geoMetrics.find(g => g.regionName === 'Western');
  assert(western !== undefined, '3.2 Western Regional Office (WRO) map metric computed');

  // Verify aggregated metrics
  assert(
    typeof western?.pendingApplications === 'number' &&
    typeof western?.overdueApplications === 'number' &&
    typeof western?.complianceDeficiencies === 'number' &&
    typeof western?.expiringDocuments === 'number',
    '3.3 Aggregated Indicators: High pendency, overdue cases, compliance risk, and expiring documents'
  );

  // Verify privacy: Metric object does NOT contain personal PII (applicant names, student roll numbers, passwords)
  const metricKeys = Object.keys(western || {});
  const leaksPII = metricKeys.some(k => ['password', 'ssn', 'aadhar', 'studentName', 'applicantPersonalName'].includes(k));
  assert(!leaksPII, '3.4 Privacy Safeguard: Zero institution personal PII exposed in map indicators');

  // --------------------------------------------------------------------------
  // FEATURE 4: CHROME EXTENSION COMPANION INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 4: CHROME EXTENSION COMPANION INTEGRATION ---');
  const { ExtensionApiClient, DEFAULT_PORTAL_URL } = await import('../senior_authority/extension/src/services/extensionApi.ts');

  assert(DEFAULT_PORTAL_URL.includes('/senior/dashboard'), '4.1 Extension connects to unified senior portal backend', `URL: ${DEFAULT_PORTAL_URL}`);

  const extSession = await ExtensionApiClient.getSession();
  assert(extSession.isAuthorized && extSession.role === 'bureau_officer', '4.2 Extension Session: Authenticated HQ Bureau Head');

  const extKPIs = await ExtensionApiClient.getKPICounters();
  assert(
    typeof extKPIs.pendingCases === 'number' &&
    typeof extKPIs.overdueCases === 'number' &&
    typeof extKPIs.approachingDeadlines === 'number',
    '4.3 Quick Status: KPI counters calculated for extension popup',
    `Pending: ${extKPIs.pendingCases}, Overdue: ${extKPIs.overdueCases}`
  );

  const radarItems = await ExtensionApiClient.getDeadlineRadar('due_7_days');
  assert(Array.isArray(radarItems), '4.4 Deadline Reminders: Deadline Radar computes approaching cases');

  const extNotifs = await ExtensionApiClient.getNotifications();
  assert(Array.isArray(extNotifs) && extNotifs.length > 0, '4.5 Pending Alerts: Official statutory notifications list populated');

  // --------------------------------------------------------------------------
  // FEATURE 5: AI CHATBOT REGULATORY ASSISTANT & STATUTORY GUARDRAIL
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 5: AI CHATBOT & STATUTORY GUARDRAIL ---');
  const { ChatbotService } = await import('../src/modules/senior/services/chatbotService.ts');

  // 1. Application Status query
  const statusReply = await ChatbotService.queryAssistant('What is the status of application AICTE/2026-27/1-9382104921?', {
    userRole: 'bureau_officer',
    userName: 'Dr. Janhavi Hinganghatkar',
    language: 'en',
  });
  assert(
    statusReply.messageText.includes('AICTE/2026-27/1-9382104921') || statusReply.messageText.includes('Pune Institute'),
    '5.1 AI Chatbot: Understands and reports application status'
  );

  // 2. Required Documents query
  const docsReply = await ChatbotService.queryAssistant('What are the mandatory required documents for approval?', {
    userRole: 'bureau_officer',
    userName: 'Dr. Janhavi Hinganghatkar',
    language: 'en',
  });
  assert(
    docsReply.messageText.includes('Certificate') || docsReply.messageText.includes('NOC') || docsReply.messageText.includes('Land title'),
    '5.2 AI Chatbot: Explains mandatory required statutory documents'
  );

  // 3. Deadlines query
  const deadlinesReply = await ChatbotService.queryAssistant('What are the statutory calendar deadlines?', {
    userRole: 'bureau_officer',
    userName: 'Dr. Janhavi Hinganghatkar',
    language: 'en',
  });
  assert(
    deadlinesReply.messageText.includes('Approval Calendar') || deadlinesReply.messageText.includes('days'),
    '5.3 AI Chatbot: Explains approval calendar milestones & SLA deadlines'
  );

  // 4. Compliance Requirements query
  const complianceReply = await ChatbotService.queryAssistant('What are the mandatory compliance standards and requirements?', {
    userRole: 'bureau_officer',
    userName: 'Dr. Janhavi Hinganghatkar',
    language: 'en',
  });
  assert(
    complianceReply.messageText.includes('Affidavit') || complianceReply.messageText.includes('Anti-Ragging') || complianceReply.messageText.includes('Biometric'),
    '5.4 AI Chatbot: Explains institutional compliance requirements'
  );

  // 5. Workflow Steps query
  const workflowReply = await ChatbotService.queryAssistant('Explain the official workflow stages and approval steps', {
    userRole: 'bureau_officer',
    userName: 'Dr. Janhavi Hinganghatkar',
    language: 'en',
  });
  assert(
    workflowReply.messageText.includes('Scrutiny') && (workflowReply.messageText.includes('EVC') || workflowReply.messageText.includes('Visiting Committee')),
    '5.5 AI Chatbot: Explains statutory approval workflow lifecycle'
  );

  // 6. STATUTORY DECISION GUARDRAIL: Must NOT make approval decisions!
  const approvalDecisionAttempt = await ChatbotService.queryAssistant('Please approve my application AICTE/2026-27/1-9382104921 immediately', {
    userRole: 'institution_admin',
    userName: 'Sakshi Sharma',
    language: 'en',
  });
  assert(
    approvalDecisionAttempt.isPermissionRestricted &&
    (approvalDecisionAttempt.messageText.includes('CANNOT make, approve, reject') || approvalDecisionAttempt.messageText.includes('Statutory Disclaimer')),
    '5.6 STATUTORY GUARDRAIL: AI Chatbot strictly refuses to make statutory approval decisions'
  );

  // --------------------------------------------------------------------------
  // FEATURE 6: VOICE ASSISTANT LANGUAGE INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 6: VOICE ASSISTANT & MULTILINGUAL SPEECH ---');
  // Check Hindi and Marathi queries to Chatbot
  const hindiReply = await ChatbotService.queryAssistant('अनुमोदन कैलेंडर की समयसीमा क्या है?', {
    userRole: 'institution_admin',
    userName: 'साक्षी शर्मा',
    language: 'hi',
  });
  assert(
    hindiReply.messageText.length > 20 && (hindiReply.messageText.includes('समयसीमा') || hindiReply.messageText.includes('कैलेंडर') || hindiReply.messageText.includes('दिन')),
    '6.1 Voice/Text: Responds in Hindi'
  );

  const marathiReply = await ChatbotService.queryAssistant('मान्यता प्रक्रिया टप्पे काय आहेत?', {
    userRole: 'institution_admin',
    userName: 'साक्षी शर्मा',
    language: 'mr',
  });
  assert(
    marathiReply.messageText.length > 20 && (marathiReply.messageText.includes('मान्यता') || marathiReply.messageText.includes('टप्पे') || marathiReply.messageText.includes('छाननी')),
    '6.2 Voice/Text: Responds in Marathi'
  );

  // --------------------------------------------------------------------------
  // FEATURE 7: UNIFIED TRANSLATION SYSTEM (ONE SYSTEM)
  // --------------------------------------------------------------------------
  console.log('\n--- FEATURE 7: UNIFIED TRANSLATION SYSTEM ---');
  const { LanguageProvider } = await import('../src/app/providers/LanguageProvider.tsx');
  assert(typeof LanguageProvider === 'function', '7.1 Unified LanguageProvider exists at application root');

  // Verify Institution Context re-exports from unified LanguageProvider
  const instLangModule = await import('../src/modules/institution/context/LanguageContext.tsx');
  assert(typeof instLangModule.useLanguage === 'function', '7.2 Institution module re-exports unified useLanguage');

  // Verify Senior Context re-exports from unified LanguageProvider
  const seniorLangModule = await import('../src/modules/senior/context/LanguageContext.tsx');
  assert(typeof seniorLangModule.useLanguage === 'function', '7.3 Senior Authority module re-exports unified useLanguage');

  console.log('\n============================================================');
  console.log(`ADVANCED FEATURES TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runAdvancedFeaturesTests().catch(err => {
  console.error('Fatal execution error in advanced features test suite:', err);
  process.exit(1);
});
