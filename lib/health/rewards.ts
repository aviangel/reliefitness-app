// Points economy constants + week helpers.
//
// Balancing: the weekly calorie-deficit award is the main source of points.
// Habit completions give small points with a hard daily cap, so a full week
// of perfect habits (7 × 50 = 350) is still worth less than one deficit week.

export const HABIT_POINTS = 10;          // points per habit completion
export const HABIT_DAILY_CAP = 50;       // max habit points per day
export const WEEKLY_DEFICIT_POINTS = 500; // base award for a deficit week
export const STREAK_BONUS_PER_WEEK = 50; // extra per consecutive week
export const STREAK_BONUS_CAP = 250;     // max streak bonus
export const MIN_LOGGED_DAYS = 5;        // days with data required to qualify
export const MIN_DEFICIT_DAYS = 4;       // of which at least this many in deficit

/** Sunday-based week start (the app's week runs Sunday → Saturday). */
export function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay()); // getDay(): Sunday = 0
  return out;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** The most recent fully-completed week (the week before the current one). */
export function lastCompletedWeek(now = new Date()): { start: string; end: string } {
  const thisWeek = weekStart(now);
  const start = addDays(thisWeek, -7);
  const end = addDays(thisWeek, -1);
  return { start: toDateStr(start), end: toDateStr(end) };
}

export function deficitAward(streak: number): number {
  const bonus = Math.min(STREAK_BONUS_PER_WEEK * Math.max(0, streak - 1), STREAK_BONUS_CAP);
  return WEEKLY_DEFICIT_POINTS + bonus;
}
