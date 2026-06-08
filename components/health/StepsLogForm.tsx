'use client';

import { useState, useTransition } from 'react';
import { logSteps } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import { CheckCircle2 } from 'lucide-react';

export function StepsLogForm({ currentSteps }: { currentSteps?: number }) {
  const { t } = useI18n();
  const [steps, setSteps] = useState(currentSteps?.toString() ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const val = parseInt(steps);
    if (isNaN(val) || val < 0 || val > 200000) {
      setError(t('steps.invalid'));
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logSteps(val);
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
        <p className="font-semibold">{t('steps.saved')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('steps.today')}</label>
        <input
          type="number"
          min="0"
          value={steps}
          onChange={e => setSteps(e.target.value)}
          placeholder={t('steps.placeholder')}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-2xl font-bold tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!steps || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          !steps || isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? t('common.saving') : t('common.save')}
      </button>
    </div>
  );
}
