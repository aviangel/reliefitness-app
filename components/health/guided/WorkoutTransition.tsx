'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { ArrowRight, Dumbbell } from 'lucide-react';
import type { GuidedExercise } from './types';

export function WorkoutTransition({
  next, lang, onContinue,
}: {
  next: GuidedExercise; lang: string; onContinue: () => void;
}) {
  const { t } = useI18n();
  const [count, setCount] = useState(5);
  const name = lang === 'he' && next.nameHe ? next.nameHe : next.nameEn;

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(id); onContinue(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'radial-gradient(120% 90% at 50% 25%, rgba(34,197,94,0.18), transparent 60%), hsl(var(--background))' }}>
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">{t('gw.nextUp')}</p>
      <div className="fyp-enter">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/20 to-purple-500/15 border border-border flex items-center justify-center mb-5 mx-auto">
          <Dumbbell size={44} className="text-rose-400" />
        </div>
        <h2 className="text-3xl font-black leading-tight">{name}</h2>
        <p className="text-sm font-bold text-muted-foreground mt-2">
          {t('gw.setsTarget', { n: next.targetSets })}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="mt-10 w-full max-w-sm py-5 rounded-2xl font-black text-base bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
      >
        {t('gw.letsGo')} <ArrowRight size={20} strokeWidth={3} />
      </button>
      <p className="text-xs text-muted-foreground mt-3">{count}</p>
    </div>
  );
}
