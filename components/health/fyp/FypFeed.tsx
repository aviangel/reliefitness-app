'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';
import { CalorieRing } from '@/components/health/CalorieRing';
import { MEAL_TYPES } from '@/lib/health/constants';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  ChevronUp, Plus, Droplets, Scale, Dumbbell, Flame, Check, BarChart2, Settings,
  Moon, Footprints, Ruler, AlertTriangle, ChevronRight,
} from 'lucide-react';

export interface FypData {
  name: string;
  dateLabel: string;
  calories: number;
  caloriesBurned: number;
  calorieGoal: number;
  tdee: number;
  protein: number; proteinGoal: number;
  carbs: number; carbsGoal: number;
  fat: number; fatGoal: number;
  meals: { meal_type: string; food_name: string | null; calories: number | null }[];
  waterMl: number; waterGoalMl: number;
  currentWeight: number; targetWeight: number; kgToGo: number; goalProgress: number; todayHasWeight: boolean;
  workout: { hasWorkout: boolean; emoji: string; typesLabel: string; totalMin: number };
  stepsToday: number;
}

type Grad = { dark: string; light: string };
const grad = (dark: string, light: string): Grad => ({ dark, light });

const PANELS = 7;
// Transition duration in ms — controls swipe speed feel
const TRANSITION_MS = 320;

export function FypFeed(d: FypData) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [active, setActive] = useState(0);
  const [liveSteps, setLiveSteps] = useState(d.stepsToday);

  // Sync steps from localStorage (updated by StepCounterLive on /steps page)
  useEffect(() => {
    const key = `rf-steps-${new Date().toISOString().slice(0, 10)}`;
    const read = () => {
      const stored = parseInt(localStorage.getItem(key) ?? '0', 10);
      setLiveSteps(prev => Math.max(prev, stored));
    };
    read();
    const id = setInterval(read, 5000);
    return () => clearInterval(id);
  }, []);

  // Touch tracking
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastWheelTime = useRef(0);
  const animating = useRef(false);

  const goTo = (next: number) => {
    if (animating.current) return;
    const clamped = Math.max(0, Math.min(PANELS - 1, next));
    if (clamped === active) return;
    animating.current = true;
    setActive(clamped);
    setTimeout(() => { animating.current = false; }, TRANSITION_MS + 50);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    const elapsed = Math.max(1, Date.now() - touchStartTime.current);
    const velocity = Math.abs(delta) / elapsed; // px/ms
    const threshold = velocity > 0.4 ? 25 : 55;
    if (delta > threshold) goTo(active + 1);
    else if (delta < -threshold) goTo(active - 1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < TRANSITION_MS + 100) return;
    lastWheelTime.current = now;
    if (e.deltaY > 15) goTo(active + 1);
    else if (e.deltaY < -15) goTo(active - 1);
  };

  const pick = (g: Grad) => (isDark ? g.dark : g.light);
  const base = isDark ? '#0a0a0a' : '#f4f4f5';

  const gCal = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(34,197,94,0.32), transparent 55%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(34,197,94,0.28), transparent 55%), ${base}`,
  );
  const gMacro = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(59,130,246,0.30), rgba(6,182,212,0.10) 40%, transparent 60%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(59,130,246,0.24), rgba(6,182,212,0.10) 40%, transparent 60%), ${base}`,
  );
  const gMeals = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(245,158,11,0.28), rgba(249,115,22,0.10) 40%, transparent 60%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(245,158,11,0.24), rgba(249,115,22,0.10) 40%, transparent 60%), ${base}`,
  );
  const gWater = grad(
    `radial-gradient(120% 90% at 50% 6%, rgba(14,165,233,0.34), rgba(34,211,238,0.12) 45%, transparent 65%), ${base}`,
    `radial-gradient(120% 90% at 50% 6%, rgba(14,165,233,0.26), rgba(34,211,238,0.12) 45%, transparent 65%), ${base}`,
  );
  const gWeight = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(168,85,247,0.30), rgba(217,70,239,0.10) 40%, transparent 60%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(168,85,247,0.24), rgba(217,70,239,0.10) 40%, transparent 60%), ${base}`,
  );
  const gWorkout = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(244,63,94,0.30), rgba(236,72,153,0.10) 40%, transparent 60%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(244,63,94,0.24), rgba(236,72,153,0.10) 40%, transparent 60%), ${base}`,
  );
  const gMore = grad(
    `radial-gradient(120% 80% at 50% 8%, rgba(99,102,241,0.28), rgba(20,184,166,0.10) 40%, transparent 60%), ${base}`,
    `radial-gradient(120% 80% at 50% 8%, rgba(99,102,241,0.22), rgba(20,184,166,0.10) 40%, transparent 60%), ${base}`,
  );

  const muted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const track = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  const waterPct = Math.min(d.waterMl / d.waterGoalMl, 1);
  const waterRemaining = Math.max(0, d.waterGoalMl - d.waterMl);

  const mealsByType = MEAL_TYPES.map(mt => {
    const logged = d.meals.filter(m => m.meal_type === mt.id);
    return {
      ...mt,
      cal: Math.round(logged.reduce((s, m) => s + (m.calories ?? 0), 0)),
      names: logged.map(m => m.food_name ?? '').filter(Boolean).join(', '),
      has: logged.length > 0,
    };
  });
  const loggedCount = mealsByType.filter(m => m.has).length;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Side panel indicator */}
      <div className="absolute end-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-none">
        {Array.from({ length: PANELS }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 5,
              height: active === i ? 18 : 5,
              background: active === i ? 'hsl(var(--primary))' : track,
            }}
          />
        ))}
      </div>

      {/* Sliding strip — each panel is 1/PANELS of strip height = 100% of container */}
      <div
        style={{
          height: `${PANELS * 100}%`,
          transform: `translateY(${-(active / PANELS) * 100}%)`,
          transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
          willChange: 'transform',
        }}
      >
        {/* ── 1 · CALORIES ── */}
        <Panel bg={pick(gCal)}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[26px] font-black gradient-text leading-none">
                {t('dash.greeting', { name: d.name })}
              </h1>
              <p className="text-[12px] font-semibold mt-1.5" style={{ color: muted }}>{d.dateLabel}</p>
            </div>
            <div className="flex gap-1">
              <IconLink href="/stats" muted={muted}><BarChart2 size={18} /></IconLink>
              <IconLink href="/settings" muted={muted}><Settings size={18} /></IconLink>
            </div>
          </div>

          {/* Steps strip — tappable, syncs from localStorage */}
          <Link href="/steps" className="flex items-center gap-2.5 px-3 py-2 rounded-2xl mt-3 active:scale-[0.97] transition-transform" style={{ background: track }}>
            <Footprints size={16} className="text-lime-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-black tabular-nums text-lime-500">{liveSteps.toLocaleString()}</span>
                <span className="text-[11px] font-bold" style={{ color: muted }}>/ 10k</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <div
                  className="h-full rounded-full bg-lime-500 transition-all duration-500"
                  style={{ width: `${Math.min(liveSteps / 10000, 1) * 100}%` }}
                />
              </div>
            </div>
          </Link>

          <div className="flex-1 flex items-center justify-center">
            <div className="fyp-enter scale-[1.18]">
              <CalorieRing calories={d.calories} goal={d.calorieGoal} tdee={d.tdee} size={188} />
            </div>
          </div>

          {d.caloriesBurned > 0 && (
            <div className="flex items-center justify-center gap-4 mb-3 text-[12px] font-bold">
              <span style={{ color: muted }}>🔥 {t('stats.burned')} {d.caloriesBurned}</span>
              <span className="text-primary">{t('stats.net')} {d.calories - d.caloriesBurned}</span>
            </div>
          )}

          <Link href="/meals/log" className="fyp-cta">
            <Plus size={18} strokeWidth={2.6} /> {t('dash.logMeal')}
          </Link>
          <SwipeHint muted={muted} label={t('fyp.swipe')} />
        </Panel>

        {/* ── 2 · MACROS ── */}
        <Panel bg={pick(gMacro)}>
          <PoolLabel muted={muted}>{t('fyp.macros')}</PoolLabel>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <BigMacro label={t('form.protein')} value={d.protein} goal={d.proteinGoal} from="#3b82f6" to="#06b6d4" track={track} muted={muted} />
            <BigMacro label={t('form.carbs')} value={d.carbs} goal={d.carbsGoal} from="#f59e0b" to="#f97316" track={track} muted={muted} />
            <BigMacro label={t('form.fat')} value={d.fat} goal={d.fatGoal} from="#ec4899" to="#a855f7" track={track} muted={muted} />
          </div>
        </Panel>

        {/* ── 3 · MEALS ── */}
        <Panel bg={pick(gMeals)}>
          <div className="flex items-center justify-between">
            <PoolLabel muted={muted}>{t('dash.todaysMeals')}</PoolLabel>
            <span className="text-[12px] font-black tabular-nums" style={{ color: muted }}>
              {loggedCount}/{mealsByType.length}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            {mealsByType.map(m => (
              <Link
                key={m.id}
                href={`/meals/log?meal_type=${m.id}`}
                className="relative flex items-center gap-3 px-4 py-3 rounded-[18px] border active:scale-[0.98] transition-transform"
                style={{
                  background: m.has ? 'rgba(245,158,11,0.10)' : 'hsl(var(--surface))',
                  borderColor: m.has ? 'rgba(245,158,11,0.30)' : 'hsl(var(--border))',
                }}
              >
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black leading-tight">{t(m.labelKey)}</p>
                  {m.has && <p className="text-[11px] truncate" style={{ color: muted }}>{m.names}</p>}
                </div>
                {m.has ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black tabular-nums text-amber-500">{m.cal}</span>
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Check size={11} className="text-amber-500" strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: track }}>
                    <Plus size={15} strokeWidth={2.5} style={{ color: muted }} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </Panel>

        {/* ── 4 · WATER ── */}
        <Panel bg={pick(gWater)}>
          <PoolLabel muted={muted}>{t('dash.water')}</PoolLabel>
          <div className="flex-1 flex flex-col items-center justify-center">
            <Droplets size={36} className="text-sky-400 mb-4" />
            <div className="flex items-end gap-2">
              <span className="text-[72px] font-black tabular-nums leading-none text-sky-400">
                {d.waterMl >= 1000 ? (d.waterMl / 1000).toFixed(1) : d.waterMl}
              </span>
              <span className="text-2xl font-black mb-2 text-sky-400/70">
                {d.waterMl >= 1000 ? t('unit.l') : t('unit.ml')}
              </span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: muted }}>
              / {d.waterGoalMl / 1000}{t('unit.l')}
            </p>
            <div className="w-full max-w-[260px] h-2.5 rounded-full overflow-hidden mt-6" style={{ background: track }}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${waterPct * 100}%` }}
              />
            </div>
            {waterRemaining > 0 && (
              <p className="text-[12px] mt-2 font-semibold" style={{ color: muted }}>
                {t('drinks.remaining', { n: waterRemaining >= 1000 ? `${(waterRemaining / 1000).toFixed(1)}${t('unit.l')}` : `${waterRemaining}${t('unit.ml')}` })}
              </p>
            )}
          </div>
          <Link href="/drinks" className="fyp-cta" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
            <Plus size={18} strokeWidth={2.6} /> {t('drinks.quickLog')}
          </Link>
        </Panel>

        {/* ── 5 · WEIGHT ── */}
        <Panel bg={pick(gWeight)}>
          <PoolLabel muted={muted}>{t('dash.weightGoal')}</PoolLabel>
          <div className="flex-1 flex flex-col items-center justify-center">
            <Scale size={34} className="text-purple-400 mb-4" />
            <div className="flex items-end gap-2">
              <span className="text-[72px] font-black tabular-nums leading-none text-purple-300">
                {Number(d.currentWeight).toFixed(1)}
              </span>
              <span className="text-2xl font-black mb-2 text-purple-300/70">{t('unit.kg')}</span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: muted }}>
              {t('dash.toGo', { n: d.kgToGo.toFixed(1) })}
            </p>
            <div className="w-full max-w-[260px] mt-6">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: track }}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-700"
                  style={{ width: `${d.goalProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold mt-2" style={{ color: muted }}>
                <span>🎯 {Number(d.targetWeight)}{t('unit.kg')}</span>
                <span>{Math.round(d.goalProgress)}%</span>
              </div>
            </div>
          </div>
          <Link href="/weight" className="fyp-cta" style={{ background: 'linear-gradient(135deg, #a855f7, #d946ef)' }}>
            <Plus size={18} strokeWidth={2.6} /> {d.todayHasWeight ? t('dash.updateWeight') : t('dash.logWeight')}
          </Link>
        </Panel>

        {/* ── 6 · WORKOUT ── */}
        <Panel bg={pick(gWorkout)}>
          <PoolLabel muted={muted}>{t('nav.workout')}</PoolLabel>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {d.workout.hasWorkout ? (
              <>
                <span className="text-[64px] leading-none mb-4">{d.workout.emoji}</span>
                <p className="text-2xl font-black text-rose-400">{t('dash.workoutDone')}</p>
                <p className="text-sm font-semibold mt-2" style={{ color: muted }}>
                  {d.workout.typesLabel}{d.workout.totalMin > 0 && ` · ${d.workout.totalMin} ${t('unit.min')}`}
                </p>
              </>
            ) : (
              <>
                <Dumbbell size={56} className="mb-4" style={{ color: muted }} />
                <p className="text-xl font-black">{t('dash.noWorkout')}</p>
              </>
            )}
          </div>
          <Link href="/workout" className="fyp-cta" style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}>
            <Flame size={18} strokeWidth={2.4} /> {t('wk.logAction')}
          </Link>
        </Panel>

        {/* ── 7 · MORE TRACKERS ── */}
        <Panel bg={pick(gMore)}>
          <PoolLabel muted={muted}>{t('more.title')}</PoolLabel>
          <div className="flex-1 flex flex-col justify-center gap-2.5">
            <TrackerLink href="/sleep" icon={<Moon size={20} className="text-indigo-400" />} label={t('sleep.title')} muted={muted} track={track} />
            <TrackerLink href="/steps" icon={<Footprints size={20} className="text-lime-500" />} label={t('steps.title')} muted={muted} track={track} />
            <TrackerLink href="/measurements" icon={<Ruler size={20} className="text-teal-400" />} label={t('meas.title')} muted={muted} track={track} />
            <TrackerLink href="/slips" icon={<AlertTriangle size={20} className="text-rose-400" />} label={t('slips.title')} muted={muted} track={track} />
            <TrackerLink href="/stats" icon={<BarChart2 size={20} className="text-primary" />} label={t('stats.title')} muted={muted} track={track} />
          </div>
        </Panel>

      </div>
    </div>
  );
}

/* ── building blocks ── */

function Panel({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <section
      className="flex flex-col px-5 pt-[max(20px,env(safe-area-inset-top))] pb-28"
      style={{ height: `${100 / PANELS}%`, background: bg }}
    >
      {children}
    </section>
  );
}

function PoolLabel({ children, muted }: { children: React.ReactNode; muted: string }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: muted }}>
      {children}
    </p>
  );
}

function IconLink({ href, children, muted }: { href: string; children: React.ReactNode; muted: string }) {
  return (
    <Link href={href} className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-transform" style={{ color: muted }}>
      {children}
    </Link>
  );
}

function TrackerLink({
  href, icon, label, muted, track,
}: {
  href: string; icon: React.ReactNode; label: string; muted: string; track: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 rounded-[18px] border active:scale-[0.98] transition-transform"
      style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: track }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-black">{label}</span>
      <ChevronRight size={18} style={{ color: muted }} />
    </Link>
  );
}

function SwipeHint({ muted, label }: { muted: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 mt-3 animate-bounce" style={{ color: muted }}>
      <ChevronUp size={16} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function BigMacro({
  label, value, goal, from, to, track, muted,
}: {
  label: string; value: number; goal: number; from: string; to: string; track: string; muted: string;
}) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-sm font-black uppercase tracking-wider" style={{ color: muted }}>{label}</span>
        <span className="text-[28px] font-black tabular-nums leading-none" style={{ color: from }}>
          {Math.round(value)}
          <span className="text-base font-bold ms-1" style={{ color: muted }}>/{goal}g</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: track }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: pct > 10 ? `0 0 12px ${from}88` : 'none' }}
        />
      </div>
    </div>
  );
}
