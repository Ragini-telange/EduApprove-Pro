import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, RotateCcw, AlertTriangle, Scale } from 'lucide-react';

export interface RoleGuardProps {
  /**
   * The list of authorized roles permitted to access this route tree.
   * Defaults to ['regional_officer'] for the Regional Officer module.
   */
  allowedRoles?: UserRole[];
  /** Optional custom fallback component to render when access is denied */
  fallback?: React.ReactNode;
  /** Optional redirect destination path instead of rendering the Access Denied screen */
  redirectPath?: string;
  /** Optional nested children; if omitted, renders <Outlet /> */
  children?: React.ReactNode;
}

/**
 * Helper to display human-readable role labels
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'regional_officer':
      return 'AICTE Regional Scrutiny Officer';
    case 'institution_admin':
      return 'Institutional Applicant / College Admin';
    case 'senior_authority':
      return 'Senior Authority (AICTE HQ Bureau Head)';
    case 'super_admin':
      return 'Super Administrator (Central AICTE)';
    default:
      return role;
  }
}

/**
 * AccessDeniedView:
 * Renders an authoritative statutory access-restricted screen.
 *
 * CRITICAL REGULATORY NOTICE:
 * Client-side route guarding is solely for user experience (UX) and navigation safety.
 * True statutory security and data isolation are enforced exclusively by PostgreSQL
 * Row-Level Security (RLS) policies on the Supabase database backend.
 */
export const AccessDeniedView: React.FC<{
  currentRole: UserRole;
  allowedRoles: UserRole[];
  isMockMode: boolean;
  onRestoreOfficer?: () => void;
}> = ({ currentRole, allowedRoles, isMockMode, onRestoreOfficer }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <div className="max-w-xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Statutory Emblem Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                AICTE Statutory RBAC Restriction
              </span>
              <span className="text-[10px] font-mono text-slate-500">HTTP 403</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
              Unauthorized Role or Jurisdiction
            </h1>
          </div>
        </div>

        {/* Diagnostic Explanation */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            You attempted to access a protected workspace restricted exclusively to{' '}
            <strong className="text-white">
              {allowedRoles.map(getRoleDisplayName).join(' or ')}
            </strong>.
          </p>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Active Persona:</span>
              <span className="text-amber-400 font-semibold">{getRoleDisplayName(currentRole)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Internal Role Token:</span>
              <span className="text-slate-200">'{currentRole}'</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Permitted Route Roles:</span>
              <span className="text-emerald-400">[{allowedRoles.map((r) => `'${r}'`).join(', ')}]</span>
            </div>
          </div>

          {isMockMode && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-300">Development Demo Mode Active:</strong>
                <p className="mt-0.5 text-amber-200/80">
                  You switched your role persona using the sidebar demo switcher. In live production,
                  roles are cryptographically verified via Supabase JWT session claims and cannot be altered by client state.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {isMockMode && onRestoreOfficer && (
            <button
              type="button"
              onClick={onRestoreOfficer}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Switch Back to Regional Officer (Demo)</span>
            </button>
          )}

          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <span>Return to Home</span>
          </a>
        </div>

        {/* Statutory Enforcement Notice */}
        <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Regulatory Isolation Notice:</strong> Client-side route guards prevent unauthorized
            navigation flows. Confidential application documents and statutory decisions are strictly protected
            at the database tier by PostgreSQL Row-Level Security (RLS).
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * RoleGuard:
 * Reusable route-level access guard.
 *
 * Features:
 * 1. Inspects the current user's authoritative role.
 * 2. In live mode: guarantees verification against `verifiedRole` (derived from signed JWT),
 *    disallowing client-side state manipulation.
 * 3. In mock/demo mode: blocks unauthorized access and displays a recovery button to switch back.
 * 4. Supports optional custom fallback UI or programmatic redirects.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles = ['regional_officer'],
  fallback,
  redirectPath,
  children,
}) => {
  const { user, verifiedRole, authMode, isMockMode, resetToRegionalOfficer, switchRole } = useAuth();

  // In live mode, ensure we verify against authoritative session role, never user-editable state
  const effectiveRole: UserRole = authMode === 'live' ? verifiedRole : user.role;

  const isAuthorized = allowedRoles.includes(effectiveRole);

  if (isAuthorized) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Denied access handling
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleRestore = () => {
    if (resetToRegionalOfficer) {
      resetToRegionalOfficer();
    } else {
      switchRole('regional_officer');
    }
  };

  return (
    <AccessDeniedView
      currentRole={effectiveRole}
      allowedRoles={allowedRoles}
      isMockMode={isMockMode}
      onRestoreOfficer={handleRestore}
    />
  );
};

export default RoleGuard;
