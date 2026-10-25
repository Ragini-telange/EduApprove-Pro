import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { RoleGuard } from './components/common/RoleGuard';
import { RegionalOfficerShell } from './modules/regional-officer/components/RegionalOfficerShell';
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
} from './modules/regional-officer/pages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Regional Officer Module (Part 2) - Protected by Statutory RoleGuard */}
            <Route
              path="/regional-officer"
              element={
                <RoleGuard allowedRoles={['regional_officer']}>
                  <RegionalOfficerShell />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
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

            {/* Default Root Redirect */}
            <Route path="/" element={<Navigate to="/regional-officer/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/regional-officer/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
