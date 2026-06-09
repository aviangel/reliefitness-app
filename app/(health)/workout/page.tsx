import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutLogForm } from '@/components/health/WorkoutLogForm';
import { DeleteWorkoutButton } from '@/components/health/DeleteWorkoutButton';
import { WorkoutOverview, type OverviewTemplate } from '@/components/health/WorkoutOverview';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT, getLang } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { format, parseISO } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { Flame, Clock } from 'lucide-react';

export const revalidate = 0;

type WorkoutEntry = {
  id: string;
  date: string;
  type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
};

type TemplateRow = { id: string; day_order: number; day_name: string; phase: string | null; coach_note: string | null };
type TexRow = {
  template_id: string; order_index: number; target_weight_kg: number | null;
  exercise: { name_en: string; name_he: string | null } | null;
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
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  // Prefer the user's personal coach plan; fall back to the default system split.
  const [{ data: historyRaw }, { data: userTplRaw }, { data: lastSession }] = await Promise.all([
    supabase
      .from('workout_log')
      .select('id,date,type,duration_minutes,calories_burned,notes')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(20),
    supabase
      .from('workout_templates')
      .select('id,day_order,day_name,phase,coach_note')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('day_order'),
    supabase
      .from('workout_sessions')
      .select('template_id')
      .eq('user_id', user.id)
      .eq('completed_status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let templates = (userTplRaw ?? []) as TemplateRow[];
  const usingPersonalPlan = templates.length > 0;
  if (!usingPersonalPlan) {
    const { data: sysTpl } = await supabase
      .from('workout_templates')
      .select('id,day_order,day_name,phase,coach_note')
      .is('user_id', null)
      .order('day_order');
    templates = (sysTpl ?? []) as TemplateRow[];
  }

  const { data: texRaw } = await supabase
    .from('workout_template_exercises')
    .select('template_id,order_index,target_weight_kg,exercise:exercises(name_en,name_he)')
    .in('template_id', templates.length ? templates.map((tpl) => tpl.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('order_index');
  const tex = (texRaw ?? []) as unknown as TexRow[];

  const overviewTemplates: OverviewTemplate[] = templates.map((tpl) => ({
    id: tpl.id,
    dayOrder: tpl.day_order,
    dayName: tpl.day_name,
    phase: tpl.phase,
    coachNote: tpl.coach_note,
    exercises: tex
      .filter((x) => x.template_id === tpl.id)
      .map((x) => ({ nameEn: x.exercise?.name_en ?? '', nameHe: x.exercise?.name_he ?? null, weightKg: x.target_weight_kg != null ? Number(x.target_weight_kg) : null }))
      .filter((x) => x.nameEn),
  }));

  // Recommended = next day in the rotation after the last completed session.
  const dayCount = templates.length || 4;
  let recommendedOrder = templates[0]?.day_order ?? 1;
  const lastTemplateId = (lastSession as { template_id: string } | null)?.template_id;
  if (lastTemplateId) {
    const lastOrder = templates.find((x) => x.id === lastTemplateId)?.day_order;
    if (lastOrder) recommendedOrder = (lastOrder % dayCount) + 1;
  }

  const entries = (historyRaw ?? []) as WorkoutEntry[];
  const todayEntries = entries.filter((e) => e.date === today);
  const totalMinutesToday = todayEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const weekEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    const now = new Date();
    return (now.getTime() - d.getTime()) / 86400000 < 7;
  });

  return (
    <ScrollShell>
      {/* ── Hero: guided plan (no separate header — plan IS the header) ── */}
      <div className="p-4 pb-2">
        {overviewTemplates.length > 0 && (
          <WorkoutOverview templates={overviewTemplates} recommendedOrder={recommendedOrder} />
        )}
      </div>

      <div className="px-4 pb-5 space-y-5">
        {/* Compact stats row */}
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

        {/* Manual log */}
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
                  <span className="text-2xl shrink-0">{TYPE_EMOJI[entry.type] ?? '💪'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold">
                        {TYPE_EMOJI[entry.type] ? t(`workout.${entry.type}` as TranslationKey) : entry.type}
                      </p>
                      {entry.duration_minutes != null && (
                        <span className="text-xs font-bold text-primary">
                          {entry.duration_minutes} {t('unit.min')}
                        </span>
                      )}
                      {entry.date === today && (
                        <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-medium">
                          {t('common.today')}
                        </span>
                      )}
                    </div>
                    {entry.calories_burned != null && (
                      <span className="text-xs text-orange-400">
                        {t('wk.caloriesBurned', { n: entry.calories_burned })}
                      </span>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(entry.date), 'd MMM', { locale: dateLocale })}
                    </p>
                    <DeleteWorkoutButton workoutId={entry.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollShell>
  );
}
