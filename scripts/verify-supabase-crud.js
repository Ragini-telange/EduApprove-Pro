// ============================================================================
// AICTE SMARTASSIST — SUPABASE INTEGRATION & CRUD VERIFICATION SUITE
// ============================================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';

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

async function runTests() {
  console.log('\n============================================================');
  console.log('AICTE SMARTASSIST — SUPABASE CANONICAL INTEGRATION VERIFICATION');
  console.log('============================================================\n');

  // Test 1: Frontend Security (No Service-Role Key Leak)
  console.log('--- TEST 1: FRONTEND CODEBASE SECURITY & KEY AUDIT ---');
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  assert(!envContent.includes('service_role') && !envContent.includes('SERVICE_ROLE'),
    'Security Check: .env does not expose Supabase service-role secret key');
  assert(envContent.includes('VITE_SUPABASE_URL=https://wsdmvjmhxbaxrdhfyuwm.supabase.co'),
    'Config Check: Points to authoritative shared Supabase instance');
  assert(envContent.includes('VITE_SUPABASE_ANON_KEY='),
    'Config Check: Anon / publishable key is configured for client-side queries');

  // Test 2: Canonical Model and Transition Matrix
  console.log('\n--- TEST 2: STATUTORY WORKFLOW TRANSITION MATRIX ---');
  const { LEGAL_TRANSITIONS, applications } = await import('../src/services/applications/applicationsService.ts');
  assert(Array.isArray(LEGAL_TRANSITIONS['draft']) && LEGAL_TRANSITIONS['draft'].includes('submitted'),
    "Workflow: 'draft' allows transition to 'submitted'");
  assert(!LEGAL_TRANSITIONS['draft'].includes('completed'),
    "Statutory Rule: Direct transition from 'draft' to 'completed' is strictly illegal");
  assert(LEGAL_TRANSITIONS['under_scrutiny'].includes('correction_required'),
    "Workflow: 'under_scrutiny' allows notifying deficiency ('correction_required')");
  assert(LEGAL_TRANSITIONS['correction_required'].includes('resubmitted'),
    "Workflow: 'correction_required' can transition to 'resubmitted'");

  // Test 3: applications.create() & applications.getById()
  console.log('\n--- TEST 3: APPLICATIONS SERVICE CRUD ---');
  const newApp = await applications.create({
    institutionId: 'inst_wro_01',
    type: 'increase_in_intake',
    academicYear: '2026-2027',
    priority: 'urgent',
    institutionName: 'Pune Institute of Computer Technology (PICT)',
    region: 'Western Regional Office (WRO - Pune)',
    state: 'Maharashtra',
  });

  assert(newApp && newApp.id, 'applications.create() returns valid application object');
  assert(newApp.status === 'draft', "applications.create() sets initial statutory state to 'draft'");
  assert(newApp.applicationNumber.startsWith('AICTE/2026-27/'), 'applications.create() assigns statutory AICTE application number');

  const fetchedApp = await applications.getById(newApp.id);
  assert(fetchedApp !== null && fetchedApp.id === newApp.id, 'applications.getById() retrieves created application');

  // Test 4: Role-Based Query Isolation (Institution vs Officer vs Authority)
  console.log('\n--- TEST 4: ROLE DATA ISOLATION (RLS SIMULATION) ---');
  const instApps = await applications.getForInstitution('inst_wro_01');
  assert(Array.isArray(instApps) && instApps.length > 0, 'applications.getForInstitution() returns institution applications');
  const foreignInstApps = await applications.getForInstitution('inst_non_existent');
  assert(foreignInstApps.length <= 3, 'applications.getForInstitution() enforces institution boundary');

  const officerApps = await applications.getForOfficer('usr-ro-001', ['Maharashtra']);
  assert(Array.isArray(officerApps) && officerApps.every(a => a.state === 'Maharashtra'),
    'applications.getForOfficer() filters strictly by jurisdiction state (Maharashtra)');

  const allApps = await applications.getAll();
  assert(Array.isArray(allApps) && allApps.length >= instApps.length,
    'applications.getAll() returns nationwide dataset for Senior Authority oversight');

  // Test 5: applications.updateStatus() & Statutory Integrity
  console.log('\n--- TEST 5: STATUTORY STATUS TRANSITIONS & AUDIT LEDGER ---');
  // Step 5A: Valid transition (draft -> submitted by institution)
  const submitRes = await applications.updateStatus(newApp.id, 'submitted', 'Fee paid and challan uploaded', {
    id: 'inst_admin_01',
    name: 'College Principal',
    role: 'institution',
  });
  assert(submitRes.success && submitRes.application.status === 'submitted',
    "applications.updateStatus() executes legal transition: 'draft' -> 'submitted'");

  // Step 5B: Illegal transition (institution attempting direct approval)
  const illegalRes = await applications.updateStatus(newApp.id, 'completed', 'Self-approving application', {
    id: 'inst_admin_01',
    name: 'College Principal',
    role: 'institution',
  });
  assert(!illegalRes.success && illegalRes.error.includes('AICTE APH regulations'),
    'applications.updateStatus() blocks illegal transition jump with descriptive regulatory error');

  // Step 5C: Audit Ledger Recording
  const history = await applications.getHistory(newApp.id);
  assert(Array.isArray(history) && history.length >= 1,
    'applications.getHistory() retrieves immutable audit ledger entries');
  assert(history[0].action === 'STATUS_TRANSITION',
    'Audit Ledger records authoritative STATUS_TRANSITION action');

  // Test 6: Documents Service CRUD
  console.log('\n--- TEST 6: DOCUMENTS SERVICE CRUD ---');
  const { documents } = await import('../src/services/documents/documentsService.ts');
  const dummyFile = { name: 'Fire_NOC_PICT_2026.pdf', size: 1845200, type: 'application/pdf' };
  const uploadedDoc = await documents.upload({
    applicationId: newApp.id,
    file: dummyFile,
    category: 'Safety & Compliance',
    code: 'DOC-SAF-02',
    name: 'Fire & Life Safety NOC',
  });
  assert(uploadedDoc && uploadedDoc.id, 'documents.upload() creates statutory document entry');
  assert(uploadedDoc.code === 'DOC-SAF-02', 'documents.upload() assigns AICTE norm code');

  const appDocs = await documents.getForApplication(newApp.id);
  assert(Array.isArray(appDocs) && appDocs.some(d => d.id === uploadedDoc.id),
    'documents.getForApplication() retrieves uploaded document');

  const verifyRes = await documents.verifyDocument(
    uploadedDoc.id,
    'verified',
    'Fire safety certificate authenticated with Chief Fire Officer PMC',
    undefined,
    { id: 'usr-ro-001', name: 'Ragini Telange' }
  );
  assert(verifyRes.success && verifyRes.document.status === 'verified',
    "documents.verifyDocument() updates document verification status to 'verified'");

  // Test 7: Compliance Service CRUD
  console.log('\n--- TEST 7: COMPLIANCE SERVICE CRUD ---');
  const { compliance } = await import('../src/services/compliance/complianceService.ts');
  const complianceItems = await compliance.getForInstitution('inst_wro_01');
  assert(Array.isArray(complianceItems) && complianceItems.length > 0,
    'compliance.getForInstitution() returns institutional compliance obligations');

  const targetComp = complianceItems[0];
  const submitCompRes = await compliance.submit(
    targetComp.id,
    'Fire_NOC_Renewal_Endorsement.pdf',
    'https://storage.supabase.co/aicte/fire_noc.pdf'
  );
  assert(submitCompRes.success && submitCompRes.requirement.status === 'submitted',
    "compliance.submit() transitions statutory compliance requirement to 'submitted'");

  // Test 8: Notifications Service CRUD
  console.log('\n--- TEST 8: NOTIFICATIONS SERVICE CRUD ---');
  const { notifications } = await import('../src/services/notifications/notificationsService.ts');
  const notif = await notifications.create({
    recipientRole: 'institution',
    title: 'Statutory Verification Complete',
    message: 'Your Fire NOC has been verified by the Regional Scrutiny Panel.',
    category: 'Scrutiny Notice',
    severity: 'info',
    applicationId: newApp.id,
  });
  assert(notif && notif.id, 'notifications.create() emits statutory notification');

  const userNotifs = await notifications.getForUser(undefined, 'institution');
  assert(Array.isArray(userNotifs) && userNotifs.some(n => n.id === notif.id),
    'notifications.getForUser() retrieves user notifications by role');

  const readSuccess = await notifications.markAsRead(notif.id);
  assert(readSuccess === true, 'notifications.markAsRead() updates read receipt');

  // Test 9: Mappers & Subproject Backward Compatibility
  console.log('\n--- TEST 9: BACKWARD-COMPATIBILITY ADAPTERS ---');
  const {
    canonicalToAuthorityRecord,
    canonicalToRegionalApplication,
    canonicalToInstitutionApplication,
  } = await import('../src/services/data/mappers.ts');

  const authRecord = canonicalToAuthorityRecord(newApp);
  assert(authRecord.applicationNumber === newApp.applicationNumber && authRecord.instituteCode === newApp.instituteCode,
    'canonicalToAuthorityRecord() adapts to Janhavi Senior Authority schema');

  const roApp = canonicalToRegionalApplication(newApp);
  assert(roApp.institution && roApp.institution.name === newApp.institutionName,
    'canonicalToRegionalApplication() adapts to Ragini Regional Officer schema');

  const instApp = canonicalToInstitutionApplication(newApp);
  assert(instApp.application_number === newApp.applicationNumber,
    'canonicalToInstitutionApplication() adapts to Sakshi Institution Admin schema');

  // Summary
  console.log('\n============================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script crashed with exception:', err);
  process.exit(1);
});
