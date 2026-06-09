'use client';

import { useI18n } from '@/lib/i18n/context';

interface CalorieRingProps {
  calories: number;
  goal: number;
  tdee?: number;
  size?: number;
}

// Smooth HSL interpolation across four zones based on calories / goal ratio.
// ≤ 75 %  →  green (comfortably in deficit)
// 75–100 %  →  green → amber (shrinking deficit, approaching maintenance)
// 100–115 %  →  amber → red (blown the deficit, at/past maintenance)
// 115 %+  →  red → deep crimson (in surplus)
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function ringHsl(pct: number): [number, number, number] {
  if (pct <= 0.75) return [142, 71, 45];
  if (pct <= 1.0) {
    const t = (pct - 0.75) / 0.25;
    return [lerp(142, 43, t), lerp(71, 94, t), lerp(45, 52, t)];
  }
  if (pct <= 1.15) {
    const t = (pct - 1.0) / 0.15;
    return [lerp(43, 4, t), lerp(94, 85, t), lerp(52, 50, t)];
  }
  const t = Math.min((pct - 1.15) / 0.25, 1);
  return [lerp(4, 0, t), lerp(85, 88, t), lerp(50, 36, t)];
}
function toHsl([h, s, l]: [number, number, number], lightnessOffset = 0) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l + lightnessOffset)}%)`;
}

export function CalorieRing({ calories, goal, tdee, size = 188 }: CalorieRingProps) {
  const { t } = useI18n();
  const pct = goal > 0 ? calories / goal : 0;
  // Color is keyed to TDEE (metabolic maintenance), not the user goal.
  // If tdee isn't available yet fall back to goal so the logic stays sensible.
  const colorPct = (tdee ?? goal) > 0 ? calories / (tdee ?? goal) : 0;
  const stroke = 14;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(pct, 1));
  const remaining = Math.round(goal - calories);
  const overGoal = calories > goal;

  const hsl = ringHsl(colorPct);
  const colorPrimary = toHsl(hsl);
  const colorLight = toHsl(hsl, 12); // slightly lighter for gradient start

  const gradId = 'cr-grad';
  const glowId = 'cr-glow';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} overflow="visible">
          <defs>
            <linearGradient id={gradId} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorLight} />
              <stop offset="100%" stopColor={colorPrimary} />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#1c1c1c" strokeWidth={stroke}
          />

          {/* Progress arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            filter={`url(#${glowId})`}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: size > 160 ? '2.6rem' : '2rem',
              color: colorPrimary,
              letterSpacing: '-0.02em',
              transition: 'color 0.5s',
            }}
          >
            {Math.round(calories)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t('ring.eaten')}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        {overGoal ? (
          <p className="text-sm font-bold" style={{ color: colorPrimary, transition: 'color 0.5s' }}>
            {t('ring.over', { n: Math.abs(remaining) })}
          </p>
        ) : (
          <p className="text-sm font-semibold text-muted-foreground">
            {t('ring.remaining', { n: remaining })}
          </p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {t('ring.dailyGoal', { n: goal })}
        </p>
      </div>
    </div>
  );
}
