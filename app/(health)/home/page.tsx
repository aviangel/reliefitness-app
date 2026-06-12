import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeClient } from '@/components/health/HomeClient';
import type { BuddyMood } from '@/components/health/BuddyAvatar';

export const revalidate = 0;

function computeMood(
  calories: number, calorieGoal: number,
  waterMl: number, waterGoalMl: number,
  habitsDone: number, habitsScheduled: number,
  hourOfDay: number,
): BuddyMood {
  const calPct  = calorieGoal  > 0 ? calories    / calorieGoal  : 0;
  const watPct  = waterGoalMl  > 0 ? waterMl     / waterGoalMl  : 0;
  const habPct  = habitsScheduled > 0 ? habitsDone / habitsScheduled : 1;
  const nothingLogged = calories === 0 && waterMl === 0 && habitsDone === 0;

  if (nothingLogged && hourOfDay >= 14) return 'needs-you';
  if (nothingLogged && hourOfDay >= 22) return 'sleepy';
  if (calPct >= 0.8 && watPct >= 0.8 && habPct >= 1) return 'happy';
  if (hourOfDay >= 22) return 'sleepy';
  if (calPct < 0.3 && watPct < 0.3 && hourOfDay >= 12) return 'needs-you';
  return 'neutral';
}

function getBuddyMessages(
  mood: BuddyMood,
  reminders: boolean,
  foodNudges: boolean,
  waterNudges: boolean,
  habitNudges: boolean,
  petName: string,
  calories: number, calorieGoal: number,
  waterMl: number, waterGoalMl: number,
  habitsDone: number, habitsScheduled: number,
): string[] {
  if (!reminders) {
    // quiet mode — only positive / neutral
    if (mood === 'happy') return [`Great job today! 🌟`, `You're crushing it!`];
    return [`Hey ${petName}! 👋`];
  }

  const msgs: string[] = [];

  if (mood === 'happy') {
    msgs.push(`You're doing amazing today! 🌟`);
    msgs.push(`All targets in sight — keep going! 🎯`);
    if (habitsDone >= habitsScheduled && habitsScheduled > 0)
      msgs.push(`All habits done! You're on fire! ✨`);
  } else if (mood === 'sleepy') {
    msgs.push(`Rest up and try again tomorrow! 🌙`);
    msgs.push(`Good night! Don't forget to log before bed.`);
  } else if (mood === 'needs-you') {
    if (foodNudges && calories === 0)  msgs.push(`Haven't logged any meals yet! 🍽️`);
    if (waterNudges && waterMl === 0)  msgs.push(`Time to drink some water! 💧`);
    if (habitNudges && habitsDone === 0 && habitsScheduled > 0) msgs.push(`No habits done yet today!`);
    if (msgs.length === 0) msgs.push(`I miss you! Come log something 🐾`);
  } else {
    if (foodNudges && calorieGoal > 0 && calories / calorieGoal < 0.5)
      msgs.push(`Halfway through the day — log your meals! 🍽️`);
    if (waterNudges && waterGoalMl > 0 && waterMl / waterGoalMl < 0.5)
      msgs.push(`Drink more water! You're at ${Math.round((waterMl / waterGoalMl) * 100)}% 💧`);
    if (habitNudges && habitsScheduled > habitsDone)
      msgs.push(`${habitsScheduled - habitsDone} habit${habitsScheduled - habitsDone > 1 ? 's' : ''} left today!`);
    if (msgs.length === 0) msgs.push(`Keep it up! You got this 💪`);
  }

  return msgs;
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];
  const hourOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay(); // 0 = Sunday

  const [
    petStateRes, pointsRes, profileRes,
    mealsRes, drinksRes, habitLogRes, userHabitsRes,
  ] = await Promise.all([
    supabase.from('user_pet_state').select('active_pet_slug,pet_name,variant').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_points').select('balance,deficit_week_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_profile').select('calorie_goal,water_goal_ml,buddy_reminders,buddy_food_nudges,buddy_water_nudges,buddy_habit_nudges').eq('user_id', user.id).single(),
    supabase.from('meals_log').select('calories').eq('user_id', user.id).eq('date', today),
    supabase.from('drinks_log').select('amount_ml').eq('user_id', user.id).eq('date', today).eq('type', 'water'),
    supabase.from('habit_log').select('habit_slug').eq('user_id', user.id).eq('date', today),
    supabase.from('user_habits').select('habit_slug,schedule_days').eq('user_id', user.id),
  ]);

  const petState = petStateRes.data as { active_pet_slug: string; pet_name: string; variant: string } | null;
  const points = pointsRes.data as { balance: number; deficit_week_streak: number } | null;
  const profile = profileRes.data as {
    calorie_goal: number; water_goal_ml: number;
    buddy_reminders: boolean; buddy_food_nudges: boolean; buddy_water_nudges: boolean; buddy_habit_nudges: boolean;
  } | null;

  // Calorie + water totals
  const calories   = Math.round((mealsRes.data ?? []).reduce((s: number, m: any) => s + (m.calories ?? 0), 0));
  const waterMl    = (drinksRes.data ?? []).reduce((s: number, d: any) => s + (d.amount_ml ?? 0), 0);
  const calorieGoal = Number(profile?.calorie_goal ?? 2000);
  const waterGoalMl = Number(profile?.water_goal_ml ?? 2500);

  // Habits: count scheduled for today vs done
  const doneSlugs = new Set((habitLogRes.data ?? []).map((r: any) => r.habit_slug));
  const scheduledToday = (userHabitsRes.data ?? []).filter((h: any) => {
    const days: number[] = h.schedule_days ?? [];
    return days.includes(dayOfWeek);
  });
  const habitsDone      = scheduledToday.filter((h: any) => doneSlugs.has(h.habit_slug)).length;
  const habitsScheduled = scheduledToday.length;

  // Pet info
  let petImagePath: string | null = null;
  let petEmoji: string | null = '🐶';
  if (petState?.active_pet_slug) {
    const { data: petItem } = await supabase
      .from('shop_items')
      .select('image_path,emoji')
      .eq('slug', petState.active_pet_slug)
      .single();
    petImagePath = (petItem as any)?.image_path ?? null;
    petEmoji     = (petItem as any)?.emoji ?? '🐶';
  }

  // If no pet adopted yet, redirect to /pet for onboarding
  if (!petState) redirect('/pet');

  const buddyReminders = profile?.buddy_reminders !== false;
  const buddyFoodNudges   = profile?.buddy_food_nudges  !== false;
  const buddyWaterNudges  = profile?.buddy_water_nudges !== false;
  const buddyHabitNudges  = profile?.buddy_habit_nudges !== false;

  const mood = computeMood(calories, calorieGoal, waterMl, waterGoalMl, habitsDone, habitsScheduled, hourOfDay);
  const messages = getBuddyMessages(
    mood, buddyReminders, buddyFoodNudges, buddyWaterNudges, buddyHabitNudges,
    petState.pet_name, calories, calorieGoal, waterMl, waterGoalMl, habitsDone, habitsScheduled,
  );

  return (
    <HomeClient
      petName={petState.pet_name}
      petImagePath={petImagePath}
      petEmoji={petEmoji}
      variant={petState.variant}
      mood={mood}
      messages={messages}
      buddyReminders={buddyReminders}
      balance={Number(points?.balance ?? 0)}
      streak={Number(points?.deficit_week_streak ?? 0)}
      calories={calories}
      calorieGoal={calorieGoal}
      waterMl={waterMl}
      waterGoalMl={waterGoalMl}
      habitsDone={habitsDone}
      habitsScheduled={habitsScheduled}
    />
  );
}
