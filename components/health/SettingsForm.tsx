'use client';

import { useState, useTransition } from 'react';
import { updateGoals } from '@/lib/health/actions';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { LanguageToggle } from './LanguageToggle';
import { CheckCircle2, LogOut } from 'lucide-react';

interface SettingsFormProps {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  currentWeight: number;
  targetWeight: number;
  userId: string;
}

export function SettingsForm({
  calorieGoal: initCal,
  proteinGoal: initProtein,
  carbsGoal: initCarbs,
  fatGoal: initFat,
  currentWeight,
  targetWeight,
}: SettingsFormProps) {
  const { t } = useI18n();
  const [calGoal, setCalGoal] = useState(initCal.toString());
  const [proteinGoal, setProteinGoal] = useState(initProtein.toString());
  const [carbsGoal, setCarbsGoal] = useState(initCarbs.toString());
  const [fatGoal, setFatGoal] = useState(initFat.toString());
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleSave = () => {
    startTransition(async () => {
      await updateGoals(
        parseInt(calGoal) || 2000,
        parseInt(proteinGoal) || 150,
        parseInt(carbsGoal) || 200,
        parseInt(fatGoal) || 65
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const fields: { labelKey: TranslationKey; value: string; set: (v: string) => void; unit: string; color: string }[] = [
    { labelKey: 'settings.dailyCalories', value: calGoal, set: setCalGoal, unit: t('unit.kcal'), color: 'text-primary' },
    { labelKey: 'settings.proteinGoal', value: proteinGoal, set: setProteinGoal, unit: t('unit.g'), color: 'text-blue-400' },
    { labelKey: 'settings.carbsGoal', value: carbsGoal, set: setCarbsGoal, unit: t('unit.g'), color: 'text-amber-400' },
    { labelKey: 'settings.fatGoal', value: fatGoal, set: setFatGoal, unit: t('unit.g'), color: 'text-pink-400' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Profile info */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.profile')}</h2>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t('settings.currentWeight')}</span>
          <span className="text-sm font-semibold">{currentWeight.toFixed(1)} {t('unit.kg')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t('settings.targetWeight')}</span>
          <span className="text-sm font-semibold text-primary">{targetWeight.toFixed(1)} {t('unit.kg')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">{t('settings.toLose')}</span>
          <span className="text-sm font-semibold">{Math.max(0, currentWeight - targetWeight).toFixed(1)} {t('unit.kg')}</span>
        </div>
      </div>

      <LanguageToggle />

      {/* Goals */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.dailyGoals')}</h2>
        {fields.map(({ labelKey, value, set, unit, color }) => (
          <div key={labelKey} className="flex items-center gap-3">
            <label className="text-sm flex-1">{t(labelKey)}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                className="w-20 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-right font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className={`text-xs font-medium w-8 ${color}`}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || saved}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-primary/20 text-primary'
            : isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {saved ? <><CheckCircle2 size={18} /> {t('settings.saved')}</> : isPending ? t('common.saving') : t('settings.saveGoals')}
      </button>

      {/* Sign out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl border border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-destructive/50 hover:text-destructive transition-colors"
        >
          <LogOut size={16} />
          {t('settings.signOut')}
        </button>
      </div>
    </div>
  );
}
