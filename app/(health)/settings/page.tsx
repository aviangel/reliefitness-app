import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DEFAULT_PROFILE } from '@/types/health';
import { SettingsForm } from '@/components/health/SettingsForm';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const p = profile ?? DEFAULT_PROFILE;

  return (
    <div>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Goals &amp; preferences</p>
      </div>
      <SettingsForm
        calorieGoal={p.calorie_goal}
        proteinGoal={p.protein_goal_g}
        carbsGoal={p.carbs_goal_g}
        fatGoal={p.fat_goal_g}
        currentWeight={Number(p.current_weight_kg)}
        targetWeight={Number(p.target_weight_kg)}
        userId={user.id}
      />
    </div>
  );
}
