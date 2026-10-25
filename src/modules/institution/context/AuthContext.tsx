import React, { createContext, useContext } from 'react';
import { useAuth as useRootAuth } from '../../../app/providers/AuthProvider';
import { AuthenticatedUser, LoginCredentials } from '../types/auth';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const root = useRootAuth();

  const user: AuthenticatedUser | null = root.user
    ? {
        id: root.user.institutionId || root.user.id || 'inst_wro_01',
        institutionCode: root.user.institutionCode || '1-4293811',
        name: root.user.name || 'Pune Institute of Computer Technology (PICT)',
        email: root.user.email || 'principal@pict.edu',
        role: 'institution_admin',
        token: 'statutory-auth-jwt-token',
        loginTime: new Date().toISOString(),
      }
    : null;

  const login = async (credentials: LoginCredentials) => {
    await root.login(credentials.identifier, credentials.password);
  };

  const logout = () => {
    root.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: root.isAuthenticated,
        isLoading: root.isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
