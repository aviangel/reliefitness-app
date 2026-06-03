import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { format, subDays, startOfWeek } from 'date-fns';
import { BarChart2 } from 'lucide-react';

export const revalidate = 0;

type MealCalEntry = { date: string; calories: number | null };
type WeightEntry = { date: string; weight_kg: number };

export default async function StatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');

  const [profileRes, weekMealsRes, weightRes] = await Promise.all([
    supabase.from('user_profile').select('calorie_goal').eq('user_id', user.id).single(),
    supabase
      .from('meals_log')
      .select('date,calories')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', today),
    supabase
      .from('weight_log')
      .select('date,weight_kg')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7),
  ]);

  const profile = profileRes.data as { calorie_goal: number } | null;
  const weekMeals = weekMealsRes.data as MealCalEntry[] | null;
  const weightHistory = weightRes.data as WeightEntry[] | null;

  const calorieGoal = profile?.calorie_goal ?? 2000;
  const dayTotals: Record<string, number> = {};
  for (const meal of weekMeals ?? []) {
    dayTotals[meal.date] = (dayTotals[meal.date] ?? 0) + (meal.calories ?? 0);
  }
  const daysLogged = Object.keys(dayTotals).length;
  const avgCalories = daysLogged > 0
    ? Math.round(Object.values(dayTotals).reduce((s, v) => s + v, 0) / daysLogged)
    : 0;
  const daysUnderGoal = Object.values(dayTotals).filter(c => c <= calorieGoal).length;

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const label = format(subDays(new Date(), 6 - i), 'EEE');
    const calories = Math.round(dayTotals[date] ?? 0);
    return { date, label, calories };
  });
  const maxCal = Math.max(...last7.map(d => d.calories), calorieGoal);

  return (
    <div>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 size={22} className="text-primary" />
          Stats
        </h1>
        <p className="text-sm text-muted-foreground">This week&apos;s summary</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{avgCalories}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg kcal/day</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{daysLogged}</p>
            <p className="text-xs text-muted-foreground mt-1">Days logged</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{daysUnderGoal}</p>
            <p className="text-xs text-muted-foreground mt-1">Under goal</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-4">Last 7 Days</h2>
          <div className="flex items-end gap-2 h-28">
            {last7.map(({ label, calories, date }) => {
              const pct = maxCal > 0 ? (calories / maxCal) * 100 : 0;
              const isToday = date === today;
              const overGoal = calories > calorieGoal && calories > 0;
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: 88 }}>
                    {calories > 0 ? (
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: overGoal ? '#ef4444' : isToday ? '#22c55e' : '#22c55e80',
                          minHeight: 4,
                        }}
                      />
                    ) : (
                      <div className="w-full rounded-t-lg bg-muted" style={{ height: 4 }} />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  }`}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">0</span>
            <span className="text-xs text-muted-foreground">Goal: {calorieGoal}</span>
          </div>
        </div>

        {(weightHistory?.length ?? 0) > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">Recent Weight</h2>
            <div className="space-y-2">
              {(weightHistory ?? []).slice(0, 5).map(entry => (
                <div key={entry.date} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {format(new Date(entry.date + 'T00:00:00'), 'EEE, MMM d')}
                  </span>
                  <span className="font-semibold tabular-nums">{Number(entry.weight_kg).toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 border border-dashed border-border rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Full charts, weekly reports, and trend analysis coming in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
