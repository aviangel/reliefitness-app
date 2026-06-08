'use client';

import { createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

function applyDocumentTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.style.colorScheme = theme;
}

/**
 * Provider seeded with the server-resolved theme (from the cookie) so the first
 * client render matches the server. Switching writes the cookie, flips the
 * <html> class instantly (no flash), then refreshes server components.
 */
export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const router = useRouter();

  const setTheme = useCallback(
    (next: Theme) => {
      if (next === theme) return;
      try {
        document.cookie = `rf-theme=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
        localStorage.setItem('rf-theme', next);
      } catch {
        /* ignore */
      }
      applyDocumentTheme(next);
      router.refresh();
    },
    [theme, router],
  );

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
