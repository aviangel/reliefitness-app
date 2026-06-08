import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { DEFAULT_PROFILE } from '@/types/health';
import type { MealLogEntry } from '@/types/health';
import { format } from 'date-fns';
import { FypFeed, type FypData } from '@/components/health/fyp/FypFeed';

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
  const totalWorkoutMin = workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);

  const data: FypData = {
    name: p.name,
    dateLabel: format(new Date(), 'EEEE, d MMM'),
    calories: totalCalories,
    calorieGoal: Number(p.calorie_goal),
    protein: totalProtein, proteinGoal: Number(p.protein_goal_g),
    carbs: totalCarbs, carbsGoal: Number(p.carbs_goal_g),
    fat: totalFat, fatGoal: Number(p.fat_goal_g),
    meals: allMeals.map((m) => ({ meal_type: m.meal_type, food_name: m.food_name, calories: m.calories })),
    waterMl: totalWaterMl,
    waterGoalMl: WATER_GOAL_ML,
    currentWeight: Number(currentWeight),
    targetWeight: Number(p.target_weight_kg),
    kgToGo,
    goalProgress,
    todayHasWeight,
    workout: {
      hasWorkout: workouts.length > 0,
      emoji: workouts.length > 0 ? (TYPE_EMOJI[workouts[0].type] ?? '💪') : '💪',
      typesLabel: workouts.map((w) => t(`workout.${w.type}` as TranslationKey)).join(', '),
      totalMin: totalWorkoutMin,
    },
  };

  return <FypFeed {...data} />;
}
