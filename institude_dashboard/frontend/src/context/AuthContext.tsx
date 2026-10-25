import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthenticatedUser, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';

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
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state on mount
    const current = authService.getCurrentInstitution();
    setUser(current);
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = await authService.loginInstitution(credentials);
    setUser(res.user);
  };

  const logout = () => {
    authService.logoutInstitution();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
