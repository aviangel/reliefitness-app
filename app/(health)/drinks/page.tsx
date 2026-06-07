'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logDrink, deleteDrink } from '@/lib/health/actions';
import { format } from 'date-fns';
import { Droplets, X } from 'lucide-react';

type DrinkType = 'water' | 'zero' | 'diet_coke';
type DrinkEntry = { id: string; type: DrinkType; amount_ml: number; logged_at: string | null };

const DRINKS = [
  { type: 'water' as DrinkType, label: 'Water', emoji: '💧', color: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-400/40' },
  { type: 'zero' as DrinkType, label: 'Zero', emoji: '🟢', color: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-400/40' },
  { type: 'diet_coke' as DrinkType, label: 'Diet Coke', emoji: '🥤', color: 'text-red-400', activeBg: 'bg-red-500/15 border-red-400/40' },
];

const AMOUNTS = [150, 250, 330, 500, 750];
const WATER_GOAL_ML = 2500;

export default function DrinksPage() {
  const [entries, setEntries] = useState<DrinkEntry[]>([]);
  const [selectedType, setSelectedType] = useState<DrinkType>('water');
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
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Droplets size={22} className="text-blue-400" />
          Drinks
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Water progress */}
        <div className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-3xl font-bold tabular-nums text-blue-400">
                {totalWater >= 1000 ? `${(totalWater / 1000).toFixed(1)}L` : `${totalWater}ml`}
              </p>
              <p className="text-sm text-muted-foreground">water today</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {waterRemaining > 0 ? `${waterRemaining}ml to go` : '🎉 Goal reached!'}
              </p>
              <p className="text-xs text-muted-foreground">Goal: {WATER_GOAL_ML / 1000}L</p>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>
          {totalAll > totalWater && (
            <p className="text-xs text-muted-foreground mt-2">
              Total all drinks: {totalAll >= 1000 ? `${(totalAll / 1000).toFixed(1)}L` : `${totalAll}ml`}
            </p>
          )}
        </div>

        {/* Quick log panel */}
        <div className="bg-card border border-border rounded-3xl p-4 space-y-4">
          <h2 className="font-semibold text-sm">Quick Log</h2>

          <div className="grid grid-cols-3 gap-2">
            {DRINKS.map((d) => (
              <button
                key={d.type}
                type="button"
                onClick={() => setSelectedType(d.type)}
                className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border font-medium transition-all ${
                  selectedType === d.type
                    ? `${d.activeBg} ${d.color}`
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80'
                }`}
              >
                <span className="text-2xl">{d.emoji}</span>
                <span className="text-xs">{d.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {AMOUNTS.map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => handleLog(ml)}
                disabled={isPending}
                className={`py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${selectedDrink.activeBg} ${selectedDrink.color} border-current hover:opacity-90`}
              >
                {ml}
                <span className="block text-[9px] font-normal opacity-70">ml</span>
              </button>
            ))}
          </div>

          {isPending && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">Logging...</p>
          )}
        </div>

        {/* Today's log */}
        {!isLoading && entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 text-sm">Today&apos;s Log</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {entries.map((entry) => {
                const drink = DRINKS.find((d) => d.type === entry.type);
                const time = entry.logged_at
                  ? format(new Date(entry.logged_at), 'HH:mm')
                  : '';
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0"
                  >
                    <span className="text-lg shrink-0">{drink?.emoji}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${drink?.color}`}>{drink?.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{entry.amount_ml}ml</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{time}</span>
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
            <p className="text-sm text-muted-foreground">No drinks logged yet today</p>
            <p className="text-xs text-muted-foreground">Tap an amount above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
