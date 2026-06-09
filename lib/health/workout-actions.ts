'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SessionSummary, WorkoutPR } from '@/components/health/guided/types';

const INCREMENT_KG = 2.5;

// Epley estimated 1-rep max
function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/** Abandon any open session, create a fresh one for the chosen template, go to guided mode. */
export async function startSession(templateId: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('workout_sessions')
    .update({ completed_status: 'abandoned', ended_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('completed_status', 'in_progress');

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: user.id, template_id: templateId, completed_status: 'in_progress' })
    .select('id')
    .single();
  if (error) throw error;

  redirect(`/workout/guided/${data.id}`);
}

/** Persist a single completed set (delete-then-insert so re-logging a set is idempotent). */
export async function logSet(input: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  wasFailure?: boolean;
}) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('workout_set_log')
    .delete()
    .eq('session_id', input.sessionId)
    .eq('exercise_id', input.exerciseId)
    .eq('set_number', input.setNumber);

  const { error } = await supabase.from('workout_set_log').insert({
    user_id: user.id,
    session_id: input.sessionId,
    exercise_id: input.exerciseId,
    set_number: input.setNumber,
    weight_kg: input.weightKg,
    reps: input.reps,
    was_failure: input.wasFailure ?? false,
  });
  if (error) throw error;
}

/** Mark a session abandoned (user quit guided mode without finishing). */
export async function abandonSession(sessionId: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('workout_sessions')
    .update({ completed_status: 'abandoned', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id);
}

/**
 * Finalize a session: compute volume + calories, detect PRs vs history,
 * mark complete, and mirror a workout_log row for the dashboard/streak/MCP.
 */
export async function finishSession(sessionId: string): Promise<SessionSummary> {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id,started_at,template_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();
  if (!session) throw new Error('Session not found');

  // Sets logged in THIS session
  const { data: setsRaw } = await supabase
    .from('workout_set_log')
    .select('exercise_id,weight_kg,reps')
    .eq('session_id', sessionId);
  const sets = (setsRaw ?? []) as { exercise_id: string; weight_kg: number; reps: number }[];

  const totalVolume = sets.reduce((s, x) => s + Number(x.weight_kg) * x.reps, 0);
  const startedAt = session.started_at ? new Date(session.started_at).getTime() : Date.now();
  const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const durationMin = durationSec / 60;
  // Strength training ~6.5 kcal/min, with a small bonus for heavy volume.
  const estimatedCalories = Math.max(0, Math.round(durationMin * 6.5 + totalVolume * 0.01));

  // ── PR detection vs all prior completed work ──
  const exerciseIds = Array.from(new Set(sets.map((s) => s.exercise_id)));
  const { data: histRaw } = await supabase
    .from('workout_set_log')
    .select('exercise_id,weight_kg,reps,session_id')
    .eq('user_id', user.id)
    .neq('session_id', sessionId)
    .in('exercise_id', exerciseIds.length ? exerciseIds : ['00000000-0000-0000-0000-000000000000']);
  const hist = (histRaw ?? []) as { exercise_id: string; weight_kg: number; reps: number; session_id: string }[];

  // Names for PR labels
  const { data: exRows } = await supabase
    .from('exercises')
    .select('id,name_en')
    .in('id', exerciseIds.length ? exerciseIds : ['00000000-0000-0000-0000-000000000000']);
  const nameById = new Map<string, string>(
    (exRows ?? []).map((e: { id: string; name_en: string }) => [e.id, e.name_en] as [string, string]),
  );

  const prs: WorkoutPR[] = [];
  for (const exId of exerciseIds) {
    const mine = sets.filter((s) => s.exercise_id === exId);
    const past = hist.filter((s) => s.exercise_id === exId);
    const name = nameById.get(exId) ?? 'Exercise';

    const bestWeight = Math.max(...mine.map((s) => Number(s.weight_kg)), 0);
    const pastBestWeight = Math.max(...past.map((s) => Number(s.weight_kg)), 0);
    if (bestWeight > 0 && bestWeight > pastBestWeight && past.length > 0) {
      prs.push({ exerciseName: name, type: 'weight', value: `${bestWeight}kg` });
    }

    const bestE1rm = Math.max(...mine.map((s) => e1rm(Number(s.weight_kg), s.reps)), 0);
    const pastBestE1rm = Math.max(...past.map((s) => e1rm(Number(s.weight_kg), s.reps)), 0);
    // Only flag an e1rm PR when it isn't already covered by a raw-weight PR
    if (bestE1rm > 0 && bestE1rm > pastBestE1rm && past.length > 0 && bestWeight <= pastBestWeight) {
      prs.push({ exerciseName: name, type: 'e1rm', value: `~${Math.round(bestE1rm)}kg 1RM` });
    }
  }

  // Session-volume PR across all prior completed sessions
  const { data: pastSessions } = await supabase
    .from('workout_sessions')
    .select('total_volume_kg')
    .eq('user_id', user.id)
    .eq('completed_status', 'completed');
  const pastBestVolume = Math.max(
    0,
    ...((pastSessions ?? []) as { total_volume_kg: number }[]).map((s) => Number(s.total_volume_kg)),
  );
  if (totalVolume > 0 && totalVolume > pastBestVolume && (pastSessions ?? []).length > 0) {
    prs.push({ exerciseName: '', type: 'volume', value: `${Math.round(totalVolume).toLocaleString()}kg` });
  }

  await supabase
    .from('workout_sessions')
    .update({
      completed_status: 'completed',
      ended_at: new Date().toISOString(),
      total_volume_kg: Math.round(totalVolume),
      estimated_calories: estimatedCalories,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  // Mirror into legacy workout_log so dashboard net-calories / streak / MCP keep working
  await supabase.from('workout_log').insert({
    user_id: user.id,
    type: 'gym',
    duration_minutes: Math.round(durationMin),
    calories_burned: estimatedCalories,
    notes: 'Guided workout',
  });

  revalidatePath('/workout');
  revalidatePath('/dashboard');

  return {
    totalVolumeKg: Math.round(totalVolume),
    durationSec,
    estimatedCalories,
    totalSets: sets.length,
    prs,
  };
}
