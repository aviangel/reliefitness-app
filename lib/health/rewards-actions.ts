'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  HABIT_POINTS, HABIT_DAILY_CAP,
  MIN_LOGGED_DAYS, MIN_DEFICIT_DAYS,
  lastCompletedWeek, deficitAward, weekStart, toDateStr, addDays,
} from './rewards';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

async function requireUser(supabase: any): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/** Upsert-style points adjustment, keeping balance/lifetime in sync. */
async function adjustPoints(supabase: any, userId: string, delta: number) {
  const { data: existing } = await supabase.from('user_points').select('balance,lifetime').eq('user_id', userId).maybeSingle();
  if (existing) {
    await supabase.from('user_points').update({
      balance: Math.max(0, existing.balance + delta),
      lifetime: delta > 0 ? existing.lifetime + delta : existing.lifetime,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } else {
    await supabase.from('user_points').insert({
      user_id: userId,
      balance: Math.max(0, delta),
      lifetime: Math.max(0, delta),
    });
  }
}

// ── Habits ────────────────────────────────────────────────────────────────────

export async function enableHabit(habitSlug: string, scheduleDays: number[], timesPerWeek?: number | null) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const { error } = await supabase.from('user_habits').upsert(
    {
      user_id: userId,
      habit_slug: habitSlug,
      schedule_days: scheduleDays.length ? scheduleDays : [0, 1, 2, 3, 4, 5, 6],
      times_per_week: timesPerWeek ?? null,
    },
    { onConflict: 'user_id,habit_slug' }
  );
  if (error) throw error;
  revalidatePath('/habits');
}

export async function disableHabit(habitSlug: string) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);
  await supabase.from('user_habits').delete().eq('user_id', userId).eq('habit_slug', habitSlug);
  revalidatePath('/habits');
}

export async function toggleHabitDone(habitSlug: string, date?: string): Promise<{ done: boolean; pointsAwarded: number }> {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);
  const d = date ?? todayStr();

  const { data: existing } = await supabase
    .from('habit_log').select('id')
    .eq('user_id', userId).eq('habit_slug', habitSlug).eq('date', d)
    .maybeSingle();

  if (existing) {
    // Un-complete: remove log + claw back the matching ledger entry (anti-farming)
    await supabase.from('habit_log').delete().eq('id', existing.id);
    const { data: ledger } = await supabase
      .from('points_ledger').select('id,points')
      .eq('user_id', userId).eq('reason', 'habit').eq('ref_date', d)
      .eq('meta->>habit_slug', habitSlug)
      .maybeSingle();
    if (ledger) {
      await supabase.from('points_ledger').delete().eq('id', ledger.id);
      await adjustPoints(supabase, userId, -ledger.points);
    }
    revalidatePath('/habits');
    revalidatePath('/pet');
    return { done: false, pointsAwarded: 0 };
  }

  const { error } = await supabase.from('habit_log').insert({ user_id: userId, habit_slug: habitSlug, date: d });
  if (error) throw error;

  // Award points up to the daily habit cap
  const { data: todayLedger } = await supabase
    .from('points_ledger').select('points')
    .eq('user_id', userId).eq('reason', 'habit').eq('ref_date', d);
  const earnedToday = (todayLedger ?? []).reduce((s: number, r: any) => s + r.points, 0);
  const award = Math.max(0, Math.min(HABIT_POINTS, HABIT_DAILY_CAP - earnedToday));

  if (award > 0) {
    await supabase.from('points_ledger').insert({
      user_id: userId, points: award, reason: 'habit', ref_date: d,
      meta: { habit_slug: habitSlug },
    });
    await adjustPoints(supabase, userId, award);
  }

  revalidatePath('/habits');
  revalidatePath('/pet');
  return { done: true, pointsAwarded: award };
}

// ── Weekly deficit reward ─────────────────────────────────────────────────────

export type WeeklyDeficitStatus = {
  weekStart: string;
  weekEnd: string;
  daysLogged: number;
  deficitDays: number;
  surplusDays: number;
  eligible: boolean;
  alreadyClaimed: boolean;
  potentialAward: number;
  streak: number;
};

export async function getWeeklyDeficitStatus(): Promise<WeeklyDeficitStatus> {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);
  return evaluateWeek(supabase, userId);
}

async function evaluateWeek(supabase: any, userId: string): Promise<WeeklyDeficitStatus> {
  const { start, end } = lastCompletedWeek();
  const [{ data: rows }, { data: points }] = await Promise.all([
    supabase.from('daily_calorie_status').select('date,status').eq('user_id', userId).gte('date', start).lte('date', end),
    supabase.from('user_points').select('deficit_week_streak,last_deficit_week').eq('user_id', userId).maybeSingle(),
  ]);
  const days = (rows ?? []) as { date: string; status: string }[];
  const deficitDays = days.filter((r) => r.status === 'deficit').length;
  const surplusDays = days.filter((r) => r.status === 'surplus').length;
  const alreadyClaimed = points?.last_deficit_week === start;
  const eligible = !alreadyClaimed
    && days.length >= MIN_LOGGED_DAYS
    && surplusDays === 0
    && deficitDays >= MIN_DEFICIT_DAYS;

  // Streak this claim would reach: consecutive if the previous week was also awarded
  const prevWeekStart = toDateStr(addDays(new Date(start + 'T00:00:00'), -7));
  const continues = points?.last_deficit_week === prevWeekStart;
  const nextStreak = continues ? (points?.deficit_week_streak ?? 0) + 1 : 1;

  return {
    weekStart: start, weekEnd: end,
    daysLogged: days.length, deficitDays, surplusDays,
    eligible, alreadyClaimed,
    potentialAward: deficitAward(nextStreak),
    streak: alreadyClaimed ? (points?.deficit_week_streak ?? 0) : nextStreak,
  };
}

export async function claimWeeklyDeficit(): Promise<{ claimed: boolean; points: number; streak: number }> {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const status = await evaluateWeek(supabase, userId);
  if (!status.eligible) return { claimed: false, points: 0, streak: status.streak };

  const award = status.potentialAward;
  await supabase.from('points_ledger').insert({
    user_id: userId, points: award, reason: 'weekly_deficit', ref_date: status.weekStart,
    meta: { week_start: status.weekStart, streak: status.streak },
  });
  await adjustPoints(supabase, userId, award);

  const { data: existing } = await supabase.from('user_points').select('user_id').eq('user_id', userId).maybeSingle();
  if (existing) {
    await supabase.from('user_points').update({
      deficit_week_streak: status.streak,
      last_deficit_week: status.weekStart,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  }

  revalidatePath('/pet');
  revalidatePath('/shop');
  return { claimed: true, points: award, streak: status.streak };
}

// ── Pet ───────────────────────────────────────────────────────────────────────

export async function adoptStarterPet(petSlug: string, petName: string, variant: string) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const { data: item } = await supabase.from('shop_items').select('slug,is_starter,item_type').eq('slug', petSlug).single();
  if (!item || item.item_type !== 'pet' || !item.is_starter) throw new Error('Not a starter pet');

  const { data: state } = await supabase.from('user_pet_state').select('user_id').eq('user_id', userId).maybeSingle();
  if (state) throw new Error('You already have a pet');

  await supabase.from('user_inventory').upsert(
    { user_id: userId, item_slug: petSlug },
    { onConflict: 'user_id,item_slug' }
  );
  const { error } = await supabase.from('user_pet_state').insert({
    user_id: userId,
    active_pet_slug: petSlug,
    pet_name: petName.trim().slice(0, 24) || 'Buddy',
    variant,
  });
  if (error) throw error;
  revalidatePath('/pet');
}

export async function setActivePet(petSlug: string) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const { data: owned } = await supabase.from('user_inventory').select('id').eq('user_id', userId).eq('item_slug', petSlug).maybeSingle();
  if (!owned) throw new Error('You do not own this pet');

  // Equipped items belong to the previous pet — clear them on switch
  const { error } = await supabase.from('user_pet_state').update({
    active_pet_slug: petSlug,
    equipped_items: [],
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/pet');
}

export async function renamePet(name: string) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);
  const { error } = await supabase.from('user_pet_state').update({
    pet_name: name.trim().slice(0, 24) || 'Buddy',
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/pet');
}

export async function toggleEquipItem(itemSlug: string) {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const [{ data: owned }, { data: state }, { data: item }] = await Promise.all([
    supabase.from('user_inventory').select('id').eq('user_id', userId).eq('item_slug', itemSlug).maybeSingle(),
    supabase.from('user_pet_state').select('active_pet_slug,equipped_items').eq('user_id', userId).maybeSingle(),
    supabase.from('shop_items').select('pet_slug,item_type').eq('slug', itemSlug).single(),
  ]);
  if (!owned) throw new Error('You do not own this item');
  if (!state) throw new Error('No active pet');
  if (item?.item_type === 'accessory' && item.pet_slug !== state.active_pet_slug) {
    throw new Error('This accessory belongs to a different character');
  }

  const equipped: string[] = state.equipped_items ?? [];
  const next = equipped.includes(itemSlug)
    ? equipped.filter((s) => s !== itemSlug)
    : [...equipped, itemSlug];

  const { error } = await supabase.from('user_pet_state').update({
    equipped_items: next,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/pet');
}

// ── Shop ──────────────────────────────────────────────────────────────────────

export async function purchaseItem(itemSlug: string): Promise<{ purchased: boolean; error?: string }> {
  const supabase = createClient() as any;
  const userId = await requireUser(supabase);

  const [{ data: item }, { data: owned }, { data: points }] = await Promise.all([
    supabase.from('shop_items').select('slug,cost,is_starter,item_type').eq('slug', itemSlug).single(),
    supabase.from('user_inventory').select('id').eq('user_id', userId).eq('item_slug', itemSlug).maybeSingle(),
    supabase.from('user_points').select('balance').eq('user_id', userId).maybeSingle(),
  ]);

  if (!item) return { purchased: false, error: 'Item not found' };
  if (item.is_starter) return { purchased: false, error: 'Starter items are claimed when you create your pet' };
  if (owned) return { purchased: false, error: 'Already owned' };
  const balance = points?.balance ?? 0;
  if (balance < item.cost) return { purchased: false, error: 'Not enough points' };

  await supabase.from('user_inventory').insert({ user_id: userId, item_slug: itemSlug });
  await supabase.from('points_ledger').insert({
    user_id: userId, points: -item.cost, reason: 'purchase', meta: { item_slug: itemSlug },
  });
  await adjustPoints(supabase, userId, -item.cost);

  revalidatePath('/shop');
  revalidatePath('/pet');
  return { purchased: true };
}
