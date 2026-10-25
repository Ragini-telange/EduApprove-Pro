import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { useAuth, UserRole } from '../../app/providers/AuthProvider';
import { getRoleDashboardPath, getRoleDisplayName } from '../../types/auth';
import { Button } from '../ui/Button';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isLoading, isAuthenticated, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Loading State while Authentication Initializes
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-aicte-navy text-white flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-1">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Restoring Statutory Session...</span>
        </div>
        <p className="text-xs text-slate-500">Verifying AICTE role clearance & cryptographic token</p>
      </div>
    );
  }

  // 2. Unauthenticated Access Protection -> Redirect to Login
  if (!isAuthenticated || !user || !role) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 3. Role-Based Route Protection -> 403 Statutory Clearance Check
  const isPermitted = allowedRoles.includes(role);

  if (!isPermitted) {
    const requiredRolesDisplay = allowedRoles.map(getRoleDisplayName).join(' or ');
    const currentRoleDisplay = getRoleDisplayName(role);
    const authorizedHome = getRoleDashboardPath(role);

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
            403 — Unauthorized Statutory Access
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied for Active Role</h2>

          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            This module is strictly restricted to <strong className="text-slate-900">{requiredRolesDisplay}</strong>.
            Your current active session is logged in as{' '}
            <strong className="text-rose-700">{currentRoleDisplay}</strong>.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Officer:</span>
              <span className="font-semibold text-slate-800">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Role:</span>
              <span className="font-semibold text-rose-700">{currentRoleDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Path:</span>
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">{location.pathname}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              onClick={() => navigate(authorizedHome)}
              className="w-full justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Authorized Dashboard</span>
            </Button>

            {/* Quick Demo Role Switcher button */}
            <Button
              variant="outline"
              onClick={() => switchRole(allowedRoles[0])}
              className="w-full justify-center text-xs text-slate-600"
            >
              <span>Switch to {allowedRoles.map(getRoleDisplayName)[0]} (Demo Mode)</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
