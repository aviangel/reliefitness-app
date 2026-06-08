import { cookies } from 'next/headers';

export const THEME_COOKIE = 'rf-theme';
export type Theme = 'light' | 'dark';
const DEFAULT_THEME: Theme = 'dark';

/** Reads the theme from the cookie (server components / actions). */
export function getTheme(): Theme {
  const stored = cookies().get(THEME_COOKIE)?.value;
  return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
}
