'use client';

import { useState, useTransition } from 'react';
import { logSlip } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import { CheckCircle2 } from 'lucide-react';

export function SlipLogForm() {
  const { t } = useI18n();
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!what.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        await logSlip(what.trim(), why.trim() || undefined);
        setWhat('');
        setWhy('');
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('common.failed'));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('slips.what')}</label>
        <input
          type="text"
          value={what}
          onChange={e => setWhat(e.target.value)}
          placeholder={t('slips.whatPlaceholder')}
          className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">{t('slips.why')}</label>
        <textarea
          value={why}
          onChange={e => setWhy(e.target.value)}
          placeholder={t('slips.whyPlaceholder')}
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
        disabled={!what.trim() || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          !what.trim() || isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {done ? <><CheckCircle2 size={18} /> {t('slips.saved')}</> : isPending ? t('common.saving') : t('slips.log')}
      </button>
    </div>
  );
}
