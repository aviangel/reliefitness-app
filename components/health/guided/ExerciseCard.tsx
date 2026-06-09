'use client';

import { useI18n } from '@/lib/i18n/context';
import { Dumbbell, AlertTriangle, History, TrendingUp } from 'lucide-react';
import type { GuidedExercise } from './types';

export function ExerciseCard({
  exercise, setNumber, lang,
}: {
  exercise: GuidedExercise; setNumber: number; lang: string;
}) {
  const { t } = useI18n();
  const name = lang === 'he' && exercise.nameHe ? exercise.nameHe : exercise.nameEn;

  const repTarget = exercise.repsMin === 0
    ? t('gw.maxReps')
    : exercise.repsMax && exercise.repsMax !== exercise.repsMin
      ? `${exercise.repsMin}-${exercise.repsMax}`
      : `${exercise.repsMin}`;
  const repUnit = exercise.isTimed ? t('unit.sec') : t('gw.reps');

  return (
    <div className="space-y-3">
      {/* Demo */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500/15 to-purple-500/10 border border-border" style={{ aspectRatio: '16/9' }}>
        {exercise.demoGifUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.demoGifUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Dumbbell size={48} className="text-rose-400 animate-pulse" />
            <div className="flex flex-wrap gap-1.5 justify-center px-4">
              {exercise.muscleGroups.map((m) => (
                <span key={m} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-card/70 text-muted-foreground">
                  {m.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="absolute top-2 end-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/40 text-white/90">
          {exercise.exerciseType === 'compound' ? t('gw.compound') : t('gw.isolation')}
        </span>
      </div>

      {/* Name + target */}
      <div>
        <h2 className="text-2xl font-black leading-tight">{name}</h2>
        <p className="text-sm font-bold text-rose-400 mt-1">
          {t('gw.setOf', { a: setNumber, b: exercise.targetSets })} — {repTarget} {repUnit}
        </p>
      </div>

      {/* Warnings */}
      {(exercise.herniaWarning || exercise.warningText) && (
        <div className="flex items-start gap-2 rounded-2xl px-3.5 py-3 bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-300">
            {exercise.warningText ?? t('gw.herniaWarn')}
          </p>
        </div>
      )}

      {/* History + suggestion */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-2xl px-3.5 py-3 bg-card border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <History size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('gw.lastTime')}</span>
          </div>
          <p className="text-sm font-bold">{exercise.lastSummary ?? t('gw.firstTime')}</p>
        </div>
        {exercise.suggestedWeight != null && (
          <div className="flex-1 rounded-2xl px-3.5 py-3 bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <TrendingUp size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('gw.suggested')}</span>
            </div>
            <p className="text-sm font-bold text-primary">{exercise.suggestedWeight}{t('unit.kg')}</p>
          </div>
        )}
      </div>

      {exercise.instructions && (
        <p className="text-xs text-muted-foreground leading-relaxed px-1">{exercise.instructions}</p>
      )}
    </div>
  );
}
