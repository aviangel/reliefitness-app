'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Plus, SkipForward } from 'lucide-react';

function beep() {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.41);
  } catch { /* audio not allowed */ }
}

export function RestTimer({
  seconds,
  nextLabel,
  nextWeight,
  onDone,
  soundOn = true,
}: {
  seconds: number;
  nextLabel: string;
  nextWeight?: number | null;
  onDone: () => void;
  soundOn?: boolean;
}) {
  const { t } = useI18n();
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const doneRef = useRef(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!doneRef.current) {
            doneRef.current = true;
            navigator.vibrate?.([120, 60, 120]);
            if (soundOn) beep();
            setTimeout(onDone, 150);
          }
          return 0;
        }
        if (r === 11 && !warnedRef.current) {
          warnedRef.current = true;
          navigator.vibrate?.(60);
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = total > 0 ? remaining / total : 0;
  const R = 116;
  const circ = 2 * Math.PI * R;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-between px-5 py-8"
      style={{
        background:
          'radial-gradient(ellipse 140% 60% at 50% 10%, rgba(244,63,94,0.2), transparent 55%), hsl(var(--background))',
      }}
    >
      {/* Label */}
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-400 mt-2">
        {t('gw.restTitle')}
      </p>

      {/* Circle countdown */}
      <div className="relative" style={{ width: 272, height: 272 }}>
        <svg width="272" height="272" className="-rotate-90">
          <circle cx="136" cy="136" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" opacity="0.3" />
          <circle
            cx="136" cy="136" r={R} fill="none"
            stroke={remaining <= 10 ? '#f97316' : '#f43f5e'}
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[68px] font-black tabular-nums leading-none">
            {mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : ss}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {t('gw.rest')}
          </span>
        </div>
      </div>

      {/* Next up */}
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('gw.nextUp')}</p>
        <p className="text-base font-black">{nextLabel}</p>
        {nextWeight != null && (
          <p className="text-sm font-bold text-primary mt-0.5">{nextWeight} kg</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={() => { setRemaining((r) => r + 30); setTotal((tt) => tt + 30); }}
          className="flex-1 py-4 rounded-2xl font-bold text-sm bg-card border border-border active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <Plus size={16} /> {t('gw.add30')}
        </button>
        <button
          onClick={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
          className="flex-[1.4] py-4 rounded-2xl font-black text-sm bg-rose-500 text-white active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(244,63,94,0.4)]"
        >
          <SkipForward size={16} /> {t('gw.skipRest')}
        </button>
      </div>
    </div>
  );
}
