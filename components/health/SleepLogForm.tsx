'use client';

import { useState, useTransition } from 'react';
import { logSleep } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CheckCircle2 } from 'lucide-react';

interface SleepLogFormProps {
  currentHours?: number;
  currentQuality?: number;
}

const QUALITY_KEYS: TranslationKey[] = ['sleep.q1', 'sleep.q2', 'sleep.q3', 'sleep.q4', 'sleep.q5'];

export function SleepLogForm({ currentHours, currentQuality }: SleepLogFormProps) {
  const { t } = useI18n();
  const [hours, setHours] = useState(currentHours?.toString() ?? '');
  const [quality, setQuality] = useState<number | null>(currentQuality ?? null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const val = parseFloat(hours);
    if (isNaN(val) || val < 0 || val > 24) {
      setError(t('sleep.invalid'));
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logSleep(val, quality ?? undefined);
        setDone(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('common.failed'));
      }
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 size={40} className="text-primary" />
        <p className="font-semibold">{t('sleep.saved')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('sleep.hours')}</label>
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={hours}
          onChange={e => setHours(e.target.value)}
          placeholder={t('sleep.placeholder')}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-2xl font-bold tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('sleep.quality')}</label>
        <div className="grid grid-cols-5 gap-2">
          {QUALITY_KEYS.map((key, i) => {
            const val = i + 1;
            const active = quality === val;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setQuality(active ? null : val)}
                className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                  active
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-surface-2 border-border text-muted-foreground'
                }`}
              >
                {t(key)}
              </button>
            );
          })}
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hours || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          !hours || isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? t('common.saving') : t('common.save')}
      </button>
    </div>
  );
}
