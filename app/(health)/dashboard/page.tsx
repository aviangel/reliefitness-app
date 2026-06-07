import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalorieRing } from '@/components/health/CalorieRing';
import { MacrosBars } from '@/components/health/MacrosBars';
import { MealChecklist } from '@/components/health/MealChecklist';
import { getT } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { DEFAULT_PROFILE } from '@/types/health';
import type { MealLogEntry } from '@/types/health';
import { format } from 'date-fns';
import Link from 'next/link';
import { Scale, Plus, TrendingDown, Droplets, Dumbbell, BarChart2, Settings } from 'lucide-react';

export const revalidate = 0;

type WeightEntry = { weight_kg: number; date: string };
type DrinkEntry = { type: string; amount_ml: number };
type WorkoutEntry = { type: string; duration_minutes: number | null };

const WATER_GOAL_ML = 2500;

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', walk: '🚶', run: '🏃', swim: '🏊', cycling: '🚴', other: '💪',
};

export default async function DashboardPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const [mealsRes, profileRes, weightRes, drinksRes, workoutRes] = await Promise.all([
    supabase
      .from('meals_log')
      .select('id,meal_type,food_name,portion_g,calories,protein_g,carbs_g,fat_g,status,logged_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('logged_at'),
    supabase.from('user_profile').select('*').eq('user_id', user.id).single(),
    supabase
      .from('weight_log')
      .select('weight_kg,date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(2),
    supabase
      .from('drinks_log')
      .select('type,amount_ml')
      .eq('user_id', user.id)
      .eq('date', today),
    supabase
      .from('workout_log')
      .select('type,duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('logged_at', { ascending: false })
      .limit(3),
  ]);

  const allMeals = (mealsRes.data ?? []) as MealLogEntry[];
  const profile = profileRes.data;
  const weightHistory = weightRes.data as WeightEntry[] | null;
  const drinks = (drinksRes.data ?? []) as DrinkEntry[];
  const workouts = (workoutRes.data ?? []) as WorkoutEntry[];

  const p = profile ?? DEFAULT_PROFILE;
  const totalCalories = Math.round(allMeals.reduce((s, m) => s + (m.calories ?? 0), 0));
  const totalProtein = Math.round(allMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0) * 10) / 10;
  const totalCarbs = Math.round(allMeals.reduce((s, m) => s + (m.carbs_g ?? 0), 0) * 10) / 10;
  const totalFat = Math.round(allMeals.reduce((s, m) => s + (m.fat_g ?? 0), 0) * 10) / 10;

  const currentWeight = weightHistory?.[0]?.weight_kg ?? p.current_weight_kg;
  const kgToGo = Math.max(0, Number(currentWeight) - Number(p.target_weight_kg));
  const totalLoss = Number(p.current_weight_kg) - Number(p.target_weight_kg);
  const goalProgress = totalLoss > 0 ? Math.min(100, Math.max(0, (1 - kgToGo / totalLoss) * 100)) : 0;
  const todayHasWeight = weightHistory?.[0]?.date === today;

  const totalWaterMl = drinks.filter((d) => d.type === 'water').reduce((s, d) => s + d.amount_ml, 0);
  const waterPct = Math.min(totalWaterMl / WATER_GOAL_ML, 1);
  const totalWorkoutMin = workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);

  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{t('dash.greeting', { name: p.name })}</h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/stats" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
            <BarChart2 size={19} />
          </Link>
          <Link href="/settings" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
            <Settings size={19} />
          </Link>
          <Link
            href="/weight"
            className={`flex flex-col items-center rounded-2xl px-3.5 py-2 border transition-colors ml-1 ${
              todayHasWeight
                ? 'bg-primary/10 border-primary/30'
                : 'glass-card hover:border-primary/30'
            }`}
          >
            <span className="text-base font-bold tabular-nums leading-tight">{Number(currentWeight).toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">{t('unit.kg')}</span>
          </Link>
        </div>
      </div>

      {/* Calorie ring + macros */}
      <div className="glass-card rounded-3xl p-5 flex flex-col items-center gap-5 shadow-[0_0_40px_rgba(34,197,94,0.04)]">
        <CalorieRing calories={totalCalories} goal={Number(p.calorie_goal)} />
        <MacrosBars
          protein={totalProtein} proteinGoal={Number(p.protein_goal_g)}
          carbs={totalCarbs} carbsGoal={Number(p.carbs_goal_g)}
          fat={totalFat} fatGoal={Number(p.fat_goal_g)}
          proteinLabel={t('form.protein')}
          carbsLabel={t('form.carbs')}
          fatLabel={t('form.fat')}
        />
      </div>

      {/* Weight goal + Water row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={14} className="text-primary" />
            <span className="text-xs font-semibold">{t('dash.weightGoal')}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{t('dash.toGo', { n: kgToGo.toFixed(1) })}</p>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>{Number(p.target_weight_kg)} {t('unit.kg')}</span>
            <span>{Number(currentWeight).toFixed(1)} {t('unit.kg')}</span>
          </div>
        </div>

        <Link href="/drinks" className="glass-card rounded-2xl p-4 hover:border-blue-500/30 transition-colors block">
          <div className="flex items-center gap-1.5 mb-2">
            <Droplets size={14} className="text-blue-400" />
            <span className="text-xs font-semibold">{t('dash.water')}</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-blue-400">
            {totalWaterMl >= 1000 ? `${(totalWaterMl / 1000).toFixed(1)}${t('unit.l')}` : `${totalWaterMl}${t('unit.ml')}`}
          </p>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{t('dash.waterGoal', { n: WATER_GOAL_ML / 1000 })}</p>
        </Link>
      </div>

      {/* Workout today */}
      {workouts.length > 0 ? (
        <Link
          href="/workout"
          className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 hover:bg-primary/10 transition-colors"
        >
          <span className="text-xl">{TYPE_EMOJI[workouts[0].type] ?? '💪'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">{t('dash.workoutDone')}</p>
            <p className="text-xs text-muted-foreground">
              {t('dash.workoutSummary', {
                type: workouts.map((w) => t(`workout.${w.type}` as TranslationKey)).join(', '),
                min: totalWorkoutMin,
              })}
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/workout"
          className="flex items-center gap-3 glass-card rounded-2xl px-4 py-3.5 hover:border-primary/30 transition-colors border-dashed"
        >
          <Dumbbell size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground flex-1">{t('dash.noWorkout')}</span>
          <Plus size={16} className="text-muted-foreground" />
        </Link>
      )}

      {/* Today's meals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t('dash.todaysMeals')}</h2>
          <Link href="/meals/log" className="flex items-center gap-1 text-xs text-primary font-medium">
            <Plus size={14} />
            {t('dash.addMeal')}
          </Link>
        </div>
        <MealChecklist meals={allMeals} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 pb-6">
        <Link
          href="/weight"
          className="flex items-center gap-3 glass-card rounded-2xl p-4 hover:border-primary/20 transition-colors"
        >
          <Scale size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">{todayHasWeight ? t('dash.updateWeight') : t('dash.logWeight')}</p>
            <p className="text-xs text-muted-foreground">{t('dash.dailyCheckin')}</p>
          </div>
        </Link>
        <Link
          href="/meals/log"
          className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl p-4 hover:bg-primary/15 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.08)]"
        >
          <Plus size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">{t('dash.logMeal')}</p>
            <p className="text-xs text-muted-foreground">{t('dash.quickAdd')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
