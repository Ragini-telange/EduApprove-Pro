import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types/authority';
import { useAuth as useRootAuth } from '../../../app/providers/AuthProvider';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  bureau: string;
  region?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthorized: boolean;
  canApprove: boolean;
  canReassign: boolean;
  canViewNationalData: boolean;
  isLoading: boolean;
  hasPermissionError: boolean;
  setHasPermissionError: (val: boolean) => void;
}

const DEFAULT_BUREAU_OFFICER: UserProfile = {
  id: 'usr_hq_janhavi_01',
  name: 'Dr. Janhavi Hinganghatkar',
  email: 'j.hinganghatkar@aicte-india.org',
  role: 'bureau_officer',
  designation: 'Advisor & Central Bureau Officer',
  bureau: 'Approval Bureau (HQ, New Delhi)',
  region: 'All India (National Jurisdiction)',
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_BUREAU_OFFICER,
  role: 'bureau_officer',
  setRole: () => {},
  isAuthorized: true,
  canApprove: true,
  canReassign: true,
  canViewNationalData: true,
  isLoading: false,
  hasPermissionError: false,
  setHasPermissionError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let rootAuth: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    rootAuth = useRootAuth();
  } catch {
    // Fallback if rendered outside root provider
  }

  const initialRole: UserRole =
    rootAuth?.role === 'senior_authority'
      ? 'bureau_officer'
      : rootAuth?.role === 'regional_officer'
      ? 'regional_officer'
      : rootAuth?.role === 'institution'
      ? 'institution_admin'
      : 'bureau_officer';

  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [user, setUser] = useState<UserProfile>(() => {
    if (rootAuth?.user && rootAuth.role === 'senior_authority') {
      return {
        id: rootAuth.user.id || 'usr_hq_janhavi_01',
        name: rootAuth.user.name || 'Dr. Janhavi Hinganghatkar',
        email: rootAuth.user.email || 'j.hinganghatkar@aicte-india.org',
        role: 'bureau_officer',
        designation: 'Advisor & Central Bureau Officer',
        bureau: 'Approval Bureau (HQ, New Delhi)',
        region: 'All India (National Jurisdiction)',
      };
    }
    return DEFAULT_BUREAU_OFFICER;
  });
  const [hasPermissionError, setHasPermissionError] = useState(
    rootAuth ? rootAuth.role !== 'senior_authority' : false
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (rootAuth?.role) {
      if (rootAuth.role === 'senior_authority') {
        setRoleState('bureau_officer');
        setUser({
          id: rootAuth.user?.id || 'usr_hq_janhavi_01',
          name: rootAuth.user?.name || 'Dr. Janhavi Hinganghatkar',
          email: rootAuth.user?.email || 'j.hinganghatkar@aicte-india.org',
          role: 'bureau_officer',
          designation: 'Advisor & Central Bureau Officer',
          bureau: 'Approval Bureau (HQ, New Delhi)',
          region: 'All India (National Jurisdiction)',
        });
        setHasPermissionError(false);
      } else if (rootAuth.role === 'regional_officer') {
        setRoleState('regional_officer');
        setHasPermissionError(true);
      } else if (rootAuth.role === 'institution') {
        setRoleState('institution_admin');
        setHasPermissionError(true);
      }
    }
  }, [rootAuth?.role, rootAuth?.user]);

  const setRole = (newRole: UserRole) => {
    setIsLoading(true);
    setRoleState(newRole);
    if (newRole === 'bureau_officer') {
      setUser(DEFAULT_BUREAU_OFFICER);
      setHasPermissionError(false);
    } else if (newRole === 'regional_officer') {
      setUser({
        id: 'usr_ro_ragini_02',
        name: 'Ragini Telange (Regional Officer)',
        email: 'r.telange@aicte-india.org',
        role: 'regional_officer',
        designation: 'Regional Officer',
        bureau: 'Western Regional Office (WRO)',
        region: 'Western Region (Maharashtra & Goa)',
      });
      setHasPermissionError(false);
    } else if (newRole === 'institution_admin') {
      setUser({
        id: 'usr_inst_sakshi_03',
        name: 'Sakshi Sharma (Institution Admin)',
        email: 'principal@coep.ac.in',
        role: 'institution_admin',
        designation: 'College Principal / Registrar',
        bureau: 'Affiliated Technical Institution',
        region: 'Western Region',
      });
      setHasPermissionError(true);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 250);
  };

  const isAuthorized = role === 'bureau_officer';
  const canApprove = role === 'bureau_officer';
  const canReassign = role === 'bureau_officer';
  const canViewNationalData = role === 'bureau_officer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        isAuthorized,
        canApprove,
        canReassign,
        canViewNationalData,
        isLoading,
        hasPermissionError,
        setHasPermissionError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
