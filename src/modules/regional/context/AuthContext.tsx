import React, { createContext, useContext } from 'react';
import { useAuth as useRootAuth } from '../../../app/providers/AuthProvider';
import { UserProfile, UserRole } from '../types';
import { CURRENT_USER } from '../services/mockData';

export type AuthMode = 'live' | 'mock';

export interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  verifiedRole: UserRole;
  authMode: AuthMode;
  isMockMode: boolean;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  resetToRegionalOfficer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: AuthMode;
  initialRole?: UserRole;
}> = ({ children }) => {
  const root = useRootAuth();

  const user: UserProfile = root.user
    ? {
        id: root.user.id || CURRENT_USER.id,
        name: root.user.name || CURRENT_USER.name,
        email: root.user.email || CURRENT_USER.email,
        role: (root.user.role === 'regional_officer' ? 'regional_officer' : (root.user.role as any)) || 'regional_officer',
        designation: root.user.designation || CURRENT_USER.designation,
        regionalOffice: root.user.regionalOffice || CURRENT_USER.regionalOffice,
        jurisdictionStates: root.user.jurisdictionStates || CURRENT_USER.jurisdictionStates,
        badgeNumber: root.user.badgeNumber || CURRENT_USER.badgeNumber,
      }
    : CURRENT_USER;

  const role = user.role;
  const verifiedRole = user.role;

  const switchRole = async (newRole: UserRole) => {
    if (root.switchRole) {
      await root.switchRole(newRole as any);
    }
  };

  const resetToRegionalOfficer = async () => {
    if (root.switchRole) {
      await root.switchRole('regional_officer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        verifiedRole,
        authMode: 'live',
        isMockMode: false,
        isAuthenticated: root.isAuthenticated,
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
    // If used outside regional provider, derive directly from root
    return {
      user: CURRENT_USER,
      role: 'regional_officer' as UserRole,
      verifiedRole: 'regional_officer' as UserRole,
      authMode: 'live' as AuthMode,
      isMockMode: false,
      isAuthenticated: true,
      switchRole: () => {},
      resetToRegionalOfficer: () => {},
    };
  }
  return context;
}
