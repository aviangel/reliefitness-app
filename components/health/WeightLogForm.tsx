'use client';

import { useState, useTransition } from 'react';
import { logWeight } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import { CheckCircle2 } from 'lucide-react';

interface WeightLogFormProps {
  currentWeight?: number;
}

export function WeightLogForm({ currentWeight }: WeightLogFormProps) {
  const { t } = useI18n();
  const [weight, setWeight] = useState(currentWeight?.toString() ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const val = parseFloat(weight);
    if (isNaN(val) || val < 30 || val > 300) {
      setError(t('weight.invalid'));
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logWeight(val, notes || undefined);
        setDone(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('weight.failed'));
      }
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 size={40} className="text-primary" />
        <p className="font-semibold">{t('weight.saved')}</p>
        <p className="text-sm text-muted-foreground">{t('weight.savedDetail', { n: parseFloat(weight).toFixed(1) })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('weight.label')}</label>
        <input
          type="number"
          step="0.1"
          min="30"
          max="300"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder={t('weight.placeholder')}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-2xl font-bold tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('weight.notes')} ({t('common.optional')})</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('weight.notesPlaceholder')}
          rows={2}
          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!weight || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          !weight || isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? t('common.saving') : t('weight.save')}
      </button>
    </div>
  );
}
