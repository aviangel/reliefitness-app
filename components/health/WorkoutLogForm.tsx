'use client';

import { useState, useTransition } from 'react';
import { logWorkout } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CheckCircle2 } from 'lucide-react';

const WORKOUT_TYPES: { id: string; labelKey: TranslationKey; emoji: string }[] = [
  { id: 'gym', labelKey: 'workout.gym', emoji: '🏋️' },
  { id: 'walk', labelKey: 'workout.walk', emoji: '🚶' },
  { id: 'run', labelKey: 'workout.run', emoji: '🏃' },
  { id: 'swim', labelKey: 'workout.swim', emoji: '🏊' },
  { id: 'cycling', labelKey: 'workout.cycling', emoji: '🚴' },
  { id: 'other', labelKey: 'workout.other', emoji: '💪' },
];

const DURATIONS = [20, 30, 45, 60, 75, 90];

export function WorkoutLogForm() {
  const { t } = useI18n();
  const [type, setType] = useState('gym');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const finalDuration = customDuration ? parseInt(customDuration) : duration;

  const handleSubmit = () => {
    if (!finalDuration || finalDuration < 1) {
      setError(t('wk.invalidDuration'));
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logWorkout(type, finalDuration, notes || undefined);
        setDone(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('wk.failed'));
      }
    });
  };

  if (done) {
    const w = WORKOUT_TYPES.find((t) => t.id === type);
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-primary" />
        </div>
        <p className="text-lg font-bold">{t('wk.logged')}</p>
        <p className="text-sm text-muted-foreground">
          {t('wk.successDetail', { emoji: w?.emoji ?? '', type: w ? t(w.labelKey) : '', min: finalDuration })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('wk.type')}</p>
        <div className="grid grid-cols-3 gap-2">
          {WORKOUT_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => setType(wt.id)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-sm font-medium transition-all ${
                type === wt.id
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                  : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/20'
              }`}
            >
              <span className="text-2xl">{wt.emoji}</span>
              <span className="text-xs font-medium">{t(wt.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('wk.duration')}</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDuration(d); setCustomDuration(''); }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                duration === d && !customDuration
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                  : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/20'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder={t('wk.customDuration')}
          value={customDuration}
          onChange={(e) => { setCustomDuration(e.target.value); }}
          className="mt-2.5 w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('wk.notes')} ({t('common.optional')})</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('wk.notesPlaceholder')}
          rows={2}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
          isPending
            ? 'bg-surface-2 text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:opacity-90'
        }`}
      >
        {isPending ? t('common.logging') : t('wk.logAction')}
      </button>
    </div>
  );
}
