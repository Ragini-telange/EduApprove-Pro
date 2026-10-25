import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, AuthSession, normalizeRole } from '../../types/auth';
import { authService, SignUpParams } from '../../services/auth/authService';

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canApprove: boolean;
  canReassign: boolean;
  canViewNationalData: boolean;
  login: (emailOrId: string, password?: string) => Promise<AuthSession>;
  signUp: (params: SignUpParams) => Promise<AuthSession>;
  loginAsDemo: (role: UserRole) => Promise<AuthSession>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount (proper session restoration)
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const restored = await authService.restoreSession();
        if (isMounted) {
          if (restored) {
            setUser(restored.user);
          } else {
            // Unauthenticated by default until user signs in or registers
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session initialization warning:', err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (emailOrId: string, password?: string): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authService.login(emailOrId, password);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: SignUpParams): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authService.signUp(params);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (targetRole: UserRole): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authService.loginAsDemoPersona(targetRole);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole): Promise<void> => {
    await loginAsDemo(normalizeRole(newRole));
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = user?.role ? normalizeRole(user.role) : null;
  const isSenior = currentRole === 'senior_authority';

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!currentRole) return false;
    return allowedRoles.includes(currentRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isAuthenticated: !!user,
        isLoading,
        canApprove: isSenior,
        canReassign: isSenior,
        canViewNationalData: isSenior,
        login,
        signUp,
        loginAsDemo,
        logout,
        switchRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { UserRole, UserProfile };
