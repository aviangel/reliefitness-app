'use client';

import { createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { translations, interpolate, type Lang, type TranslationKey } from './translations';

interface I18nContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const DEFAULT_LANG: Lang = 'he';
const ONE_YEAR = 60 * 60 * 24 * 365;

function applyDocumentLang(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

/**
 * Provider seeded with the server-resolved language (from the cookie) so the
 * first client render matches the server. Changing language writes the cookie
 * + mirrors to localStorage, updates <html>, and refreshes server components.
 */
export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      try {
        document.cookie = `rf-lang=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
        localStorage.setItem('rf-lang', next);
      } catch {
        /* ignore */
      }
      applyDocumentLang(next);
      router.refresh();
    },
    [lang, router],
  );

  const toggleLang = useCallback(() => setLang(lang === 'he' ? 'en' : 'he'), [lang, setLang]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations[DEFAULT_LANG];
      return interpolate(dict[key] ?? translations.en[key] ?? key, vars);
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, dir: lang === 'he' ? 'rtl' : 'ltr', setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
