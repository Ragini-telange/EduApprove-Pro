import React from 'react';
import { AuthProvider } from './AuthProvider';
import { LanguageProvider } from './LanguageProvider';
import { ToastProvider } from './ToastProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};
