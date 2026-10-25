import { AuthenticatedUser, AuthResponse, LoginCredentials, Institution } from '../types/auth';

const AUTH_STORAGE_KEY = 'aicte_smartassist_institution_auth';

/**
 * Temporary Mock Institution Development Data
 * (Isolated from UI as required for Phase 1)
 */
export const MOCK_INSTITUTION: Institution = {
  id: 'INS001',
  institutionCode: 'AICTE-INS-10245',
  name: 'Government College of Engineering',
  email: 'principal@gcepune.ac.in',
  category: 'Engineering & Technology',
  institutionType: 'Government',
};

// Recognized test identifiers for development
const VALID_IDENTIFIERS = [
  'INS001',
  'AICTE-INS-10245',
  'principal@gcepune.ac.in',
  'admin@gcepune.ac.in',
];

const VALID_PASSWORDS = ['aicte@2026', 'admin123', 'password123'];

/**
 * Institution Authentication Service
 * Currently using temporary mock authentication for Phase 1.
 * Ready for future seamless API integration.
 */
export const authService = {
  /**
   * Mock login for Institution Admin
   */
  async loginInstitution(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate real-world asynchronous authentication latency
    await new Promise((resolve) => setTimeout(resolve, 700));

    const cleanId = credentials.identifier.trim().toLowerCase();
    const isIdValid = VALID_IDENTIFIERS.some((v) => v.toLowerCase() === cleanId);
    const isPassValid = VALID_PASSWORDS.includes(credentials.password);

    if (!isIdValid || !isPassValid) {
      throw new Error(
        'Invalid Institution ID/Email or Password. Please verify your institutional credentials.'
      );
    }

    const authenticatedUser: AuthenticatedUser = {
      id: MOCK_INSTITUTION.id,
      institutionCode: MOCK_INSTITUTION.institutionCode,
      name: MOCK_INSTITUTION.name,
      email: MOCK_INSTITUTION.email,
      role: 'institution_admin',
      token: `mock-jwt-token-${Date.now()}-${MOCK_INSTITUTION.id}`,
      loginTime: new Date().toISOString(),
    };

    const response: AuthResponse = {
      user: authenticatedUser,
      token: authenticatedUser.token,
    };

    // Store in browser storage (localStorage or sessionStorage)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    } catch {
      // In case localStorage is blocked in private browsing
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    }

    return response;
  },

  /**
   * Log out institution user and clear session
   */
  logoutInstitution(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Get currently authenticated institution user, or null if unauthenticated
   */
  getCurrentInstitution(): AuthenticatedUser | null {
    try {
      const stored =
        localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AuthenticatedUser;
    } catch {
      return null;
    }
  },

  /**
   * Verify whether the institution is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentInstitution() !== null;
  },
};
