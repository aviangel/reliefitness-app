import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutLogForm } from '@/components/health/WorkoutLogForm';
import { DeleteWorkoutButton } from '@/components/health/DeleteWorkoutButton';
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

const TYPE_LABEL: Record<string, string> = {
  gym: 'Gym',
  walk: 'Walk',
  run: 'Run',
  swim: 'Swim',
  cycling: 'Cycling',
  other: 'Other',
};

export default async function WorkoutPage() {
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
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell size={22} className="text-primary" />
          Workout
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Today summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Today</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-primary">{totalMinutesToday}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs text-muted-foreground font-medium">This week</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{weekEntries.length}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </div>
        </div>

        {/* Log form */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold">
              {todayEntries.length > 0 ? 'Log Another Workout' : 'Log Today\'s Workout'}
            </h2>
          </div>
          <WorkoutLogForm />
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Recent Workouts</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-2xl shrink-0">
                    {TYPE_EMOJI[entry.type] ?? '💪'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold">
                        {TYPE_LABEL[entry.type] ?? entry.type}
                      </p>
                      {entry.date === today && (
                        <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-medium">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.duration_minutes != null && (
                        <span className="text-xs text-muted-foreground">
                          {entry.duration_minutes} min
                        </span>
                      )}
                      {entry.calories_burned != null && (
                        <span className="text-xs text-orange-400">
                          ~{entry.calories_burned} kcal
                        </span>
                      )}
                    </div>
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
