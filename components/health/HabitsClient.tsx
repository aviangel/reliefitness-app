'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { toggleHabitDone, enableHabit, disableHabit } from '@/lib/health/rewards-actions';
import { Check, X, Minus, Plus, Settings2 } from 'lucide-react';

type HabitDef = { slug: string; name_en: string; name_he: string | null; category: string; emoji: string; sort: number };
type UserHabit = { habit_slug: string; schedule_days: number[]; times_per_week: number | null };
type LogRow = { habit_slug: string; date: string };

interface Props {
  defs: HabitDef[];
  userHabits: UserHabit[];
  logs: LogRow[];
  weekDates: string[]; // Sunday → Saturday
  today: string;
}

const CATEGORY_KEYS: Record<string, string> = {
  personal_care: 'habits.catPersonal',
  cleanliness: 'habits.catClean',
  health: 'habits.catHealth',
};

export function HabitsClient({ defs, userHabits, logs, weekDates, today }: Props) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [manageOpen, setManageOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const dayLabels = t('habits.days').split(',');
  const activeBySlug = new Map(userHabits.map((h) => [h.habit_slug, h]));
  const doneSet = new Set(logs.map((l) => `${l.habit_slug}|${l.date}`));
  const todayIdx = weekDates.indexOf(today);

  const handleToggleToday = (slug: string) => {
    setPendingSlug(slug);
    startTransition(async () => {
      await toggleHabitDone(slug);
      setPendingSlug(null);
      router.refresh();
    });
  };

  const handleEnable = (slug: string, current: UserHabit | undefined) => {
    startTransition(async () => {
      if (current) await disableHabit(slug);
      else await enableHabit(slug, [0, 1, 2, 3, 4, 5, 6]);
      router.refresh();
    });
  };

  const handleDayToggle = (habit: UserHabit, day: number) => {
    const days = habit.schedule_days.includes(day)
      ? habit.schedule_days.filter((d) => d !== day)
      : [...habit.schedule_days, day].sort();
    if (days.length === 0) return;
    startTransition(async () => {
      await enableHabit(habit.habit_slug, days, habit.times_per_week);
      router.refresh();
    });
  };

  const activeDefs = defs.filter((d) => activeBySlug.has(d.slug));

  return (
    <div className="p-4 space-y-4">
      {/* Weekly tracker */}
      {activeDefs.length === 0 && (
        <div className="text-center py-10">
          <p className="font-medium text-muted-foreground">{t('habits.empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('habits.emptyHint')}</p>
        </div>
      )}

      {activeDefs.map((def) => {
        const habit = activeBySlug.get(def.slug)!;
        const countMode = habit.times_per_week != null;
        const doneCount = weekDates.filter((d) => doneSet.has(`${def.slug}|${d}`)).length;
        const requiredCount = countMode
          ? habit.times_per_week!
          : habit.schedule_days.length;
        const pct = requiredCount > 0 ? Math.min(100, Math.round((doneCount / requiredCount) * 100)) : 0;
        const goalMet = doneCount >= requiredCount;
        const doneToday = doneSet.has(`${def.slug}|${today}`);

        return (
          <div key={def.slug} className="bg-surface border border-border rounded-[20px] p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xl">{def.emoji}</span>
              <span className="text-sm font-bold flex-1">{(lang === 'he' && def.name_he) || def.name_en}</span>
              <button
                type="button"
                disabled={isPending && pendingSlug === def.slug}
                onClick={() => handleToggleToday(def.slug)}
                className={`px-3.5 py-2 rounded-[12px] text-xs font-black transition-all active:scale-95 ${
                  doneToday
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-surface-2 border border-border text-muted-foreground'
                }`}
              >
                {doneToday ? t('habits.doneToday') : t('habits.markDone')}
              </button>
            </div>

            {/* Week grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {weekDates.map((d, i) => {
                const scheduled = countMode || habit.schedule_days.includes(i);
                const done = doneSet.has(`${def.slug}|${d}`);
                const past = i < todayIdx;
                const isToday = i === todayIdx;
                let cell: React.ReactNode;
                let cls = 'bg-surface-2 border-border text-muted-foreground/40';
                if (done) { cell = <Check size={13} strokeWidth={3} />; cls = 'bg-primary/15 border-primary/40 text-primary'; }
                else if (!scheduled) { cell = <Minus size={12} />; cls = 'bg-transparent border-transparent text-muted-foreground/30'; }
                else if (past) { cell = <X size={13} strokeWidth={3} />; cls = 'bg-red-500/10 border-red-500/25 text-red-400'; }
                else { cell = null; }
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-bold ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>{dayLabels[i]}</span>
                    <div className={`w-full aspect-square rounded-[9px] border flex items-center justify-center ${cls} ${isToday ? 'ring-1 ring-primary/40' : ''}`}>
                      {cell}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: goalMet ? '#22c55e' : 'linear-gradient(90deg,#22c55e,#16a34a)' }}
                />
              </div>
              <span className="text-[11px] font-black tabular-nums text-muted-foreground">
                {doneCount}/{requiredCount}
              </span>
              {goalMet && <span className="text-[10px] font-bold text-primary">{t('habits.goalMet')}</span>}
            </div>
          </div>
        );
      })}

      {/* Manage habits */}
      <button
        type="button"
        onClick={() => setManageOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-sm font-medium"
      >
        {manageOpen ? <Settings2 size={16} /> : <Plus size={16} />}
        {t('habits.manage')}
      </button>

      {manageOpen && (
        <div className="space-y-4">
          {(['personal_care', 'cleanliness', 'health'] as const).map((cat) => (
            <div key={cat} className="bg-surface border border-border rounded-[20px] p-4 space-y-3">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t(CATEGORY_KEYS[cat] as any)}</h2>
              {defs.filter((d) => d.category === cat).map((def) => {
                const habit = activeBySlug.get(def.slug);
                return (
                  <div key={def.slug} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{def.emoji}</span>
                      <span className="text-sm font-semibold flex-1">{(lang === 'he' && def.name_he) || def.name_en}</span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleEnable(def.slug, habit)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${habit ? 'bg-primary' : 'bg-surface-2 border border-border'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${habit ? 'start-[22px]' : 'start-0.5'}`} />
                      </button>
                    </div>
                    {habit && (
                      <div className="flex gap-1 ps-8">
                        {dayLabels.map((label, day) => (
                          <button
                            key={day}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDayToggle(habit, day)}
                            className={`w-7 h-7 rounded-[8px] text-[10px] font-black transition-all ${
                              habit.schedule_days.includes(day)
                                ? 'bg-primary/15 border border-primary/40 text-primary'
                                : 'bg-surface-2 border border-border text-muted-foreground/50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
