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

  const repTarget =
    next.repsMin === 0
      ? t('gw.maxReps')
      : next.repsMax && next.repsMax !== next.repsMin
      ? `${next.repsMin}–${next.repsMax}`
      : `${next.repsMin}`;
  const repUnit = next.isTimed ? t('unit.sec') : t('gw.reps');

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
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-between px-6 py-8 text-center"
      style={{
        background:
          'radial-gradient(ellipse 130% 55% at 50% 15%, rgba(34,197,94,0.2), transparent 55%), hsl(var(--background))',
      }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mt-2">
        {t('gw.nextUp')}
      </p>

      <div className="flex flex-col items-center">
        {/* Demo thumbnail or icon */}
        <div className="w-32 h-32 rounded-3xl overflow-hidden border border-border mb-5 shadow-lg">
          {next.demoGifUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={next.demoGifUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/20 to-purple-500/15">
              <Dumbbell size={44} className="text-rose-400" />
            </div>
          )}
        </div>

        <h2 className="text-3xl font-black leading-tight mb-2">{name}</h2>
        <p className="text-sm font-bold text-muted-foreground">
          {next.targetSets} × {repTarget} {repUnit}
        </p>
        {(next.targetWeight != null || next.suggestedWeight != null) && !next.isTimed && (
          <p className="text-lg font-black text-primary mt-1">
            {(next.targetWeight ?? next.suggestedWeight)}{t('unit.kg')}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm">
        <button
          onClick={onContinue}
          className="w-full py-5 rounded-3xl font-black text-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2 shadow-[0_6px_28px_rgba(34,197,94,0.4)] mb-3"
        >
          {t('gw.letsGo')} <ArrowRight size={22} strokeWidth={3} />
        </button>
        <p className="text-xs text-muted-foreground tabular-nums">{count}</p>
      </div>
    </div>
  );
}
