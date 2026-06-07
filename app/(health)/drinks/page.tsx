'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logDrink, deleteDrink } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { format } from 'date-fns';
import { Droplets, X } from 'lucide-react';

type DrinkType = 'water' | 'zero' | 'diet_coke';
type DrinkEntry = { id: string; type: DrinkType; amount_ml: number; logged_at: string | null };

const DRINKS: { type: DrinkType; labelKey: TranslationKey; emoji: string; color: string; activeBg: string; inactiveBg: string }[] = [
  { type: 'water', labelKey: 'drink.water', emoji: '💧', color: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-500/40 text-blue-400', inactiveBg: 'bg-white/[0.03] border-white/[0.06] text-muted-foreground' },
  { type: 'zero', labelKey: 'drink.zero', emoji: '🟢', color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', inactiveBg: 'bg-white/[0.03] border-white/[0.06] text-muted-foreground' },
  { type: 'diet_coke', labelKey: 'drink.diet_coke', emoji: '🥤', color: 'text-rose-400', activeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400', inactiveBg: 'bg-white/[0.03] border-white/[0.06] text-muted-foreground' },
];

const AMOUNTS = [150, 250, 330, 500, 750];
const WATER_GOAL_ML = 2500;

export default function DrinksPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<DrinkEntry[]>([]);
  const [selectedType, setSelectedType] = useState<DrinkType>('water');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await (supabase as any).auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from('drinks_log')
      .select('id,type,amount_ml,logged_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('logged_at', { ascending: false });
    setEntries((data ?? []) as DrinkEntry[]);
    setIsLoading(false);
  }, []); // supabase and today are stable for component lifetime

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleLog = (amount: number) => {
    startTransition(async () => {
      await logDrink(selectedType, amount);
      await fetchEntries();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteDrink(id);
      await fetchEntries();
    });
  };

  const totalWater = entries.filter((e) => e.type === 'water').reduce((s, e) => s + e.amount_ml, 0);
  const totalAll = entries.reduce((s, e) => s + e.amount_ml, 0);
  const waterPct = Math.min(totalWater / WATER_GOAL_ML, 1);
  const waterRemaining = Math.max(0, WATER_GOAL_ML - totalWater);

  const selectedDrink = DRINKS.find((d) => d.type === selectedType)!;

  return (
    <div>
      <div className="px-4 py-5 border-b border-white/[0.07]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Droplets size={22} className="text-blue-400" />
          {t('drinks.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Water progress card */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-4xl font-bold tabular-nums text-white">
                {totalWater >= 1000 ? `${(totalWater / 1000).toFixed(1)} L` : `${totalWater} ml`}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{t('drinks.ofGoal', { n: WATER_GOAL_ML / 1000 })}</p>
            </div>
            <div className="text-right">
              {waterRemaining > 0 ? (
                <>
                  <p className="text-sm font-semibold text-blue-400">{t('drinks.remaining', { n: waterRemaining >= 1000 ? `${(waterRemaining / 1000).toFixed(1)}${t('unit.l')}` : `${waterRemaining}${t('unit.ml')}` })}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-primary">{t('drinks.done')}</p>
              )}
            </div>
          </div>
          <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>
          {totalAll > totalWater && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('drinks.allToday', { n: totalAll >= 1000 ? `${(totalAll / 1000).toFixed(1)}${t('unit.l')}` : `${totalAll}${t('unit.ml')}` })}
            </p>
          )}
        </div>

        {/* Quick log panel */}
        <div className="glass-card rounded-3xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t('drinks.quickLog')}</h2>

          {/* Drink type buttons */}
          <div className="grid grid-cols-3 gap-2">
            {DRINKS.map((d) => (
              <button
                key={d.type}
                type="button"
                onClick={() => setSelectedType(d.type)}
                className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border font-medium transition-all ${
                  selectedType === d.type ? d.activeBg : d.inactiveBg
                }`}
              >
                <span className="text-2xl">{d.emoji}</span>
                <span className="text-xs">{t(d.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Amount buttons */}
          <div className="flex gap-2">
            {AMOUNTS.map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => setSelectedAmount(selectedAmount === ml ? null : ml)}
                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                  selectedAmount === ml
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:border-primary/20'
                }`}
              >
                {ml}
                <span className="block text-[9px] font-normal opacity-70">{t('unit.ml')}</span>
              </button>
            ))}
          </div>

          {/* Log button */}
          <button
            type="button"
            onClick={() => selectedAmount && handleLog(selectedAmount)}
            disabled={isPending || selectedAmount === null}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
              selectedAmount && !isPending
                ? 'bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:opacity-90'
                : 'bg-white/[0.04] text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isPending
              ? t('common.logging')
              : selectedAmount
              ? t('drinks.logAction', { n: selectedAmount, type: t(selectedDrink.labelKey) })
              : t('drinks.selectAmount')}
          </button>
        </div>

        {/* Today's log */}
        {!isLoading && entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 text-sm">{t('drinks.todaysLog')}</h2>
            <div className="space-y-2">
              {entries.map((entry) => {
                const drink = DRINKS.find((d) => d.type === entry.type);
                const time = entry.logged_at
                  ? format(new Date(entry.logged_at), 'HH:mm')
                  : '';
                return (
                  <div
                    key={entry.id}
                    className="glass-card rounded-2xl flex items-center gap-3 px-4 py-3"
                  >
                    <span className="text-xl shrink-0">{drink?.emoji}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-semibold ${drink?.color}`}>{drink ? t(drink.labelKey) : ''}</span>
                      <span className="text-xs text-muted-foreground ml-2">{entry.amount_ml}{t('unit.ml')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Droplets size={36} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('drinks.empty')}</p>
            <p className="text-xs text-muted-foreground">{t('drinks.emptyHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
