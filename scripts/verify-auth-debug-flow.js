import { authService, DEMO_PROFILES } from '../src/services/auth/authService';
import { getRoleDashboardPath, isRouteAuthorizedForRole } from '../src/types/auth';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}${details ? ' — ' + details : ''}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ' — ' + details : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('====================================================================');
  console.log('AICTE SMARTASSIST — AUTHENTICATION END-TO-END VERIFICATION');
  console.log('====================================================================');

  // Clear previous session
  await authService.logout();

  // -------------------------------------------------------------------------
  // 1. INPUT VALIDATION TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- 1. INPUT VALIDATION & WEAK PASSWORD TESTS ---');

  // 1.1 Missing Name
  try {
    await authService.signUp({
      name: '',
      email: 'test@example.com',
      password: 'validPassword123',
      role: 'institution',
    });
    assert(false, 'Reject missing name');
  } catch (err) {
    assert(err.message.includes('full official name'), 'Reject missing name', err.message);
  }

  // 1.2 Invalid Email Format
  try {
    await authService.signUp({
      name: 'Dr. Test User',
      email: 'invalid-email-format',
      password: 'validPassword123',
      role: 'institution',
    });
    assert(false, 'Reject invalid email format');
  } catch (err) {
    assert(err.message.includes('valid email address format'), 'Reject invalid email format', err.message);
  }

  // 1.3 Weak Password (< 6 chars)
  try {
    await authService.signUp({
      name: 'Dr. Test User',
      email: 'valid.user@institution.edu',
      password: '123',
      role: 'institution',
    });
    assert(false, 'Reject weak password (< 6 chars)');
  } catch (err) {
    assert(err.message.includes('at least 6 characters'), 'Reject weak password (< 6 chars)', err.message);
  }

  // -------------------------------------------------------------------------
  // 2. PRIVILEGED ROLE PROTECTION TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- 2. PRIVILEGED ROLE PROTECTION & CLEARANCE KEY TESTS ---');

  // 2.1 Regional Officer without valid clearance key
  try {
    await authService.signUp({
      name: 'Unauthorized RO',
      email: 'fake.ro@aicte-india.org',
      password: 'SecurePassword123!',
      role: 'regional_officer',
      authorizationKey: 'WRONG-KEY',
    });
    assert(false, 'Block Regional Officer creation with invalid clearance key');
  } catch (err) {
    assert(err.message.includes('Privileged Access Restriction'), 'Block Regional Officer creation with invalid clearance key', err.message);
  }

  // 2.2 Senior Authority without valid security key
  try {
    await authService.signUp({
      name: 'Unauthorized Senior',
      email: 'fake.hq@aicte-india.org',
      password: 'SecurePassword123!',
      role: 'senior_authority',
      authorizationKey: 'WRONG-KEY',
    });
    assert(false, 'Block Senior Authority creation with invalid security key');
  } catch (err) {
    assert(err.message.includes('Privileged Access Restriction'), 'Block Senior Authority creation with invalid security key', err.message);
  }

  // -------------------------------------------------------------------------
  // 3. CREATE INSTITUTION USER -> SIGN UP -> PROFILE -> LOGIN -> REDIRECT
  // -------------------------------------------------------------------------
  console.log('\n--- 3. TEST FLOW: CREATE INSTITUTION USER & SIGN IN ---');

  const instEmail = `principal.test.${Date.now()}@vjti.ac.in`;
  const instPassword = 'VJTI_SecurePass2026!';

  // 3.1 Sign Up
  const instSession = await authService.signUp({
    name: 'Prof. Ananya Kulkarni',
    email: instEmail,
    password: instPassword,
    role: 'institution',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    institutionCode: '1-9988221',
  });

  assert(!!instSession, 'Institution user registered successfully');
  assert(instSession.user.role === 'institution', 'Registered role is strictly "institution"', `Role: ${instSession.user.role}`);
  assert(instSession.user.email === instEmail, 'Email stored correctly in profile', instSession.user.email);
  assert(instSession.user.institutionCode === '1-9988221', 'Institution Code recorded', instSession.user.institutionCode);

  // 3.2 Duplicate Email Detection
  try {
    await authService.signUp({
      name: 'Duplicate Registrant',
      email: instEmail,
      password: 'AnotherPassword123!',
      role: 'institution',
    });
    assert(false, 'Duplicate email detected and blocked');
  } catch (dupErr) {
    assert(dupErr.message.includes('already exists'), 'Duplicate email detected and blocked', dupErr.message);
  }

  // 3.3 Log out then Login
  await authService.logout();
  const instLoginSession = await authService.login(instEmail, instPassword);
  assert(!!instLoginSession, 'Newly registered Institution user can sign in with credentials');
  assert(instLoginSession.user.role === 'institution', 'Authenticated user role preserved on login', instLoginSession.user.role);

  // 3.4 Role-Based Redirect Verification
  const instRedirectPath = getRoleDashboardPath(instLoginSession.user.role);
  assert(instRedirectPath === '/institution/dashboard', 'Institution redirected to /institution/dashboard', instRedirectPath);

  // -------------------------------------------------------------------------
  // 4. CREATE REGIONAL OFFICER USER -> SIGN UP -> LOGIN -> REDIRECT
  // -------------------------------------------------------------------------
  console.log('\n--- 4. TEST FLOW: CREATE REGIONAL OFFICER & SIGN IN ---');

  const roEmail = `ro.scrutiny.${Date.now()}@aicte-wro.gov.in`;
  const roPassword = 'RO_ScrutinyPass2026!';

  // 4.1 Sign Up with Valid Clearance Key (AICTE-RO-2026)
  const roSession = await authService.signUp({
    name: 'Officer Rajesh Deshmukh',
    email: roEmail,
    password: roPassword,
    role: 'regional_officer',
    regionalOffice: 'Western Regional Office (WRO - Pune)',
    authorizationKey: 'AICTE-RO-2026',
  });

  assert(!!roSession, 'Regional Officer registered with valid clearance key');
  assert(roSession.user.role === 'regional_officer', 'Registered role is strictly "regional_officer"', roSession.user.role);

  // 4.2 Log out then Login
  await authService.logout();
  const roLoginSession = await authService.login(roEmail, roPassword);
  assert(!!roLoginSession, 'Newly registered Regional Officer can sign in');
  assert(roLoginSession.user.role === 'regional_officer', 'Authenticated officer role preserved on login', roLoginSession.user.role);

  // 4.3 Role-Based Redirect Verification
  const roRedirectPath = getRoleDashboardPath(roLoginSession.user.role);
  assert(roRedirectPath === '/regional/dashboard', 'Regional Officer redirected to /regional/dashboard', roRedirectPath);

  // -------------------------------------------------------------------------
  // 5. CREATE SENIOR AUTHORITY USER -> SIGN UP -> LOGIN -> REDIRECT
  // -------------------------------------------------------------------------
  console.log('\n--- 5. TEST FLOW: CREATE SENIOR AUTHORITY & SIGN IN ---');

  const hqEmail = `hq.bureau.${Date.now()}@aicte-india.org`;
  const hqPassword = 'HQ_CentralSecurity2026!';

  // 5.1 Sign Up with Valid Ministry Key (AICTE-HQ-2026)
  const hqSession = await authService.signUp({
    name: 'Dr. Vivek Swaminathan',
    email: hqEmail,
    password: hqPassword,
    role: 'senior_authority',
    designation: 'Advisor & Central Bureau Head',
    authorizationKey: 'AICTE-HQ-2026',
  });

  assert(!!hqSession, 'Senior Authority registered with valid clearance key');
  assert(hqSession.user.role === 'senior_authority', 'Registered role is strictly "senior_authority"', hqSession.user.role);

  // 5.2 Log out then Login
  await authService.logout();
  const hqLoginSession = await authService.login(hqEmail, hqPassword);
  assert(!!hqLoginSession, 'Newly registered Senior Authority can sign in');
  assert(hqLoginSession.user.role === 'senior_authority', 'Authenticated bureau role preserved on login', hqLoginSession.user.role);

  // 5.3 Role-Based Redirect Verification
  const hqRedirectPath = getRoleDashboardPath(hqLoginSession.user.role);
  assert(hqRedirectPath === '/senior/dashboard', 'Senior Authority redirected to /senior/dashboard', hqRedirectPath);

  // -------------------------------------------------------------------------
  // 6. SESSION PERSISTENCE & LOGOUT TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- 6. SESSION PERSISTENCE & LOGOUT AUDIT ---');

  // 6.1 Restore Session
  const restoredSession = await authService.restoreSession();
  assert(!!restoredSession, 'Session successfully restored without re-authenticating');
  assert(restoredSession?.user.email === hqEmail, 'Restored session matches active user identity', restoredSession?.user.email);

  // 6.2 Logout Handling
  await authService.logout();
  const postLogoutSession = await authService.restoreSession();
  assert(postLogoutSession === null, 'Session completely destroyed upon logout');

  // -------------------------------------------------------------------------
  // 7. ROUTE ACCESS CONTROL & PERMISSION SCOPING (RoleGuard Logic)
  // -------------------------------------------------------------------------
  console.log('\n--- 7. ROUTE PERMISSION SCOPING & ACCESS CONTROL ---');

  // 7.1 Institution access rules
  assert(isRouteAuthorizedForRole('institution', '/institution/dashboard'), 'Institution CAN access /institution/dashboard');
  assert(!isRouteAuthorizedForRole('institution', '/regional/dashboard'), 'Institution CANNOT access /regional/dashboard');
  assert(!isRouteAuthorizedForRole('institution', '/senior/dashboard'), 'Institution CANNOT access /senior/dashboard');

  // 7.2 Regional Officer access rules
  assert(isRouteAuthorizedForRole('regional_officer', '/regional/dashboard'), 'Regional Officer CAN access /regional/dashboard');
  assert(!isRouteAuthorizedForRole('regional_officer', '/institution/dashboard'), 'Regional Officer CANNOT access /institution/dashboard');
  assert(!isRouteAuthorizedForRole('regional_officer', '/senior/dashboard'), 'Regional Officer CANNOT access /senior/dashboard');

  // 7.3 Senior Authority access rules
  assert(isRouteAuthorizedForRole('senior_authority', '/senior/dashboard'), 'Senior Authority CAN access /senior/dashboard');
  assert(!isRouteAuthorizedForRole('senior_authority', '/institution/dashboard'), 'Senior Authority CANNOT access /institution/dashboard');
  assert(!isRouteAuthorizedForRole('senior_authority', '/regional/dashboard'), 'Senior Authority CANNOT access /regional/dashboard');

  // -------------------------------------------------------------------------
  // 8. PRE-CONFIGURED DEMO PERSONAS BACKWARD COMPATIBILITY
  // -------------------------------------------------------------------------
  console.log('\n--- 8. PRE-CONFIGURED DEMO PERSONA LOGIN AUDIT ---');

  const demoInst = await authService.login('principal@pict.edu', 'demo123');
  assert(demoInst.user.role === 'institution', 'Demo Institution Login works (principal@pict.edu / demo123)');

  const demoRO = await authService.login('ragini.telange@aicte-india.org', 'demo123');
  assert(demoRO.user.role === 'regional_officer', 'Demo Regional Officer Login works (ragini.telange@aicte-india.org / demo123)');

  const demoHQ = await authService.login('j.hinganghatkar@aicte-india.org', 'demo123');
  assert(demoHQ.user.role === 'senior_authority', 'Demo Senior Authority Login works (j.hinganghatkar@aicte-india.org / demo123)');

  // Wrong demo password rejected
  try {
    await authService.login('principal@pict.edu', 'wrongpwd');
    assert(false, 'Demo account with wrong password should be rejected');
  } catch (pwdErr) {
    assert(pwdErr.message.includes('Invalid credentials') || pwdErr.message.includes('Incorrect password'), 'Demo account with wrong password rejected', pwdErr.message);
  }

  // Final Logout
  await authService.logout();

  console.log('\n====================================================================');
  console.log(`AUTHENTICATION VERIFICATION COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
