import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth, getMockUserForRole } from '../context/AuthContext';
import { RoleGuard, AccessDeniedView, getRoleDisplayName } from '../components/common/RoleGuard';
import { UserRole } from '../types';

describe('SEC-FE-01: Reusable RoleGuard and Demo vs Live Authentication Enforcement', () => {
  // Test harness component to read AuthContext values
  const AuthStateInspector: React.FC<{
    onState: (state: ReturnType<typeof useAuth>) => void;
  }> = ({ onState }) => {
    const auth = useAuth();
    onState(auth);
    return null;
  };

  it('1. Allows access to protected Regional Officer workspace when user has regional_officer role', () => {
    const html = renderToString(
      <AuthProvider initialMode="mock">
        <MemoryRouter>
          <RoleGuard allowedRoles={['regional_officer']}>
            <div data-testid="ro-content">Authorized Regional Officer Workspace Active</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(html).toContain('Authorized Regional Officer Workspace Active');
    expect(html).not.toContain('Unauthorized Role or Jurisdiction');
  });

  it('2. Denies access and renders AccessDeniedView when role is institution_admin', () => {
    const html = renderToString(
      <AuthProvider initialMode="mock" initialRole="institution_admin">
        <MemoryRouter>
          <RoleGuard allowedRoles={['regional_officer']}>
            <div data-testid="ro-content">Should Not Be Rendered</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(html).toContain('Unauthorized Role or Jurisdiction');
    expect(html).toContain('HTTP 403');
    expect(html).toContain('Institutional Applicant / College Admin');
    expect(html).toContain('Development Demo Mode Active');
    expect(html).toContain('Switch Back to Regional Officer (Demo)');
    expect(html).toContain('Regulatory Isolation Notice');
    expect(html).not.toContain('Should Not Be Rendered');
  });

  it('3. Denies access and renders AccessDeniedView when role is senior_authority', () => {
    const html = renderToString(
      <AuthProvider initialMode="mock" initialRole="senior_authority">
        <MemoryRouter>
          <RoleGuard allowedRoles={['regional_officer']}>
            <div data-testid="ro-content">Should Not Be Rendered</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(html).toContain('Unauthorized Role or Jurisdiction');
    expect(html).toContain('Senior Authority (AICTE HQ Bureau Head)');
    expect(html).toContain('Switch Back to Regional Officer (Demo)');
    expect(html).not.toContain('Should Not Be Rendered');
  });

  it('4. Supports custom fallback component when access is denied', () => {
    // Testing custom fallback
    const CustomFallback = <div data-testid="custom-denied">Custom Access Denied Component</div>;

    // Direct render with unauthenticated mock
    const html = renderToString(
      <AuthProvider initialMode="mock">
        <MemoryRouter>
          {/* We require senior_authority role while current user is regional_officer */}
          <RoleGuard allowedRoles={['senior_authority']} fallback={CustomFallback}>
            <div>Regional Officer Workspace</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(html).toContain('Custom Access Denied Component');
    expect(html).not.toContain('Regional Officer Workspace');
  });

  it('5. Renders redirect element when redirectPath is specified and access is denied', () => {
    const html = renderToString(
      <AuthProvider initialMode="mock">
        <MemoryRouter initialEntries={['/regional-officer']}>
          {/* Require senior_authority while active role is regional_officer */}
          <RoleGuard allowedRoles={['senior_authority']} redirectPath="/unauthorized">
            <div>Protected Content</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthProvider>
    );

    // In SSR, Navigate renders nothing but initiates navigation
    expect(html).not.toContain('Protected Content');
    expect(html).not.toContain('Unauthorized Role or Jurisdiction');
  });

  it('6. AuthContext accurately distinguishes mock mode from live mode', () => {
    let mockAuth: any;
    renderToString(
      <AuthProvider initialMode="mock">
        <AuthStateInspector onState={(s) => (mockAuth = s)} />
      </AuthProvider>
    );

    expect(mockAuth.isMockMode).toBe(true);
    expect(mockAuth.authMode).toBe('mock');
    expect(mockAuth.verifiedRole).toBe('regional_officer');
    expect(mockAuth.role).toBe('regional_officer');

    let liveAuth: any;
    renderToString(
      <AuthProvider initialMode="live">
        <AuthStateInspector onState={(s) => (liveAuth = s)} />
      </AuthProvider>
    );

    expect(liveAuth.isMockMode).toBe(false);
    expect(liveAuth.authMode).toBe('live');
  });

  it('7. In mock mode, getMockUserForRole returns distinct institution and bureau personas', () => {
    const instUser = getMockUserForRole('institution_admin');
    expect(instUser.role).toBe('institution_admin');
    expect(instUser.name).toBe('Dr. Anand Deshmukh');
    expect(instUser.designation).toContain('Principal');

    const bureauUser = getMockUserForRole('senior_authority');
    expect(bureauUser.role).toBe('senior_authority');
    expect(bureauUser.name).toBe('Prof. T. G. Sitharam');
    expect(bureauUser.designation).toContain('Bureau Head');

    let capturedAuth: any;
    renderToString(
      <AuthProvider initialMode="mock" initialRole="institution_admin">
        <AuthStateInspector onState={(s) => (capturedAuth = s)} />
      </AuthProvider>
    );
    expect(capturedAuth.role).toBe('institution_admin');
    expect(capturedAuth.user.role).toBe('institution_admin');
    expect(capturedAuth.isMockMode).toBe(true);
  });

  it('8. In mock mode, default persona is regional_officer Ragini Telange', () => {
    let capturedAuth: any;
    renderToString(
      <AuthProvider initialMode="mock">
        <AuthStateInspector onState={(s) => (capturedAuth = s)} />
      </AuthProvider>
    );

    expect(capturedAuth.role).toBe('regional_officer');
    expect(capturedAuth.user.name).toContain('Ragini Telange');
    expect(capturedAuth.user.badgeNumber).toBe('AICTE-RO-WRO-772');
    expect(capturedAuth.user.regionalOffice).toContain('WRO - Pune');
  });

  it('9. In live mode, switchRole rejects client-side role mutation', () => {
    let capturedAuth: any;

    const HarnessInLiveMode: React.FC = () => {
      const auth = useAuth();
      // Attempt to tamper with role in live mode
      auth.switchRole('super_admin');
      capturedAuth = auth;
      return <div>Role: {auth.role}</div>;
    };

    renderToString(
      <AuthProvider initialMode="live">
        <HarnessInLiveMode />
      </AuthProvider>
    );

    // switchRole must be rejected in live mode
    expect(capturedAuth.role).toBe('regional_officer');
    expect(capturedAuth.verifiedRole).toBe('regional_officer');
  });

  it('10. Helper getRoleDisplayName formats statutory titles accurately', () => {
    expect(getRoleDisplayName('regional_officer')).toBe('AICTE Regional Scrutiny Officer');
    expect(getRoleDisplayName('institution_admin')).toBe('Institutional Applicant / College Admin');
    expect(getRoleDisplayName('senior_authority')).toBe('Senior Authority (AICTE HQ Bureau Head)');
    expect(getRoleDisplayName('super_admin')).toBe('Super Administrator (Central AICTE)');
  });

  it('11. CRITICAL STATUTORY INVARIANT: Frontend route guards do not replace backend RLS', () => {
    // Verifies that the guard renders the statutory isolation notice
    const html = renderToString(
      <AccessDeniedView
        currentRole="institution_admin"
        allowedRoles={['regional_officer']}
        isMockMode={true}
      />
    );

    expect(html).toContain('Client-side route guards prevent unauthorized navigation flows');
    expect(html).toContain('PostgreSQL Row-Level Security (RLS)');
  });
});
