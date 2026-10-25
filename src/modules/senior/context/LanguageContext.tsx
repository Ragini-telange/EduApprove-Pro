import React from 'react';
import {
  useLanguage as useRootLanguage,
  Language as RootLanguage,
} from '../../../app/providers/LanguageProvider';

export type Language = RootLanguage;

/**
 * Re-exports the unified single LanguageProvider.
 * Passthrough provider ensuring all modules share one unified translation context.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useLanguage = () => {
  return useRootLanguage();
};
