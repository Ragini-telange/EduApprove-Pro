import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { getRoleDashboardPath } from '../../types/auth';

export const RootRedirect: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // wait for session initialization
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  const targetDashboard = getRoleDashboardPath(role);
  return <Navigate to={targetDashboard} replace />;
};
