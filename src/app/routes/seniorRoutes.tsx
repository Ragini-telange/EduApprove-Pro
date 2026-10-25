import React from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import { RoleGuard } from '../../components/layout/RoleGuard';
import { AuthorityDashboard } from '../../modules/senior/pages/authority/AuthorityDashboard';

export const renderSeniorRoutes = () => (
  <>
    {/* Canonical /senior/* routes */}
    <Route
      path="/senior"
      element={
        <RoleGuard allowedRoles={['senior_authority']}>
          <Outlet />
        </RoleGuard>
      }
    >
      <Route index element={<Navigate to="/senior/dashboard" replace />} />
      <Route path="dashboard" element={<AuthorityDashboard />} />
      <Route path="regional-map" element={<Navigate to="/senior/dashboard?tab=analytics" replace />} />
      <Route path="applications" element={<Navigate to="/senior/dashboard?tab=applications" replace />} />
      <Route path="escalations" element={<Navigate to="/senior/dashboard?tab=action_centre" replace />} />
      <Route path="reports" element={<Navigate to="/senior/dashboard?tab=reports" replace />} />
      <Route path="evc" element={<Navigate to="/senior/dashboard?tab=evc_monitoring" replace />} />
      <Route path="compliance" element={<Navigate to="/senior/dashboard?tab=compliance" replace />} />
      <Route path="audit-logs" element={<Navigate to="/senior/dashboard?tab=audit_logs" replace />} />
    </Route>

    {/* Backward-compatible alias /authority/* */}
    <Route path="/authority" element={<Navigate to="/senior/dashboard" replace />} />
    <Route path="/authority/*" element={<Navigate to="/senior/dashboard" replace />} />
  </>
);
