'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { ChevronUp, ChevronDown, Zap, Check } from 'lucide-react';
import type { GuidedExercise } from './types';

export function SetLogger({
  exercise,
  defaultWeight,
  defaultReps,
  setIndex,
  onDone,
}: {
  exercise: GuidedExercise;
  defaultWeight: number;
  defaultReps: number;
  setIndex: number;
  onDone: (weight: number, reps: number, wasFailure: boolean) => void;
}) {
  const { t } = useI18n();
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [failure, setFailure] = useState(false);
  const timed = exercise.isTimed;

  const adjW = (d: number) =>
    setWeight((w) => Math.max(0, parseFloat((w + d).toFixed(1))));
  const adjR = (d: number) => setReps((r) => Math.max(0, r + d));

  return (
    <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">

      {/* Set progress dots */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {t('gw.setOf', { a: setIndex + 1, b: exercise.targetSets })}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: exercise.targetSets }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < setIndex
                  ? 'w-2 bg-primary'
                  : i === setIndex
                  ? 'w-5 bg-primary'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Drum steppers — side by side, or full-width for timed */}
      <div className={`grid gap-3 mb-3 ${timed ? 'grid-cols-1 max-w-[180px] mx-auto' : 'grid-cols-2'}`}>
        {!timed && (
          <Drum
            display={weight % 1 === 0 ? String(weight) : weight.toFixed(1)}
            unit={t('unit.kg')}
            accent="#22c55e"
            onUp={() => adjW(2.5)}
            onDown={() => adjW(-2.5)}
          />
        )}
        <Drum
          display={String(reps)}
          unit={timed ? t('unit.sec') : t('gw.reps')}
          accent="#3b82f6"
          onUp={() => adjR(timed ? 5 : 1)}
          onDown={() => adjR(timed ? -5 : -1)}
        />
      </div>

      {/* Weight quick-adjust pills */}
      {!timed && (
        <div className="flex gap-1.5 mb-3">
          {[-5, -2.5, 2.5, 5].map((d) => (
            <button
              key={d}
              onClick={() => adjW(d)}
              className="flex-1 py-2 rounded-xl bg-card border border-border/70 text-[11px] font-bold text-muted-foreground active:scale-95 active:bg-muted transition-all"
            >
              {d > 0 ? `+${d}` : `${d}`}
            </button>
          ))}
        </div>
      )}

      {/* Failure toggle — subtle by default, glows rose when active */}
      <button
        onClick={() => setFailure((f) => !f)}
        className={`w-full py-2.5 mb-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 border ${
          failure
            ? 'bg-rose-500/15 border-rose-400/50 text-rose-400'
            : 'bg-transparent border-border/25 text-muted-foreground/40'
        }`}
      >
        <Zap
          size={14}
          className={failure ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground/25'}
        />
        {failure ? t('gw.failureOn') : t('gw.failureOff')}
      </button>

      {/* DONE SET — hero action */}
      <button
        onClick={() => onDone(timed ? 0 : weight, reps, failure)}
        className="w-full py-[18px] rounded-3xl font-black text-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2.5 shadow-[0_6px_32px_rgba(34,197,94,0.4)]"
      >
        <Check size={24} strokeWidth={3.5} />
        {t('gw.doneSet')}
      </button>
    </div>
  );
}

function Drum({
  display, unit, accent, onUp, onDown,
}: {
  display: string; unit: string; accent: string;
  onUp: () => void; onDown: () => void;
}) {
  return (
    <div className="rounded-3xl overflow-hidden bg-card border border-border">
      <button
        onClick={onUp}
        className="w-full h-12 flex items-center justify-center active:bg-muted/60 transition-colors select-none"
      >
        <ChevronUp size={24} className="text-muted-foreground" strokeWidth={2.5} />
      </button>
      <div
        className="py-2.5 text-center border-y border-border/40"
        style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)` }}
      >
        <span
          className="text-[54px] font-black tabular-nums leading-none select-none"
          style={{ color: accent }}
        >
          {display}
        </span>
        <span className="block text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
          {unit}
        </span>
      </div>
      <button
        onClick={onDown}
        className="w-full h-12 flex items-center justify-center active:bg-muted/60 transition-colors select-none"
      >
        <ChevronDown size={24} className="text-muted-foreground" strokeWidth={2.5} />
      </button>
    </div>
  );
}
