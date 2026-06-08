'use client';

import { useState, useTransition } from 'react';
import { logMeasurement } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CheckCircle2 } from 'lucide-react';

interface MeasurementLogFormProps {
  current?: { waist_cm?: number | null; chest_cm?: number | null; hips_cm?: number | null; arm_cm?: number | null };
}

export function MeasurementLogForm({ current }: MeasurementLogFormProps) {
  const { t } = useI18n();
  const [waist, setWaist] = useState(current?.waist_cm?.toString() ?? '');
  const [chest, setChest] = useState(current?.chest_cm?.toString() ?? '');
  const [hips, setHips] = useState(current?.hips_cm?.toString() ?? '');
  const [arm, setArm] = useState(current?.arm_cm?.toString() ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fields: { labelKey: TranslationKey; value: string; set: (v: string) => void }[] = [
    { labelKey: 'meas.waist', value: waist, set: setWaist },
    { labelKey: 'meas.chest', value: chest, set: setChest },
    { labelKey: 'meas.hips', value: hips, set: setHips },
    { labelKey: 'meas.arm', value: arm, set: setArm },
  ];

  const handleSubmit = () => {
    const parsed = {
      waist_cm: parseFloat(waist) || undefined,
      chest_cm: parseFloat(chest) || undefined,
      hips_cm: parseFloat(hips) || undefined,
      arm_cm: parseFloat(arm) || undefined,
    };
    if (!parsed.waist_cm && !parsed.chest_cm && !parsed.hips_cm && !parsed.arm_cm) {
      setError(t('meas.atLeastOne'));
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logMeasurement(parsed);
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
        <p className="font-semibold">{t('meas.saved')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ labelKey, value, set }) => (
          <div key={labelKey}>
            <label className="text-sm font-medium text-muted-foreground block mb-2">{t(labelKey)}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder="—"
                className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-lg font-bold tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">{t('unit.cm')}</span>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? t('common.saving') : t('common.save')}
      </button>
    </div>
  );
}
