import React from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import { RoleGuard } from '../../components/layout/RoleGuard';
import {
  RegionalOfficerDashboard,
  AssignedApplications,
  ApplicationDetail,
  ScrutinyWorkspace,
  EVCManagement,
  ComplianceManagement,
  LateRequestReview,
  Notifications,
  AuditHistory,
} from '../../modules/regional/modules/regional-officer/pages';

export const renderRegionalRoutes = () => (
  <>
    {/* Canonical /regional/* routes */}
    <Route
      path="/regional"
      element={
        <RoleGuard allowedRoles={['regional_officer']}>
          <Outlet />
        </RoleGuard>
      }
    >
      <Route index element={<Navigate to="/regional/dashboard" replace />} />
      <Route path="dashboard" element={<RegionalOfficerDashboard />} />
      <Route path="applications" element={<AssignedApplications />} />
      <Route path="applications/:id" element={<ApplicationDetail />} />
      <Route path="scrutiny-workspace" element={<ScrutinyWorkspace />} />
      <Route path="scrutiny-workspace/:id" element={<ScrutinyWorkspace />} />
      <Route path="evc" element={<EVCManagement />} />
      <Route path="compliance" element={<ComplianceManagement />} />
      <Route path="late-requests" element={<LateRequestReview />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="audit-logs" element={<AuditHistory />} />
    </Route>

    {/* Backward-compatible alias /regional-officer/* */}
    <Route path="/regional-officer" element={<Navigate to="/regional/dashboard" replace />} />
    <Route path="/regional-officer/*" element={<Navigate to="/regional/dashboard" replace />} />
  </>
);
