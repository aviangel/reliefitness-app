'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Footprints } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { logSteps } from '@/lib/health/actions';

const STEP_GOAL = 10000;
const THRESHOLD = 1.5;   // m/s² — peak magnitude to count as step
const COOLDOWN_MS = 300; // minimum ms between two steps
const ALPHA = 0.8;       // low-pass filter: higher = smoother but laggier

function todayKey() {
  return `rf-steps-${new Date().toISOString().slice(0, 10)}`;
}

type Status = 'idle' | 'counting' | 'denied' | 'unsupported';

export function StepCounterLive({ initialSteps = 0 }: { initialSteps?: number }) {
  const { t } = useI18n();
  const [steps, setSteps] = useState(initialSteps);
  const [status, setStatus] = useState<Status>('idle');
  const [pulse, setPulse] = useState(false);

  // Refs so event handler stays stable across re-renders
  const filteredRef = useRef(0);
  const lastStepRef = useRef(0);
  const prevPeakRef = useRef(false);
  const stepsRef = useRef(initialSteps);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // On mount: prefer localStorage over the server-fetched value (user might
  // have been counting earlier in the session before a page reload).
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(todayKey()) ?? '0', 10);
    const initial = Math.max(initialSteps, stored);
    stepsRef.current = initial;
    setSteps(initial);
  }, [initialSteps]);

  const saveToDb = useCallback(async (count: number) => {
    try { await logSteps(count); } catch { /* best-effort */ }
  }, []);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.acceleration;
    if (!a || a.x == null) return;

    const raw = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
    filteredRef.current = ALPHA * filteredRef.current + (1 - ALPHA) * raw;

    const isPeak = filteredRef.current > THRESHOLD;
    if (isPeak && !prevPeakRef.current) {
      const now = Date.now();
      if (now - lastStepRef.current > COOLDOWN_MS) {
        lastStepRef.current = now;
        stepsRef.current += 1;
        const n = stepsRef.current;
        setSteps(n);
        setPulse(true);
        setTimeout(() => setPulse(false), 180);
        localStorage.setItem(todayKey(), String(n));

        // Debounced DB write — every ~50 steps or after 5 s of inactivity
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveToDb(n), 5000);
      }
    }
    prevPeakRef.current = isPeak;
  }, [saveToDb]);

  const start = useCallback(async () => {
    if (!('DeviceMotionEvent' in window)) {
      setStatus('unsupported');
      return;
    }
    // iOS 13+ requires a user-gesture permission request
    const DME = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof DME.requestPermission === 'function') {
      try {
        const res = await DME.requestPermission();
        if (res !== 'granted') { setStatus('denied'); return; }
      } catch {
        setStatus('denied');
        return;
      }
    }
    setStatus('counting');
    window.addEventListener('devicemotion', handleMotion as EventListener);
  }, [handleMotion]);

  // Flush & cleanup when unmounting / navigating away
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion as EventListener);
      clearTimeout(saveTimer.current);
      if (stepsRef.current > 0) saveToDb(stepsRef.current);
    };
  }, [handleMotion, saveToDb]);

  const pct = Math.min(steps / STEP_GOAL, 1);
  const segments = 20;

  return (
    <div className="space-y-4">
      {/* Big counter ring-style display */}
      <div className="bg-card border border-border rounded-3xl p-6 text-center">
        <div className={`transition-transform duration-150 ${pulse ? 'scale-[1.06]' : 'scale-100'}`}>
          <Footprints
            size={36}
            className={`mx-auto mb-3 text-lime-500 transition-transform duration-150 ${pulse ? 'scale-125' : ''}`}
          />
          <p className="text-[68px] font-black tabular-nums leading-none text-lime-500">
            {steps.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            / {STEP_GOAL.toLocaleString()} {t('unit.steps')}
          </p>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-[3px] mt-6 px-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: i / segments < pct ? '#84cc16' : 'hsl(var(--muted))',
                opacity: i / segments < pct ? (0.6 + (i / segments) * 0.4) : 0.35,
              }}
            />
          ))}
        </div>
        <p className="text-xs font-bold text-lime-500 mt-2">{Math.round(pct * 100)}%</p>
      </div>

      {/* Status / CTA */}
      {status === 'idle' && (
        <button
          onClick={start}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-lime-500 text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
        >
          <Footprints size={18} />
          {t('steps.start')}
        </button>
      )}
      {status === 'counting' && (
        <div className="flex items-center justify-center gap-2 py-3 text-lime-500 font-semibold text-sm">
          <Footprints size={18} className={pulse ? 'scale-125 transition-transform' : 'transition-transform'} />
          {t('steps.counting')}
        </div>
      )}
      {status === 'denied' && (
        <p className="text-center text-sm text-rose-400 px-4">{t('steps.permDenied')}</p>
      )}
      {status === 'unsupported' && (
        <p className="text-center text-sm text-muted-foreground px-4">{t('steps.unsupported')}</p>
      )}
    </div>
  );
}
