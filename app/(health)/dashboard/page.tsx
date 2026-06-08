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
import { Scale, Plus, Droplets, Dumbbell, BarChart2, Settings, Flame } from 'lucide-react';

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

  return (
    <div className="p-4 space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[20px] font-black gradient-text leading-none">
            {t('dash.greeting', { name: p.name })}
          </h1>
          <p className="text-[11px] text-muted-foreground/60 font-medium mt-1">
            {format(new Date(), 'EEEE, d MMM')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/stats" className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <BarChart2 size={17} />
          </Link>
          <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <Settings size={17} />
          </Link>
          <Link
            href="/weight"
            className={`flex flex-col items-center justify-center rounded-[14px] w-14 h-11 border transition-all ${
              todayHasWeight
                ? 'bg-primary/10 border-primary/30'
                : 'bg-[#111] border-white/[0.07]'
            }`}
          >
            <span className="text-[15px] font-black tabular-nums leading-none">
              {Number(currentWeight).toFixed(1)}
            </span>
            <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-0.5">
              {t('unit.kg')}
            </span>
          </Link>
        </div>
      </div>

      {/* ── Calorie ring + macros ── */}
      <div
        className="bg-[#111111] border border-white/[0.06] rounded-[24px] px-5 pt-5 pb-4 flex flex-col items-center gap-4"
      >
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

      {/* ── Stats row: weight goal + water ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Weight goal */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
            {t('dash.weightGoal')}
          </p>
          <p className="text-[28px] font-black tabular-nums leading-none text-foreground">
            {kgToGo.toFixed(1)}
            <span className="text-sm font-bold text-muted-foreground/60 ms-1">{t('unit.kg')}</span>
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 mb-3">to go</p>
          <div className="h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#00e5ff] transition-all duration-700"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* Water */}
        <Link href="/drinks" className="bg-[#111111] border border-white/[0.06] rounded-[20px] p-4 block active:scale-[0.97] transition-transform">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
            {t('dash.water')}
          </p>
          <p className="text-[28px] font-black tabular-nums leading-none text-blue-400">
            {totalWaterMl >= 1000
              ? (totalWaterMl / 1000).toFixed(1)
              : totalWaterMl}
            <span className="text-sm font-bold ms-1">
              {totalWaterMl >= 1000 ? t('unit.l') : t('unit.ml')}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1 mb-3">
            / {WATER_GOAL_ML / 1000}{t('unit.l')}
          </p>
          <div className="h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>
        </Link>

      </div>

      {/* ── Workout ── */}
      {workouts.length > 0 ? (
        <Link
          href="/workout"
          className="flex items-center gap-3 bg-primary/[0.07] border border-primary/15 rounded-[18px] px-4 py-3 active:scale-[0.97] transition-transform"
        >
          <span className="text-xl">{TYPE_EMOJI[workouts[0].type] ?? '💪'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-primary leading-tight">{t('dash.workoutDone')}</p>
            <p className="text-[11px] text-muted-foreground/60">
              {workouts.map((w) => t(`workout.${w.type}` as TranslationKey)).join(', ')}
              {totalWorkoutMin > 0 && ` · ${totalWorkoutMin} ${t('unit.min')}`}
            </p>
          </div>
          <Flame size={16} className="text-primary/50 shrink-0" />
        </Link>
      ) : (
        <Link
          href="/workout"
          className="flex items-center gap-3 bg-[#111111] border border-dashed border-white/[0.08] rounded-[18px] px-4 py-3 active:scale-[0.97] transition-transform"
        >
          <Dumbbell size={17} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground/40 flex-1">{t('dash.noWorkout')}</span>
          <Plus size={14} className="text-muted-foreground/30" />
        </Link>
      )}

      {/* ── Today's meals ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/50">
            {t('dash.todaysMeals')}
          </p>
          <Link
            href="/meals/log"
            className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
          </Link>
        </div>
        <MealChecklist meals={allMeals} />
      </div>

      {/* ── Bottom actions ── */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link
          href="/weight"
          className="flex items-center gap-2.5 bg-[#111111] border border-white/[0.06] rounded-[18px] px-4 py-3.5 active:scale-[0.97] transition-transform"
        >
          <Scale size={18} className="text-muted-foreground/40 shrink-0" />
          <p className="text-sm font-bold leading-tight">
            {todayHasWeight ? t('dash.updateWeight') : t('dash.logWeight')}
          </p>
        </Link>
        <Link
          href="/meals/log"
          className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-[18px] px-4 py-3.5 active:scale-[0.97] transition-transform"
          style={{ boxShadow: '0 0 20px rgba(34,197,94,0.08)' }}
        >
          <Plus size={18} className="text-primary shrink-0" />
          <p className="text-sm font-bold text-primary leading-tight">{t('dash.logMeal')}</p>
        </Link>
      </div>

    </div>
  );
}
