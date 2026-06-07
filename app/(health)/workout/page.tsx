import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutLogForm } from '@/components/health/WorkoutLogForm';
import { DeleteWorkoutButton } from '@/components/health/DeleteWorkoutButton';
import { getT } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { format, parseISO } from 'date-fns';
import { Dumbbell, Flame, Clock } from 'lucide-react';

export const revalidate = 0;

type WorkoutEntry = {
  id: string;
  date: string;
  type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
};

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️',
  walk: '🚶',
  run: '🏃',
  swim: '🏊',
  cycling: '🚴',
  other: '💪',
};

export default async function WorkoutPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: historyRaw } = await supabase
    .from('workout_log')
    .select('id,date,type,duration_minutes,calories_burned,notes')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(20);

  const entries = (historyRaw ?? []) as WorkoutEntry[];
  const todayEntries = entries.filter((e) => e.date === today);
  const totalMinutesToday = todayEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const weekEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    const now = new Date();
    return (now.getTime() - d.getTime()) / 86400000 < 7;
  });

  return (
    <div>
      <div className="px-4 py-5 border-b border-white/[0.07]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell size={22} className="text-primary" />
          {t('wk.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Today summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{t('wk.today')}</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-primary">{totalMinutesToday}</p>
            <p className="text-xs text-muted-foreground">{t('unit.minutes')}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs text-muted-foreground font-medium">{t('wk.thisWeek')}</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{weekEntries.length}</p>
            <p className="text-xs text-muted-foreground">{t('unit.sessions')}</p>
          </div>
        </div>

        {/* Log form */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold">
              {todayEntries.length > 0 ? t('wk.logAnother') : t('wk.logToday')}
            </h2>
          </div>
          <WorkoutLogForm />
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">{t('wk.recent')}</h2>
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="glass-card rounded-2xl flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="text-2xl shrink-0">
                    {TYPE_EMOJI[entry.type] ?? '💪'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold">
                        {TYPE_EMOJI[entry.type] ? t(`workout.${entry.type}` as TranslationKey) : entry.type}
                      </p>
                      {entry.duration_minutes != null && (
                        <span className="text-xs font-bold text-primary">{entry.duration_minutes} {t('unit.min')}</span>
                      )}
                      {entry.date === today && (
                        <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-medium">
                          {t('common.today')}
                        </span>
                      )}
                    </div>
                    {entry.calories_burned != null && (
                      <span className="text-xs text-orange-400">{t('wk.caloriesBurned', { n: entry.calories_burned })}</span>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(entry.date), 'MMM d')}
                    </p>
                    <DeleteWorkoutButton workoutId={entry.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
