'use client';

import { useI18n } from '@/lib/i18n/context';

interface CalorieRingProps {
  calories: number;
  goal: number;
  tdee?: number;
  size?: number;
}

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

// Draw arc from `from` to `to` (0–1 fractions of circumference).
// Uses leading-zero trick so offset is always 0 — avoids dashoffset math.
function arcSegment(from: number, to: number, circ: number) {
  if (from <= 0) {
    return { strokeDasharray: `${(to - from) * circ} ${circ}` as const, strokeDashoffset: 0 };
  }
  const len = (to - from) * circ;
  return {
    strokeDasharray: `0 ${from * circ} ${len} ${circ}` as const,
    strokeDashoffset: 0,
  };
}

export function CalorieRing({ calories, goal, tdee, size = 188 }: CalorieRingProps) {
  const { t } = useI18n();

  const hasTdee = tdee != null && tdee > 0;
  const ringMax = hasTdee ? tdee! : goal;
  const colorPct = ringMax > 0 ? calories / ringMax : 0;
  const arcPct = Math.min(colorPct, 1); // inner arc fills 0 → TDEE (maintenance)

  const stroke = 14;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - arcPct);

  const remaining = Math.round(goal - calories);
  const overGoal = calories > goal;

  const hsl = ringHsl(colorPct);
  const colorPrimary = toHsl(hsl);
  const colorLight = toHsl(hsl, 12);

  const gradId = 'cr-grad';
  const glowId = 'cr-glow';
  const cx = size / 2;
  const cy = size / 2;

  // Outer zone ring — clearly visible band outside the track
  const outerStroke = 6;
  const outerGap = 4; // gap between track outer edge and zone ring inner edge
  const outerRadius = radius + stroke / 2 + outerGap + outerStroke / 2;
  const outerCirc = 2 * Math.PI * outerRadius;

  // Deficit: 0–75% | Approaching maintenance: 75–100%
  const defSeg = arcSegment(0, 0.75, outerCirc);
  const mntSeg = arcSegment(0.75, 1.0, outerCirc);

  // Goal tick — radial line across the zone ring at goal/TDEE fraction
  const goalFraction = hasTdee ? Math.min(goal / tdee!, 1) : null;
  let tx1 = 0, ty1 = 0, tx2 = 0, ty2 = 0;
  if (goalFraction !== null) {
    const ang = goalFraction * 2 * Math.PI;
    const rInner = radius - stroke / 2 - 1;
    const rOuter = outerRadius + outerStroke / 2 + 2;
    tx1 = cx + rInner * Math.cos(ang);
    ty1 = cy + rInner * Math.sin(ang);
    tx2 = cx + rOuter * Math.cos(ang);
    ty2 = cy + rOuter * Math.sin(ang);
  }

  // Status label + delta
  type Status = 'deficit' | 'maintenance' | 'surplus';
  let status: Status = 'deficit';
  if (hasTdee) {
    if (colorPct > 1.025) status = 'surplus';
    else if (colorPct >= 0.975) status = 'maintenance';
    else status = 'deficit';
  }
  const statusColors: Record<Status, string> = {
    deficit: 'hsl(142, 65%, 48%)',
    maintenance: 'hsl(43, 90%, 55%)',
    surplus: 'hsl(4, 85%, 55%)',
  };
  const statusColor = statusColors[status];
  const tdeeDelta = hasTdee ? Math.abs(Math.round(calories - tdee!)) : 0;

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

          {/* ── Outer zone ring ── */}
          {hasTdee && (
            <>
              {/* Full-ring background */}
              <circle cx={cx} cy={cy} r={outerRadius} fill="none"
                stroke="hsl(0, 0%, 10%)" strokeWidth={outerStroke} />
              {/* Deficit zone: 0–75% of TDEE */}
              <circle cx={cx} cy={cy} r={outerRadius} fill="none"
                stroke="hsl(142, 52%, 20%)" strokeWidth={outerStroke}
                strokeLinecap="butt"
                strokeDasharray={defSeg.strokeDasharray}
                strokeDashoffset={defSeg.strokeDashoffset}
              />
              {/* Approaching-maintenance zone: 75–100% of TDEE */}
              <circle cx={cx} cy={cy} r={outerRadius} fill="none"
                stroke="hsl(38, 72%, 20%)" strokeWidth={outerStroke}
                strokeLinecap="butt"
                strokeDasharray={mntSeg.strokeDasharray}
                strokeDashoffset={mntSeg.strokeDashoffset}
              />
              {/* Goal tick mark */}
              {goalFraction !== null && (
                <line x1={tx1} y1={ty1} x2={tx2} y2={ty2}
                  stroke="white" strokeWidth={2} strokeLinecap="round" opacity={0.65} />
              )}
            </>
          )}

          {/* Main track */}
          <circle cx={cx} cy={cy} r={radius}
            fill="none" stroke="#1c1c1c" strokeWidth={stroke} />

          {/* Progress arc */}
          <circle cx={cx} cy={cy} r={radius}
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
          <span className="font-black tabular-nums leading-none"
            style={{
              fontSize: size > 160 ? '2.6rem' : '2rem',
              color: colorPrimary,
              letterSpacing: '-0.02em',
              transition: 'color 0.5s',
            }}>
            {Math.round(calories)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t('ring.eaten')}
          </span>
        </div>
      </div>

      {/* Labels */}
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

        {/* Status badge */}
        {hasTdee && (
          <div className="mt-2 flex flex-col items-center gap-0.5">
            <span className="text-[11px] font-black uppercase tracking-[0.12em] px-2.5 py-0.5 rounded-full"
              style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 12%, transparent)` }}>
              {t(`ring.${status}` as 'ring.deficit')}
            </span>
            {status !== 'maintenance' && (
              <span className="text-[10px] text-muted-foreground/50">
                {status === 'deficit'
                  ? t('ring.toMaintenance', { n: tdeeDelta })
                  : t('ring.pastMaintenance', { n: tdeeDelta })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
