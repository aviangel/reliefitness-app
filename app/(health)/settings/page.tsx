import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DEFAULT_PROFILE } from '@/types/health';
import { SettingsForm } from '@/components/health/SettingsForm';
import { getT } from '@/lib/i18n/server';

export const revalidate = 0;

type ProfileRow = {
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  current_weight_kg: number;
  target_weight_kg: number;
};

export default async function SettingsPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileRaw } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const profile = profileRaw as ProfileRow | null;
  const p = profile ?? DEFAULT_PROFILE;

  return (
    <div>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>
      <SettingsForm
        calorieGoal={Number(p.calorie_goal)}
        proteinGoal={Number(p.protein_goal_g)}
        carbsGoal={Number(p.carbs_goal_g)}
        fatGoal={Number(p.fat_goal_g)}
        currentWeight={Number(p.current_weight_kg)}
        targetWeight={Number(p.target_weight_kg)}
        userId={user.id}
      />
    </div>
  );
}
