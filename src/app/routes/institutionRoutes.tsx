import React from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import { RoleGuard } from '../../components/layout/RoleGuard';
import { DashboardPage } from '../../modules/institution/pages/DashboardPage';
import { ApplicationsPage } from '../../modules/institution/pages/ApplicationsPage';
import { DocumentsPage } from '../../modules/institution/pages/DocumentsPage';
import { PassportPage } from '../../modules/institution/pages/PassportPage';
import { CompliancePage } from '../../modules/institution/pages/CompliancePage';
import { EVCPage } from '../../modules/institution/pages/EVCPage';
import { NotificationsPage } from '../../modules/institution/pages/NotificationsPage';
import { ProfilePage } from '../../modules/institution/pages/ProfilePage';
import { SettingsPage } from '../../modules/institution/pages/SettingsPage';

export const renderInstitutionRoutes = () => (
  <Route
    path="/institution"
    element={
      <RoleGuard allowedRoles={['institution']}>
        <Outlet />
      </RoleGuard>
    }
  >
    <Route index element={<Navigate to="/institution/dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="applications" element={<ApplicationsPage />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="documents/passport" element={<PassportPage />} />
    <Route path="passport" element={<PassportPage />} />
    <Route path="compliance" element={<CompliancePage />} />
    <Route path="evc" element={<EVCPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
);
