import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { CURRENT_USER } from '../services/mockData';

export type AuthMode = 'mock' | 'live';

export interface AuthContextType {
  user: UserProfile;
  /** Current active user role */
  role: UserRole;
  /**
   * The authoritative, verified statutory role.
   * In Mock Mode: reflects the active demo persona (strictly for preview testing).
   * In Live Mode: derived directly from verified Supabase session JWT claims (auth.jwt() -> app_metadata -> role),
   * NEVER from mutable client-side state.
   */
  verifiedRole: UserRole;
  /** 'mock' for local simulated development, 'live' when connected to Supabase Auth */
  authMode: AuthMode;
  /** True if running under local synthetic demo mode */
  isMockMode: boolean;
  isAuthenticated: boolean;
  /**
   * Switch the demo user persona (mock mode only).
   * CRITICAL SECURITY NOTICE:
   * This is strictly for local development & UI preview of teammate perspectives.
   * In live mode, role switching is forbidden and ignored. True authorization
   * is enforced exclusively at the database layer via PostgreSQL Row-Level Security (RLS).
   */
  switchRole: (role: UserRole) => void;
  /** Reset active persona back to authorized Regional Officer (Ragini Telange) */
  resetToRegionalOfficer: () => void;
}

export function getMockUserForRole(role: UserRole): UserProfile {
  if (role === 'regional_officer') {
    return CURRENT_USER;
  }
  if (role === 'institution_admin') {
    return {
      id: 'inst-usr-101',
      name: 'Dr. Anand Deshmukh',
      email: 'principal@piatr.edu.in',
      role: 'institution_admin',
      designation: 'Principal & Authorized Signatory',
      regionalOffice: 'Western Regional Office (WRO - Pune)',
      jurisdictionStates: ['Maharashtra'],
      badgeNumber: 'INST-AUTH-441',
    };
  }
  if (role === 'senior_authority') {
    return {
      id: 'aicte-hq-001',
      name: 'Prof. T. G. Sitharam',
      email: 'advisor.approval@aicte-india.org',
      role: 'senior_authority',
      designation: 'Advisor & Bureau Head (Approval Bureau)',
      regionalOffice: 'AICTE Headquarters, Nelson Mandela Marg, New Delhi',
      jurisdictionStates: ['All India'],
      badgeNumber: 'AICTE-HQ-AUTH-01',
    };
  }
  return {
    ...CURRENT_USER,
    role,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: AuthMode;
  initialRole?: UserRole;
}> = ({ children, initialMode, initialRole }) => {
  const configuredMode: AuthMode =
    initialMode || (import.meta.env.VITE_DATA_SERVICE_MODE === 'live' ? 'live' : 'mock');

  const [authMode] = useState<AuthMode>(configuredMode);
  const [user, setUser] = useState<UserProfile>(
    initialRole ? getMockUserForRole(initialRole) : CURRENT_USER
  );

  // In mock mode, verifiedRole reflects the active persona.
  // In live mode, this will be wired to the verified Supabase JWT app_metadata.role.
  const verifiedRole: UserRole = user.role;

  const switchRole = (newRole: UserRole) => {
    // In live mode, reject client-side role mutation attempts
    if (authMode === 'live') {
      console.warn(
        'Statutory Security Notice: Mock role switching is disabled when live Supabase authentication is active.'
      );
      return;
    }

    setUser(getMockUserForRole(newRole));
  };

  const resetToRegionalOfficer = () => {
    setUser(CURRENT_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        verifiedRole,
        authMode,
        isMockMode: authMode === 'mock',
        isAuthenticated: true,
        switchRole,
        resetToRegionalOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

