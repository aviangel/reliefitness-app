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
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch { /* audio not allowed */ }
}

export function RestTimer({
  seconds,
  nextLabel,
  onDone,
  soundOn = true,
}: {
  seconds: number;
  nextLabel: string;
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
          navigator.vibrate?.(60); // "10 seconds left" cue
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = total > 0 ? remaining / total : 0;
  const R = 130;
  const circ = 2 * Math.PI * R;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(120% 90% at 50% 20%, rgba(244,63,94,0.18), transparent 60%), hsl(var(--background))' }}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">{t('gw.restTitle')}</p>

      <div className="relative" style={{ width: 300, height: 300 }}>
        <svg width="300" height="300" className="-rotate-90">
          <circle cx="150" cy="150" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" opacity="0.35" />
          <circle
            cx="150" cy="150" r={R} fill="none" stroke="#f43f5e" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[72px] font-black tabular-nums leading-none">
            {mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : ss}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('gw.rest')}</span>
        </div>
      </div>

      <p className="mt-8 text-center text-muted-foreground text-sm">
        {t('gw.nextUp')} <span className="font-bold text-foreground">{nextLabel}</span>
      </p>

      <div className="flex gap-3 mt-8 w-full max-w-sm">
        <button
          onClick={() => { setRemaining((r) => r + 30); setTotal((tt) => tt + 30); }}
          className="flex-1 py-4 rounded-2xl font-bold text-sm bg-card border border-border active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <Plus size={16} /> {t('gw.add30')}
        </button>
        <button
          onClick={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
          className="flex-1 py-4 rounded-2xl font-bold text-sm bg-rose-500 text-white active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <SkipForward size={16} /> {t('gw.skipRest')}
        </button>
      </div>
    </div>
  );
}
