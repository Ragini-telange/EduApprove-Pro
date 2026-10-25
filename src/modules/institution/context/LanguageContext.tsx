import React from 'react';
import { useLanguage as useRootLanguage, Language as RootLanguage } from '../../../app/providers/LanguageProvider';

export type Language = RootLanguage;

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useLanguage = () => {
  const root = useRootLanguage();
  return {
    language: root.language,
    setLanguage: root.setLanguage,
    t: root.t,
  };
};
