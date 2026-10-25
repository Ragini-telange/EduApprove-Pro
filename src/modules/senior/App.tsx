import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthorityDashboard } from './pages/authority/AuthorityDashboard';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/authority/dashboard" replace />} />
            <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
            <Route path="/authority/*" element={<AuthorityDashboard />} />
            <Route path="*" element={<Navigate to="/authority/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
