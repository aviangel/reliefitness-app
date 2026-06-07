'use client';

import { useI18n } from '@/lib/i18n/context';

interface CalorieRingProps {
  calories: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ calories, goal, size = 160 }: CalorieRingProps) {
  const { t } = useI18n();
  const progress = Math.min(calories / goal, 1.05);
  const overGoal = calories > goal;
  const stroke = 14;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  const color = overGoal ? '#ef4444' : progress > 0.9 ? '#f59e0b' : '#22c55e';
  const remaining = Math.round(goal - calories);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {Math.round(calories)}
          </span>
          <span className="text-xs text-muted-foreground font-medium">{t('ring.eaten')}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {overGoal ? (
          <span className="text-red-400 font-medium">{t('ring.over', { n: Math.abs(remaining) })}</span>
        ) : (
          <span>{t('ring.remaining', { n: remaining })}</span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{t('ring.dailyGoal', { n: goal })}</p>
    </div>
  );
}
