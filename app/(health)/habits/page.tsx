import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScrollShell } from '@/components/health/ScrollShell';
import { HabitsClient } from '@/components/health/HabitsClient';
import { getT } from '@/lib/i18n/server';
import { weekStart, toDateStr, addDays } from '@/lib/health/rewards';

export const revalidate = 0;

export default async function HabitsPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const start = weekStart(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(start, i)));

  const [{ data: defs }, { data: userHabits }, { data: logs }] = await Promise.all([
    supabase.from('habit_definitions').select('slug,name_en,name_he,category,emoji,sort').order('sort'),
    supabase.from('user_habits').select('habit_slug,schedule_days,times_per_week').eq('user_id', user.id),
    supabase.from('habit_log').select('habit_slug,date').eq('user_id', user.id)
      .gte('date', weekDates[0]).lte('date', weekDates[6]),
  ]);

  return (
    <ScrollShell>
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-[20px] font-black">{t('habits.title')}</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('habits.subtitle')}</p>
      </div>
      <HabitsClient
        defs={(defs ?? []) as any}
        userHabits={(userHabits ?? []) as any}
        logs={(logs ?? []) as any}
        weekDates={weekDates}
        today={toDateStr(new Date())}
      />
    </ScrollShell>
  );
}
