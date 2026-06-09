'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { X, Clock } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import { SetLogger } from './SetLogger';
import { RestTimer } from './RestTimer';
import { WorkoutTransition } from './WorkoutTransition';
import { WorkoutSummary } from './WorkoutSummary';
import { logSet, finishSession, abandonSession } from '@/lib/health/workout-actions';
import type { GuidedExercise, GuidedSession, SessionSummary } from './types';

type Phase = 'active' | 'rest' | 'transition' | 'finishing' | 'summary';

export function GuidedWorkoutScreen({
  session, exercises, lang,
}: {
  session: GuidedSession; exercises: GuidedExercise[]; lang: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('active');
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Live elapsed timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase === 'summary') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);
  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;

  // Per-exercise running defaults (prefill next set with what you just did)
  const defaultsRef = useRef<Record<string, { weight: number; reps: number }>>({});

  const ex = exercises[exIndex];
  const nextEx = exercises[exIndex + 1];

  const getDefaults = (e: GuidedExercise) => {
    const d = defaultsRef.current[e.exerciseId];
    return d ?? { weight: e.defaultWeight, reps: e.defaultReps };
  };

  const handleDoneSet = async (weight: number, reps: number, wasFailure: boolean) => {
    defaultsRef.current[ex.exerciseId] = { weight, reps };

    try {
      await logSet({
        sessionId: session.id,
        exerciseId: ex.exerciseId,
        setNumber: setIndex + 1,
        weightKg: weight,
        reps,
        wasFailure,
      });
    } catch { /* keep flowing even if a write blips */ }

    const isLastSet = setIndex + 1 >= ex.targetSets;
    const isLastExercise = exIndex + 1 >= exercises.length;

    if (!isLastSet) {
      setPhase('rest');
    } else if (!isLastExercise) {
      setPhase('transition');
    } else {
      setPhase('finishing');
      try {
        const s = await finishSession(session.id);
        setSummary(s);
        setPhase('summary');
      } catch {
        router.push('/workout');
      }
    }
  };

  const handleRestDone = () => {
    setSetIndex((i) => i + 1);
    setPhase('active');
  };

  const handleTransitionContinue = () => {
    setExIndex((i) => i + 1);
    setSetIndex(0);
    setPhase('active');
  };

  const quit = async () => {
    if (!window.confirm(t('gw.quitConfirm'))) return;
    await abandonSession(session.id);
    router.push('/workout');
  };

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (phase !== 'summary') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [phase]);

  const totalSets = exercises.reduce((s, e) => s + e.targetSets, 0);
  const doneSets = exercises.slice(0, exIndex).reduce((s, e) => s + e.targetSets, 0) + setIndex;
  const progressPct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      style={{ maxWidth: 480, margin: '0 auto' }}
    >
      {phase === 'summary' && summary ? (
        <WorkoutSummary summary={summary} dayName={session.dayName} />
      ) : (
        <>
          {/* ── HEADER ── */}
          <div className="shrink-0 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={quit}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
              >
                <X size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold truncate flex items-center gap-1.5">
                    {session.dayName}
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground tabular-nums">
                      <Clock size={10} />
                      {mm}:{String(ss).padStart(2, '0')}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums shrink-0 ms-2">
                    {t('gw.exerciseProgress', { a: exIndex + 1, b: exercises.length })}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SCROLLABLE EXERCISE CONTENT ── */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-4 pt-4">
              <ExerciseCard exercise={ex} lang={lang} />
            </div>
          </div>

          {/* ── STICKY ACTION FOOTER ── never scrolls away ── */}
          <div
            className="shrink-0 border-t border-border/50"
            style={{ boxShadow: '0 -16px 32px -8px rgba(0,0,0,0.35)' }}
          >
            <SetLogger
              key={`${ex.exerciseId}-${setIndex}`}
              exercise={ex}
              defaultWeight={getDefaults(ex).weight}
              defaultReps={getDefaults(ex).reps}
              setIndex={setIndex}
              onDone={handleDoneSet}
            />
          </div>

          {/* ── OVERLAYS (cover entire screen including footer) ── */}
          {phase === 'finishing' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <p className="text-sm font-bold text-muted-foreground animate-pulse">{t('gw.saving')}</p>
            </div>
          )}

          {phase === 'rest' && (
            <RestTimer
              seconds={ex.restSeconds}
              nextLabel={
                nextEx
                  ? (lang === 'he' && nextEx.nameHe ? nextEx.nameHe : nextEx.nameEn)
                  : `${session.dayName} · ${t('gw.setOf', { a: setIndex + 2, b: ex.targetSets })}`
              }
              nextWeight={nextEx?.targetWeight ?? nextEx?.suggestedWeight ?? null}
              onDone={handleRestDone}
            />
          )}

          {phase === 'transition' && nextEx && (
            <WorkoutTransition next={nextEx} lang={lang} onContinue={handleTransitionContinue} />
          )}
        </>
      )}
    </div>
  );
}
