import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { format, startOfWeek, addDays } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { getT, getLang } from '@/lib/i18n/server';
import { ScrollShell } from '@/components/health/ScrollShell';
import { BarChart2 } from 'lucide-react';

export const revalidate = 0;

type MealCalEntry = { date: string; calories: number | null };
type WeightEntry = { date: string; weight_kg: number };

export default async function StatsPage() {
  const t = getT();
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekStart = format(weekStartDate, 'yyyy-MM-dd');
  const weekEnd = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');

  const [profileRes, weekMealsRes, weightRes] = await Promise.all([
    supabase.from('user_profile').select('calorie_goal').eq('user_id', user.id).single(),
    supabase
      .from('meals_log')
      .select('date,calories')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
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

  // Sun–Sat calendar week (not rolling 7 days)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStartDate, i);
    const date = format(d, 'yyyy-MM-dd');
    const label = format(d, 'EEEEE', { locale: dateLocale }); // single-char abbr
    const calories = Math.round(dayTotals[date] ?? 0);
    const isFuture = date > today;
    return { date, label, calories, isFuture };
  });
  const maxCal = Math.max(...weekDays.map(d => d.calories), calorieGoal);

  return (
    <ScrollShell>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 size={22} className="text-primary" />
          {t('stats.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('stats.subtitle')}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{avgCalories}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('stats.avgKcal')}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{daysLogged}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('stats.daysLogged')}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{daysUnderGoal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('stats.underGoal')}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-4">{t('stats.last7')}</h2>
          <div className="flex items-end gap-2 h-28">
            {weekDays.map(({ label, calories, date, isFuture }) => {
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
                      <div
                        className="w-full rounded-t-lg"
                        style={{ height: 4, backgroundColor: isFuture ? 'transparent' : 'hsl(var(--muted))' }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    isToday ? 'text-primary' : isFuture ? 'text-muted-foreground/30' : 'text-muted-foreground'
                  }`}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">0</span>
            <span className="text-xs text-muted-foreground">{t('stats.goal', { n: calorieGoal })}</span>
          </div>
        </div>

        {(weightHistory?.length ?? 0) > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">{t('stats.recentWeight')}</h2>
            <div className="space-y-2">
              {(weightHistory ?? []).slice(0, 5).map(entry => (
                <div key={entry.date} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {format(new Date(entry.date + 'T00:00:00'), 'EEE, d MMM', { locale: dateLocale })}
                  </span>
                  <span className="font-semibold tabular-nums">{Number(entry.weight_kg).toFixed(1)} {t('unit.kg')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 border border-dashed border-border rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('stats.phase3')}
          </p>
        </div>
      </div>
    </ScrollShell>
  );
}
