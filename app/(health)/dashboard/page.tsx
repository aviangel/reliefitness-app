import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalorieRing } from '@/components/health/CalorieRing';
import { MacrosBars } from '@/components/health/MacrosBars';
import { MealChecklist } from '@/components/health/MealChecklist';
import { DEFAULT_PROFILE } from '@/types/health';
import type { MealLogEntry } from '@/types/health';
import { format } from 'date-fns';
import Link from 'next/link';
import { Scale, Plus, TrendingDown } from 'lucide-react';

export const revalidate = 0;

type WeightEntry = { weight_kg: number; date: string };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const [mealsRes, profileRes, weightRes] = await Promise.all([
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
  ]);

  const allMeals = (mealsRes.data ?? []) as MealLogEntry[];
  const profile = profileRes.data;
  const weightHistory = weightRes.data as WeightEntry[] | null;

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

  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Hey, {p.name} 👋</h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <Link
          href="/weight"
          className={`flex flex-col items-center rounded-2xl px-4 py-2.5 border transition-colors ${
            todayHasWeight
              ? 'bg-primary/10 border-primary/30'
              : 'bg-card border-border hover:border-primary/30'
          }`}
        >
          <span className="text-lg font-bold tabular-nums">{Number(currentWeight).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">kg</span>
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-border p-5 flex flex-col items-center gap-5">
        <CalorieRing calories={totalCalories} goal={Number(p.calorie_goal)} />
        <MacrosBars
          protein={totalProtein} proteinGoal={Number(p.protein_goal_g)}
          carbs={totalCarbs} carbsGoal={Number(p.carbs_goal_g)}
          fat={totalFat} fatGoal={Number(p.fat_goal_g)}
        />
      </div>

      <div className="bg-card rounded-3xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-primary" />
            <span className="text-sm font-semibold">Weight Goal</span>
          </div>
          <span className="text-xs text-muted-foreground">{kgToGo.toFixed(1)} kg to go</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>Target: {Number(p.target_weight_kg)} kg</span>
          <span>Now: {Number(currentWeight).toFixed(1)} kg</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Today&apos;s Meals</h2>
          <Link href="/meals/log" className="flex items-center gap-1 text-xs text-primary font-medium">
            <Plus size={14} />
            Add meal
          </Link>
        </div>
        <MealChecklist meals={allMeals} />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-6">
        <Link
          href="/weight"
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors"
        >
          <Scale size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">{todayHasWeight ? 'Update Weight' : 'Log Weight'}</p>
            <p className="text-xs text-muted-foreground">Daily check-in</p>
          </div>
        </Link>
        <Link
          href="/meals/log"
          className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl p-4 hover:bg-primary/15 transition-colors"
        >
          <Plus size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">Log Meal</p>
            <p className="text-xs text-muted-foreground">Quick add</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
