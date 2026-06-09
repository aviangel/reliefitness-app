'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Minus, Plus, Check } from 'lucide-react';
import type { GuidedExercise } from './types';

export function SetLogger({
  exercise,
  defaultWeight,
  defaultReps,
  onDone,
}: {
  exercise: GuidedExercise;
  defaultWeight: number;
  defaultReps: number;
  onDone: (weight: number, reps: number, wasFailure: boolean) => void;
}) {
  const { t } = useI18n();
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [failure, setFailure] = useState(false);
  const timed = exercise.isTimed;

  const adjW = (d: number) => setWeight((w) => Math.max(0, Math.round((w + d) * 2) / 2));
  const adjR = (d: number) => setReps((r) => Math.max(0, r + d));

  const repsLabel = timed ? t('gw.seconds') : t('gw.reps');

  return (
    <div className="space-y-3">
      {/* Weight (hidden for pure bodyweight timed holds) */}
      {!timed && (
        <Stepper
          label={t('gw.weight')}
          unit={t('unit.kg')}
          value={weight}
          display={weight % 1 === 0 ? String(weight) : weight.toFixed(1)}
          onMinus={() => adjW(-2.5)}
          onPlus={() => adjW(2.5)}
          minusLabel="-2.5"
          plusLabel="+2.5"
          accent="#22c55e"
        />
      )}

      <Stepper
        label={repsLabel}
        unit={timed ? t('unit.sec') : ''}
        value={reps}
        display={String(reps)}
        onMinus={() => adjR(timed ? -5 : -1)}
        onPlus={() => adjR(timed ? 5 : 1)}
        minusLabel={timed ? '-5' : '-1'}
        plusLabel={timed ? '+5' : '+1'}
        accent="#3b82f6"
      />

      <button
        onClick={() => setFailure((f) => !f)}
        className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors ${
          failure ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-card border-border text-muted-foreground'
        }`}
      >
        {failure ? t('gw.failureOn') : t('gw.failureOff')}
      </button>

      <button
        onClick={() => onDone(timed ? 0 : weight, reps, failure)}
        className="w-full py-5 rounded-2xl font-black text-base bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,197,94,0.4)]"
      >
        <Check size={22} strokeWidth={3} /> {t('gw.doneSet')}
      </button>
    </div>
  );
}

function Stepper({
  label, unit, display, onMinus, onPlus, minusLabel, plusLabel, accent,
}: {
  label: string; unit: string; value: number; display: string;
  onMinus: () => void; onPlus: () => void; minusLabel: string; plusLabel: string; accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onMinus}
          className="w-14 h-14 rounded-2xl bg-muted flex flex-col items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <Minus size={18} />
          <span className="text-[9px] font-bold text-muted-foreground">{minusLabel}</span>
        </button>
        <div className="flex-1 text-center">
          <span className="text-[44px] font-black tabular-nums leading-none" style={{ color: accent }}>{display}</span>
          {unit && <span className="text-base font-bold text-muted-foreground ms-1">{unit}</span>}
        </div>
        <button
          onClick={onPlus}
          className="w-14 h-14 rounded-2xl bg-muted flex flex-col items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <Plus size={18} />
          <span className="text-[9px] font-bold text-muted-foreground">{plusLabel}</span>
        </button>
      </div>
    </div>
  );
}
