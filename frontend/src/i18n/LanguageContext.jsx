import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './useLanguage';
import en from './en';
import ar from './ar';

const DICTIONARIES = { en, ar };
const STORAGE_KEY = 'lang';
const DEFAULT_LANG = 'en';

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored in DICTIONARIES ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// Looks up a dotted key ("chat.send") and fills {placeholders} from vars.
// Falls back to English, then to the key itself, so a missing Arabic string
// shows up as English rather than breaking the page.
function translate(lang, key, vars) {
  const lookup = (dict) => key.split('.').reduce((node, part) => node?.[part], dict);
  let value = lookup(DICTIONARIES[lang]) ?? lookup(en) ?? key;
  if (typeof value === 'string' && vars) {
    value = value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  }
  return value;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode) — the choice just won't persist.
    }
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }),
    [lang, setLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

