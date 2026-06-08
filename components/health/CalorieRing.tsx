'use client';

import { useI18n } from '@/lib/i18n/context';

interface CalorieRingProps {
  calories: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ calories, goal, size = 188 }: CalorieRingProps) {
  const { t } = useI18n();
  const progress = Math.min(calories / goal, 1.05);
  const overGoal = calories > goal;
  const stroke = 14;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));
  const remaining = Math.round(goal - calories);

  const gradId = 'cr-grad';
  const glowId = 'cr-glow';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
          overflow="visible"
        >
          <defs>
            <linearGradient id={gradId} x1="1" y1="0" x2="0" y2="1">
              {overGoal ? (
                <>
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#00e5ff" />
                </>
              )}
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
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth={stroke}
          />

          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
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

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: size > 160 ? '2.6rem' : '2rem',
              color: overGoal ? '#ef4444' : '#22c55e',
              letterSpacing: '-0.02em',
            }}
          >
            {Math.round(calories)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t('ring.eaten')}
          </span>
        </div>
      </div>

      {/* Below ring */}
      <div className="text-center">
        {overGoal ? (
          <p className="text-sm font-bold text-red-400">
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
