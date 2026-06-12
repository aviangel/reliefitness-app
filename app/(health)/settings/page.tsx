import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DEFAULT_PROFILE } from '@/types/health';
import { SettingsForm } from '@/components/health/SettingsForm';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT } from '@/lib/i18n/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_URL ?? 'https://reliefitness-mcp-production.up.railway.app';

export const revalidate = 0;

type ProfileRow = {
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  sugar_goal_g: number;
  water_goal_ml: number;
  current_weight_kg: number;
  target_weight_kg: number;
  buddy_reminders: boolean;
  buddy_food_nudges: boolean;
  buddy_water_nudges: boolean;
  buddy_habit_nudges: boolean;
};

export default async function SettingsPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profileRaw }, { data: mcpKeyData }] = await Promise.all([
    supabase.from('user_profile').select('*').eq('user_id', user.id).single(),
    supabase.from('mcp_api_keys').select('api_key').eq('user_id', user.id).single(),
  ]);

  const profile = profileRaw as ProfileRow | null;
  const p = profile ?? DEFAULT_PROFILE;

  return (
    <ScrollShell>
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-[20px] font-black">{t('settings.title')}</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('settings.subtitle')}</p>
      </div>
      <SettingsForm
        calorieGoal={Number(p.calorie_goal)}
        proteinGoal={Number(p.protein_goal_g)}
        carbsGoal={Number(p.carbs_goal_g)}
        fatGoal={Number(p.fat_goal_g)}
        sugarGoal={Number(p.sugar_goal_g ?? 50)}
        waterGoalMl={Number(p.water_goal_ml ?? 2500)}
        currentWeight={Number(p.current_weight_kg)}
        targetWeight={Number(p.target_weight_kg)}
        userId={user.id}
        initApiKey={(mcpKeyData as any)?.api_key ?? null}
        mcpServerUrl={MCP_SERVER_URL}
        buddyReminders={(p as any).buddy_reminders !== false}
        buddyFood={(p as any).buddy_food_nudges !== false}
        buddyWater={(p as any).buddy_water_nudges !== false}
        buddyHabits={(p as any).buddy_habit_nudges !== false}
      />
    </ScrollShell>
  );
}
