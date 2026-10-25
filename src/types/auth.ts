// ============================================================================
// AICTE SMARTASSIST — AUTHORITATIVE AUTHENTICATION CONTRACTS
// Canonical Statutory Roles: institution | regional_officer | senior_authority
// ============================================================================

export type UserRole = 'institution' | 'regional_officer' | 'senior_authority';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  regionalOffice: string;
  jurisdictionStates?: string[];
  institutionId?: string;
  institutionCode?: string;
  badgeNumber?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

/**
 * Normalizes any role variation into the canonical statutory roles:
 * - 'institution'
 * - 'regional_officer'
 * - 'senior_authority'
 */
export function normalizeRole(rawRole: string | undefined | null): UserRole {
  if (!rawRole) return 'institution';
  const clean = rawRole.toLowerCase().trim();
  if (
    clean === 'institution' ||
    clean === 'institution_admin' ||
    clean === 'college' ||
    clean === 'principal'
  ) {
    return 'institution';
  }
  if (
    clean === 'regional_officer' ||
    clean === 'regional' ||
    clean === 'ro' ||
    clean === 'scrutiny_officer'
  ) {
    return 'regional_officer';
  }
  if (
    clean === 'senior_authority' ||
    clean === 'bureau_officer' ||
    clean === 'bureau' ||
    clean === 'hq' ||
    clean === 'advisor' ||
    clean === 'chairman'
  ) {
    return 'senior_authority';
  }
  return 'institution';
}

/**
 * Maps a verified role to its statutory landing dashboard route
 */
export function getRoleDashboardPath(role: UserRole): string {
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

/**
 * Human-readable official designation title for each role
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'institution':
      return 'Institution Admin';
    case 'regional_officer':
      return 'Regional Officer';
    case 'senior_authority':
      return 'Senior Authority / Bureau Officer';
    default:
      return 'Authenticated User';
  }
}

/**
 * Strict role-based route authorization checker:
 * - Institution routes (/institution/*) only accessible to role 'institution'
 * - Regional routes (/regional/*) only accessible to role 'regional_officer'
 * - Senior routes (/senior/*) only accessible to role 'senior_authority'
 */
export function isRouteAuthorizedForRole(role: UserRole, pathname: string): boolean {
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
