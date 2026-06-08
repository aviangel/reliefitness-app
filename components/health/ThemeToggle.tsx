'use client';

import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-2 mb-3">
        {theme === 'dark' ? <Moon size={16} className="text-muted-foreground" /> : <Sun size={16} className="text-muted-foreground" />}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('theme.label')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 ${
            theme === 'light'
              ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
              : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/20'
          }`}
        >
          <Sun size={15} /> {t('theme.light')}
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 ${
            theme === 'dark'
              ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
              : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/20'
          }`}
        >
          <Moon size={15} /> {t('theme.dark')}
        </button>
      </div>
    </div>
  );
}
