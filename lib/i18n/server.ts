import { cookies } from 'next/headers';
import { translations, interpolate, type Lang, type TranslationKey } from './translations';

export const LANG_COOKIE = 'rf-lang';
const DEFAULT_LANG: Lang = 'he';

/** Reads the language from the cookie (server components / actions). */
export function getLang(): Lang {
  const stored = cookies().get(LANG_COOKIE)?.value;
  return stored === 'en' || stored === 'he' ? stored : DEFAULT_LANG;
}

export function getDir(lang: Lang = getLang()): 'rtl' | 'ltr' {
  return lang === 'he' ? 'rtl' : 'ltr';
}

/** Returns a translation function bound to the current cookie language. */
export function getT(): (key: TranslationKey, vars?: Record<string, string | number>) => string {
  const lang = getLang();
  const dict = translations[lang] ?? translations[DEFAULT_LANG];
  return (key, vars) => interpolate(dict[key] ?? translations.en[key] ?? key, vars);
}
