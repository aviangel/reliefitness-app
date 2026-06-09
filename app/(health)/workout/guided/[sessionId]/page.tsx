import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLang, getT } from '@/lib/i18n/server';
import { GuidedWorkoutScreen } from '@/components/health/guided/GuidedWorkoutScreen';
import type { GuidedExercise } from '@/components/health/guided/types';

export const revalidate = 0;

const INCREMENT_KG = 2.5;

type ExerciseRow = {
  id: string; slug: string; name_en: string; name_he: string | null;
  exercise_type: 'compound' | 'isolation'; muscle_groups: string[];
  is_timed: boolean; instructions_text: string | null; demo_gif_url: string | null;
  hernia_warning: boolean;
};
type TemplateExerciseRow = {
  id: string; exercise_id: string; order_index: number; target_sets: number;
  target_reps_min: number; target_reps_max: number | null; rest_seconds: number;
  target_weight_kg: number | null; progression_note: string | null;
  warning_text: string | null; exercise: ExerciseRow;
};
type SetRow = { exercise_id: string; set_number: number; weight_kg: number; reps: number; session_id: string; completed_at: string };

export default async function GuidedSessionPage({ params }: { params: { sessionId: string } }) {
  const lang = getLang();
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id,template_id,completed_status,started_at')
    .eq('id', params.sessionId)
    .eq('user_id', user.id)
    .single();
  if (!session) redirect('/workout');
  if ((session as { completed_status: string }).completed_status === 'completed') redirect('/workout');

  const templateId = (session as { template_id: string }).template_id;

  const [{ data: tplRow }, { data: texRaw }] = await Promise.all([
    supabase.from('workout_templates').select('day_name,phase').eq('id', templateId).single(),
    supabase
      .from('workout_template_exercises')
      .select('id,exercise_id,order_index,target_sets,target_reps_min,target_reps_max,rest_seconds,target_weight_kg,progression_note,warning_text,exercise:exercises(id,slug,name_en,name_he,exercise_type,muscle_groups,is_timed,instructions_text,demo_gif_url,hernia_warning)')
      .eq('template_id', templateId)
      .order('order_index'),
  ]);

  const tex = (texRaw ?? []) as unknown as TemplateExerciseRow[];
  if (tex.length === 0) redirect('/workout');

  const exIds = tex.map((x) => x.exercise_id);
  const { data: histRaw } = await supabase
    .from('workout_set_log')
    .select('exercise_id,set_number,weight_kg,reps,session_id,completed_at')
    .eq('user_id', user.id)
    .neq('session_id', session.id)
    .in('exercise_id', exIds)
    .order('completed_at', { ascending: false })
    .limit(500);
  const hist = (histRaw ?? []) as SetRow[];

  // Most-recent prior session's sets per exercise
  const lastSetsByEx = new Map<string, SetRow[]>();
  for (const ex of exIds) {
    const rows = hist.filter((r) => r.exercise_id === ex);
    if (rows.length === 0) continue;
    const latestSession = rows[0].session_id; // hist is desc by completed_at
    lastSetsByEx.set(ex, rows.filter((r) => r.session_id === latestSession).sort((a, b) => a.set_number - b.set_number));
  }

  const exercises: GuidedExercise[] = tex.map((row) => {
    const e = row.exercise;
    const lastSets = lastSetsByEx.get(row.exercise_id) ?? [];
    const isTimed = e.is_timed;

    // Predetermined plan weight (the coach's target) wins when present.
    const targetWeight = row.target_weight_kg != null ? Number(row.target_weight_kg) : null;

    // Heaviest set from last session (for "last time" + progression baseline)
    let lastSummary: string | null = null;
    let suggestedWeight: number | null = null;
    // Default to the plan's target reps (so reps are predetermined too).
    let defaultReps = row.target_reps_min > 0 ? row.target_reps_min : (row.target_reps_max ?? (isTimed ? 30 : 10));
    // Default weight: plan target first, else 0 until we see history below.
    let defaultWeight = !isTimed && targetWeight != null ? targetWeight : 0;

    if (lastSets.length > 0) {
      const heaviest = lastSets.reduce((best, s) => (Number(s.weight_kg) > Number(best.weight_kg) ? s : best), lastSets[0]);
      const lastW = Number(heaviest.weight_kg);
      const lastR = heaviest.reps;
      lastSummary = isTimed ? `${lastR}${t('unit.sec')}` : `${lastW}${t('unit.kg')} × ${lastR}`;

      if (!isTimed && lastW > 0) {
        const top = row.target_reps_max ?? row.target_reps_min;
        const hitTop = row.target_reps_min > 0 && top > 0 && lastSets.every((s) => s.reps >= top);
        // History-based suggestion only matters when the coach hasn't pinned a weight.
        suggestedWeight = hitTop ? lastW + INCREMENT_KG : lastW;
        if (targetWeight == null) defaultWeight = suggestedWeight;
      } else if (!isTimed && targetWeight == null) {
        defaultWeight = lastW;
      }
    }

    return {
      templateExerciseId: row.id,
      exerciseId: row.exercise_id,
      slug: e.slug,
      nameEn: e.name_en,
      nameHe: e.name_he,
      exerciseType: e.exercise_type,
      muscleGroups: e.muscle_groups ?? [],
      isTimed,
      instructions: e.instructions_text,
      demoGifUrl: e.demo_gif_url,
      herniaWarning: e.hernia_warning,
      warningText: row.warning_text,
      targetSets: row.target_sets,
      repsMin: row.target_reps_min,
      repsMax: row.target_reps_max,
      restSeconds: row.rest_seconds,
      targetWeight,
      progressionNote: row.progression_note,
      lastSummary,
      suggestedWeight,
      defaultReps,
      defaultWeight,
    };
  });

  const tpl = tplRow as { day_name: string; phase: string | null } | null;

  return (
    <GuidedWorkoutScreen
      session={{ id: session.id, dayName: tpl?.day_name ?? t('gw.workout'), phase: tpl?.phase ?? null }}
      exercises={exercises}
      lang={lang}
    />
  );
}
