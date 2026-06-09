'use client';

import { useI18n } from '@/lib/i18n/context';
import { Dumbbell, AlertTriangle, History, TrendingUp, Target } from 'lucide-react';
import type { GuidedExercise } from './types';

export function ExerciseCard({
  exercise, lang,
}: {
  exercise: GuidedExercise; lang: string;
}) {
  const { t } = useI18n();
  const name = lang === 'he' && exercise.nameHe ? exercise.nameHe : exercise.nameEn;

  const repTarget =
    exercise.repsMin === 0
      ? t('gw.maxReps')
      : exercise.repsMax && exercise.repsMax !== exercise.repsMin
      ? `${exercise.repsMin}–${exercise.repsMax}`
      : `${exercise.repsMin}`;
  const repUnit = exercise.isTimed ? t('unit.sec') : t('gw.reps');

  return (
    <div className="space-y-3 pb-2">

      {/* Name + target summary */}
      <div>
        <h2 className="text-[27px] font-black leading-tight tracking-tight">{name}</h2>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">
          {exercise.targetSets} × {repTarget} {repUnit}
        </p>
      </div>

      {/* Demo image or muscle fallback */}
      <div
        className="relative rounded-3xl overflow-hidden border border-border"
        style={{ aspectRatio: '3/2', background: 'hsl(var(--card))' }}
      >
        {exercise.demoGifUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.demoGifUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-rose-500/10 to-purple-500/8">
            <Dumbbell size={40} className="text-rose-400/60 animate-pulse" />
            <div className="flex flex-wrap gap-1.5 justify-center px-4">
              {exercise.muscleGroups.map((m) => (
                <span
                  key={m}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-card/80 text-muted-foreground"
                >
                  {m.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="absolute top-2 end-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-black/50 text-white/80 backdrop-blur-sm">
          {exercise.exerciseType === 'compound' ? t('gw.compound') : t('gw.isolation')}
        </span>
      </div>

      {/* Warning banner */}
      {(exercise.herniaWarning || exercise.warningText) && (
        <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-300 leading-relaxed">
            {exercise.warningText ?? t('gw.herniaWarn')}
          </p>
        </div>
      )}

      {/* Last performed vs plan target */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-2xl px-3.5 py-3 bg-card border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <History size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('gw.lastTime')}</span>
          </div>
          <p className="text-sm font-bold">{exercise.lastSummary ?? t('gw.firstTime')}</p>
        </div>

        {exercise.targetWeight != null && !exercise.isTimed ? (
          <div className="flex-1 rounded-2xl px-3.5 py-3 bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-1.5 text-primary mb-1.5">
              <Target size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('gw.planTarget')}</span>
            </div>
            <p className="text-sm font-bold text-primary">
              {exercise.targetWeight}{t('unit.kg')} × {repTarget}
            </p>
          </div>
        ) : exercise.suggestedWeight != null && !exercise.isTimed ? (
          <div className="flex-1 rounded-2xl px-3.5 py-3 bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-1.5 text-primary mb-1.5">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('gw.suggested')}</span>
            </div>
            <p className="text-sm font-bold text-primary">{exercise.suggestedWeight}{t('unit.kg')}</p>
          </div>
        ) : null}
      </div>

      {/* Coach progression note */}
      {exercise.progressionNote && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-2.5 bg-primary/5 border border-primary/15">
          <TrendingUp size={13} className="text-primary/70 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-primary/80 leading-relaxed">{exercise.progressionNote}</p>
        </div>
      )}

      {/* Form cues */}
      {exercise.instructions && (
        <p className="text-xs text-muted-foreground leading-relaxed">{exercise.instructions}</p>
      )}
    </div>
  );
}
