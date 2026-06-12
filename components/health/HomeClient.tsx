'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { BuddyAvatar, type BuddyMood } from './BuddyAvatar';
import { SpeechBubble } from './SpeechBubble';
import { Utensils, Droplets, ListChecks, Coins, Flame, ChevronRight } from 'lucide-react';
import { logQuickWater } from '@/lib/health/home-actions';

interface Props {
  petName: string;
  petImagePath: string | null;
  petEmoji: string | null;
  variant: string;
  mood: BuddyMood;
  messages: string[];
  buddyReminders: boolean;
  balance: number;
  streak: number;
  // today snapshot
  calories: number;
  calorieGoal: number;
  waterMl: number;
  waterGoalMl: number;
  habitsDone: number;
  habitsScheduled: number;
}

const PALETTE_BG: Record<string, string> = {
  classic: 'linear-gradient(160deg, rgba(34,197,94,0.12) 0%, rgba(22,163,74,0.04) 100%)',
  warm:    'linear-gradient(160deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.04) 100%)',
  cool:    'linear-gradient(160deg, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0.04) 100%)',
};

export function HomeClient({
  petName, petImagePath, petEmoji, variant,
  mood, messages, buddyReminders,
  balance, streak,
  calories, calorieGoal, waterMl, waterGoalMl,
  habitsDone, habitsScheduled,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [waterLogged, setWaterLogged] = useState(false);

  const calPct = Math.min(100, calorieGoal > 0 ? Math.round((calories / calorieGoal) * 100) : 0);
  const waterPct = Math.min(100, waterGoalMl > 0 ? Math.round((waterMl / waterGoalMl) * 100) : 0);
  const waterL = (waterMl / 1000).toFixed(1);
  const waterGoalL = (waterGoalMl / 1000).toFixed(1);

  const handleQuickWater = () => {
    if (isPending) return;
    startTransition(async () => {
      await logQuickWater();
      setWaterLogged(true);
      setTimeout(() => setWaterLogged(false), 2000);
      router.refresh();
    });
  };

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-touch pb-28">
      {/* Hero — buddy */}
      <div
        className="mx-4 mt-4 rounded-[28px] border border-border overflow-hidden"
        style={{ background: PALETTE_BG[variant] ?? PALETTE_BG.classic }}
      >
        <div className="flex flex-col items-center pt-6 pb-4 px-4 gap-3">
          {/* Speech bubble above buddy */}
          <SpeechBubble mood={mood} messages={messages} visible={buddyReminders} />

          <BuddyAvatar imagePath={petImagePath} emoji={petEmoji} mood={mood} size={150} />

          <p className="text-lg font-black">{petName}</p>

          {/* Points + streak pills */}
          <div className="flex gap-2">
            <span className="flex items-center gap-1 bg-surface/70 border border-border rounded-full px-3 py-1 text-xs font-bold">
              <Coins size={12} className="text-amber-400" />
              {balance.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 bg-surface/70 border border-border rounded-full px-3 py-1 text-xs font-bold">
              <Flame size={12} className="text-orange-400" />
              {streak}w
            </span>
          </div>
        </div>

        {/* Today snapshot */}
        <div className="border-t border-border/60 grid grid-cols-3 divide-x divide-border/60">
          {/* Calories */}
          <div className="flex flex-col items-center py-3 px-2 gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t('home.calories')}</span>
            <span className="text-base font-black tabular-nums">{calories}</span>
            <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${calPct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{t('home.ofGoal', { n: calorieGoal })}</span>
          </div>

          {/* Water */}
          <div className="flex flex-col items-center py-3 px-2 gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t('home.water')}</span>
            <span className="text-base font-black tabular-nums">{waterL}L</span>
            <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${waterPct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{t('home.ofGoal', { n: waterGoalL })}</span>
          </div>

          {/* Habits */}
          <div className="flex flex-col items-center py-3 px-2 gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t('home.habitsLabel')}</span>
            <span className="text-base font-black tabular-nums">{habitsDone}/{habitsScheduled}</span>
            <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: habitsScheduled > 0 ? `${Math.round((habitsDone / habitsScheduled) * 100)}%` : '0%' }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{t('home.habitsToday')}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <Link
          href="/meals/log"
          className="flex flex-col items-center gap-1.5 py-4 bg-surface border border-border rounded-[20px] active:scale-95 transition-all"
        >
          <span className="w-9 h-9 rounded-[14px] bg-primary/15 flex items-center justify-center">
            <Utensils size={18} className="text-primary" />
          </span>
          <span className="text-[11px] font-bold text-center leading-tight">{t('home.logFood')}</span>
        </Link>

        <button
          type="button"
          onClick={handleQuickWater}
          disabled={isPending}
          className="flex flex-col items-center gap-1.5 py-4 bg-surface border border-border rounded-[20px] active:scale-95 transition-all"
        >
          <span className={`w-9 h-9 rounded-[14px] flex items-center justify-center ${waterLogged ? 'bg-sky-400/25' : 'bg-sky-400/15'}`}>
            <Droplets size={18} className="text-sky-400" />
          </span>
          <span className="text-[11px] font-bold text-center leading-tight">
            {waterLogged ? '✓ +250ml' : t('home.logWater')}
          </span>
        </button>

        <Link
          href="/habits"
          className="flex flex-col items-center gap-1.5 py-4 bg-surface border border-border rounded-[20px] active:scale-95 transition-all"
        >
          <span className="w-9 h-9 rounded-[14px] bg-emerald-400/15 flex items-center justify-center">
            <ListChecks size={18} className="text-emerald-400" />
          </span>
          <span className="text-[11px] font-bold text-center leading-tight">{t('home.habitsMark')}</span>
        </Link>
      </div>

      {/* Nav links to other trackers */}
      <div className="mx-4 mt-3 bg-surface border border-border rounded-[20px] overflow-hidden">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">{t('home.moreTrackers')}</p>
        {([
          { href: '/meals',    label: t('nav.meals'),   color: 'text-primary' },
          { href: '/drinks',   label: t('nav.drinks'),  color: 'text-sky-400' },
          { href: '/workout',  label: t('nav.workout'), color: 'text-orange-400' },
          { href: '/weight',   label: t('nav.weight'),  color: 'text-violet-400' },
          { href: '/pet',      label: t('pet.title'),   color: 'text-amber-400' },
        ] as const).map(({ href, label, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 border-t border-border active:bg-surface-2 transition-colors"
          >
            <span className={`text-sm font-semibold flex-1 ${color}`}>{label}</span>
            <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
          </Link>
        ))}
      </div>
    </div>
  );
}
