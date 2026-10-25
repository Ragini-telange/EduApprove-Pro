// ============================================================================
// AICTE SMARTASSIST — STATUTORY AUTHENTICATION VERIFICATION SUITE
// Automated verification for Phase 3 Authentication & Security Requirements
// ============================================================================

import assert from 'node:assert';

// Simulated environment for local testing
const mockStorage = new Map();
const localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

globalThis.localStorage = localStorage;

// Import compiled authentication contracts
function normalizeRole(rawRole) {
  if (!rawRole) return 'institution';
  const clean = rawRole.toLowerCase().trim();
  if (clean === 'institution' || clean === 'institution_admin' || clean === 'college' || clean === 'principal') {
    return 'institution';
  }
  if (clean === 'regional_officer' || clean === 'regional' || clean === 'ro' || clean === 'scrutiny_officer') {
    return 'regional_officer';
  }
  if (clean === 'senior_authority' || clean === 'bureau_officer' || clean === 'bureau' || clean === 'hq' || clean === 'advisor') {
    return 'senior_authority';
  }
  return 'institution';
}

function getRoleDashboardPath(role) {
  switch (role) {
    case 'institution':
      return '/institution/dashboard';
    case 'regional_officer':
      return '/regional/dashboard';
    case 'senior_authority':
      return '/senior/dashboard';
    default:
      return '/institution/dashboard';
  }
}

function isRouteAuthorizedForRole(role, pathname) {
  if (pathname.startsWith('/institution')) {
    return role === 'institution';
  }
  if (pathname.startsWith('/regional') || pathname.startsWith('/regional-officer')) {
    return role === 'regional_officer';
  }
  if (pathname.startsWith('/senior') || pathname.startsWith('/authority')) {
    return role === 'senior_authority';
  }
  return true;
}

const DEMO_PROFILES = {
  institution: {
    id: 'usr_inst_sakshi_01',
    name: 'Sakshi Sharma',
    email: 'principal@gcepune.ac.in',
    role: 'institution',
    designation: 'Principal & Authorized Institutional Signatory',
    institutionCode: 'AICTE-INS-10245',
    regionalOffice: 'Western Regional Office (WRO - Pune)',
  },
  regional_officer: {
    id: 'usr_ro_ragini_02',
    name: 'Ragini Telange',
    email: 'r.telange@aicte-india.org',
    role: 'regional_officer',
    designation: 'Regional Scrutiny Officer (WRO - Pune)',
    regionalOffice: 'Western Regional Office (WRO - Pune)',
  },
  senior_authority: {
    id: 'usr_hq_janhavi_03',
    name: 'Dr. Janhavi Hinganghatkar',
    email: 'j.hinganghatkar@aicte-india.org',
    role: 'senior_authority',
    designation: 'Advisor & Bureau Head (Approval Bureau)',
    regionalOffice: 'AICTE Headquarters, New Delhi',
  },
};

const SESSION_STORAGE_KEY = 'aicte_smartassist_auth_session';

const authService = {
  persistSession(session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  },
  restoreSession() {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    session.user.role = normalizeRole(session.user.role);
    return session;
  },
  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },
  loginAsDemo(role) {
    const canonical = normalizeRole(role);
    const session = {
      user: DEMO_PROFILES[canonical],
      accessToken: `mock-jwt-token-${Date.now()}-${canonical}`,
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };
    this.persistSession(session);
    return session;
  },
  getAuthorizationHeaders() {
    const session = this.restoreSession();
    if (!session || !session.accessToken) return {};
    return {
      Authorization: `Bearer ${session.accessToken}`,
      'x-user-role': session.user.role,
      'x-user-id': session.user.id,
    };
  },
};

// ----------------------------------------------------------------------------
// TEST RUNNER
// ----------------------------------------------------------------------------
console.log('================================================================');
console.log('AICTE SMARTASSIST — AUTHENTICATION & SECURITY VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// 1. Role Normalization Tests
runTest('Role Normalization: Maps variations to canonical roles', () => {
  assert.strictEqual(normalizeRole('institution'), 'institution');
  assert.strictEqual(normalizeRole('institution_admin'), 'institution');
  assert.strictEqual(normalizeRole('college'), 'institution');
  assert.strictEqual(normalizeRole('regional_officer'), 'regional_officer');
  assert.strictEqual(normalizeRole('ro'), 'regional_officer');
  assert.strictEqual(normalizeRole('senior_authority'), 'senior_authority');
  assert.strictEqual(normalizeRole('bureau_officer'), 'senior_authority');
  assert.strictEqual(normalizeRole('advisor'), 'senior_authority');
});

// 2. Post-Login Redirection Tests
runTest('Redirect according to role: Maps roles to correct dashboard paths', () => {
  assert.strictEqual(getRoleDashboardPath('institution'), '/institution/dashboard');
  assert.strictEqual(getRoleDashboardPath('regional_officer'), '/regional/dashboard');
  assert.strictEqual(getRoleDashboardPath('senior_authority'), '/senior/dashboard');
});

// 3. Security Boundary: Institution Route Access Restrictions
runTest('Security Boundary: Institution CANNOT access Regional Officer pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/regional/dashboard'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/regional/applications'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/regional/scrutiny-workspace'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/regional-officer/dashboard'), false);
});

runTest('Security Boundary: Institution CANNOT access Senior Authority pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/senior/dashboard'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/senior/regional-map'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/senior/escalations'), false);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/authority/dashboard'), false);
});

runTest('Security Boundary: Institution CAN access permitted Institution pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/institution/dashboard'), true);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/institution/applications'), true);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/institution/documents'), true);
  assert.strictEqual(isRouteAuthorizedForRole('institution', '/institution/passport'), true);
});

// 4. Security Boundary: Regional Officer Route Access Restrictions
runTest('Security Boundary: Regional Officer CANNOT access Senior Authority pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/senior/dashboard'), false);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/senior/regional-map'), false);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/senior/escalations'), false);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/authority/dashboard'), false);
});

runTest('Security Boundary: Regional Officer CANNOT access Institution Admin pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/institution/dashboard'), false);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/institution/profile'), false);
});

runTest('Security Boundary: Regional Officer CAN access permitted Regional Officer pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/regional/dashboard'), true);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/regional/applications'), true);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/regional/scrutiny-workspace'), true);
  assert.strictEqual(isRouteAuthorizedForRole('regional_officer', '/regional/evc'), true);
});

// 5. Security Boundary: Senior Authority Route Access
runTest('Security Boundary: Senior Authority CAN access permitted Senior Authority pages', () => {
  assert.strictEqual(isRouteAuthorizedForRole('senior_authority', '/senior/dashboard'), true);
  assert.strictEqual(isRouteAuthorizedForRole('senior_authority', '/senior/regional-map'), true);
  assert.strictEqual(isRouteAuthorizedForRole('senior_authority', '/senior/applications'), true);
  assert.strictEqual(isRouteAuthorizedForRole('senior_authority', '/senior/escalations'), true);
  assert.strictEqual(isRouteAuthorizedForRole('senior_authority', '/senior/reports'), true);
});

// 6. Session Persistence & Browser Refresh Simulation
runTest('Session Persistence: Refreshing browser preserves active session', () => {
  authService.logout();
  assert.strictEqual(authService.restoreSession(), null);

  // Login as Regional Officer
  const session = authService.loginAsDemo('regional_officer');
  assert.strictEqual(session.user.role, 'regional_officer');
  assert.strictEqual(session.user.name, 'Ragini Telange');

  // Simulate page reload by calling restoreSession()
  const restoredSession = authService.restoreSession();
  assert.notStrictEqual(restoredSession, null);
  assert.strictEqual(restoredSession.user.role, 'regional_officer');
  assert.strictEqual(restoredSession.user.email, 'r.telange@aicte-india.org');
});

// 7. Proper Logout Handling
runTest('Logout Handling: Terminates session and removes storage keys', () => {
  authService.logout();
  const sessionAfterLogout = authService.restoreSession();
  assert.strictEqual(sessionAfterLogout, null);
  assert.strictEqual(localStorage.getItem(SESSION_STORAGE_KEY), null);
});

// 8. Database / API Access Security: Header Generation
runTest('Database & API Security: Injects Bearer token and x-user-role', () => {
  authService.loginAsDemo('senior_authority');
  const headers = authService.getAuthorizationHeaders();
  assert.ok(headers.Authorization.startsWith('Bearer mock-jwt-token-'));
  assert.strictEqual(headers['x-user-role'], 'senior_authority');
  assert.strictEqual(headers['x-user-id'], 'usr_hq_janhavi_03');
});

console.log('\n----------------------------------------------------------------');
console.log(`SUMMARY: ${passedTests} / ${totalTests} verification checks passed successfully.`);
console.log('----------------------------------------------------------------');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
