import { createContext, useContext } from 'react';

export const LanguageContext = createContext(null);

// { lang, setLang, t, dir } — see LanguageProvider for what each does.
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
