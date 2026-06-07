'use client';

import { useI18n } from '@/lib/i18n/context';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Languages size={16} className="text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.language')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 ${
            lang === 'en'
              ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
              : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
          }`}
        >
          {t('settings.langEnglish')}
        </button>
        <button
          type="button"
          onClick={() => setLang('he')}
          className={`py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 ${
            lang === 'he'
              ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
              : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
          }`}
        >
          {t('settings.langHebrew')}
        </button>
      </div>
    </div>
  );
}
