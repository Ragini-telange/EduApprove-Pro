import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CommonLayout } from '../layouts/CommonLayout';
import { RootRedirect } from './RootRedirect';
import { LoginPage } from '../../modules/institution/pages/LoginPage';
import { renderInstitutionRoutes } from './institutionRoutes';
import { renderRegionalRoutes } from './regionalRoutes';
import { renderSeniorRoutes } from './seniorRoutes';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/institution/login" element={<LoginPage />} />

        {/* Protected App Routes inside Universal Common Layout */}
        <Route element={<CommonLayout />}>
          {/* Smart Gateway Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Role-based Route Groups */}
          {renderInstitutionRoutes()}
          {renderRegionalRoutes()}
          {renderSeniorRoutes()}
        </Route>

        {/* Global Fallback Redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};
