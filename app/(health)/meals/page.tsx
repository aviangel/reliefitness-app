import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeleteMealButton } from '@/components/health/DeleteMealButton';
import { MEAL_TYPES } from '@/lib/health/constants';
import type { MealLogEntry, MealType } from '@/types/health';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus, UtensilsCrossed } from 'lucide-react';

export const revalidate = 0;

export default async function MealsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: meals } = await supabase
    .from('meals_log')
    .select('id, meal_type, food_name, portion_g, calories, protein_g, carbs_g, fat_g, status, logged_at')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('logged_at');

  const allMeals = (meals ?? []) as MealLogEntry[];
  const totalCal = Math.round(allMeals.reduce((s, m) => s + (m.calories ?? 0), 0));
  const totalProtein = Math.round(allMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0) * 10) / 10;

  const mealsByType = MEAL_TYPES.map(mt => ({
    ...mt,
    entries: allMeals.filter(m => m.meal_type === mt.id),
  }));

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Today&apos;s Meals</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary tabular-nums">{totalCal} kcal</p>
            <p className="text-xs text-muted-foreground">{totalProtein}g protein</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {allMeals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed size={40} className="text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Nothing logged yet today</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to log your first meal</p>
          </div>
        )}

        {mealsByType.map(({ id, label, emoji, time, entries }) => {
          if (entries.length === 0) return null;
          return (
            <div key={id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <span>{emoji}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{time}</span>
              </div>
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.food_name ?? 'Unknown food'}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.portion_g}g
                      {entry.calories != null && (
                        <> &middot; <span className="text-primary font-medium">{Math.round(entry.calories)} kcal</span></>
                      )}
                      {entry.protein_g != null && <> &middot; {entry.protein_g}g protein</>}
                    </p>
                  </div>
                  <DeleteMealButton mealId={entry.id} />
                </div>
              ))}
            </div>
          );
        })}

        <Link
          href="/meals/log"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Log another meal
        </Link>
      </div>
    </div>
  );
}
