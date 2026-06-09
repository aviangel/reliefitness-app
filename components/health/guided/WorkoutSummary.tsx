'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Trophy, Clock, Dumbbell, Flame, Layers, Check } from 'lucide-react';
import type { SessionSummary, WorkoutPR } from './types';

const CONFETTI_COLORS = ['#22c55e', '#f43f5e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 1.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 6,
      rot: Math.random() * 360,
    })),
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-20px] rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `gw-confetti ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`@keyframes gw-confetti { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

export function WorkoutSummary({ summary, dayName }: { summary: SessionSummary; dayName: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const hasPRs = summary.prs.length > 0;

  const prLabel = (pr: WorkoutPR) =>
    pr.type === 'volume' ? `${t('gw.prVolume')} · ${pr.value}` : `${pr.exerciseName} · ${pr.value}`;

  useEffect(() => {
    if (hasPRs) navigator.vibrate?.([60, 40, 60, 40, 120]);
  }, [hasPRs]);

  const mm = Math.floor(summary.durationSec / 60);
  const ss = summary.durationSec % 60;

  const stats = [
    { icon: Dumbbell, color: '#22c55e', value: `${summary.totalVolumeKg.toLocaleString()}`, unit: t('unit.kg'), label: t('gw.totalVolume') },
    { icon: Clock, color: '#3b82f6', value: `${mm}:${String(ss).padStart(2, '0')}`, unit: '', label: t('gw.elapsed') },
    { icon: Flame, color: '#f97316', value: `${summary.estimatedCalories}`, unit: t('unit.kcal'), label: t('gw.calories') },
    { icon: Layers, color: '#a855f7', value: `${summary.totalSets}`, unit: '', label: t('gw.setsDone') },
  ];

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto"
      style={{ background: 'radial-gradient(120% 70% at 50% 0%, rgba(34,197,94,0.18), transparent 55%), hsl(var(--background))' }}>
      {hasPRs && <Confetti />}
      <div className="px-5 pt-[max(32px,env(safe-area-inset-top))] pb-10 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <Check size={44} strokeWidth={3} className="text-black" />
          </div>
          <h1 className="text-3xl font-black">{t('gw.complete')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{dayName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map(({ icon: Icon, color, value, unit, label }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <Icon size={20} className="mx-auto mb-2" style={{ color }} />
              <p className="text-2xl font-black tabular-nums leading-none">
                {value}<span className="text-sm font-bold text-muted-foreground ms-0.5">{unit}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        {hasPRs && (
          <div className="rounded-3xl p-5 mb-5 bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={22} className="text-amber-400" />
              <h2 className="text-lg font-black text-amber-300">{t('gw.newPRs')}</h2>
            </div>
            <div className="space-y-2">
              {summary.prs.map((pr, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-amber-400">🏆</span>
                  <span>{prLabel(pr)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push('/workout')}
          className="w-full py-5 rounded-2xl font-black text-base bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform"
        >
          {t('gw.done')}
        </button>
      </div>
    </div>
  );
}
