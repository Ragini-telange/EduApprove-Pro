import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Verifying Institutional Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/institution/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
