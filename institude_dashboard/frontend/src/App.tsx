import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InstitutionLayout } from './components/layout/InstitutionLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { PassportPage } from './pages/PassportPage';
import { CompliancePage } from './pages/CompliancePage';
import { EVCPage } from './pages/EVCPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/institution/login" element={<LoginPage />} />

            {/* Protected Institution Routes */}
            <Route
              path="/institution"
              element={
                <ProtectedRoute>
                  <InstitutionLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
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

            {/* Default fallback route */}
            <Route path="/" element={<Navigate to="/institution/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/institution/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
