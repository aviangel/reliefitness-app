'use client';

import { useState, useTransition } from 'react';
import { logWorkout } from '@/lib/health/actions';
import { CheckCircle2 } from 'lucide-react';

const WORKOUT_TYPES = [
  { id: 'gym', label: 'Gym', emoji: '🏋️' },
  { id: 'walk', label: 'Walk', emoji: '🚶' },
  { id: 'run', label: 'Run', emoji: '🏃' },
  { id: 'swim', label: 'Swim', emoji: '🏊' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴' },
  { id: 'other', label: 'Other', emoji: '💪' },
];

const DURATIONS = [20, 30, 45, 60, 75, 90];

export function WorkoutLogForm() {
  const [type, setType] = useState('gym');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const finalDuration = customDuration ? parseInt(customDuration) : duration;

  const handleSubmit = () => {
    if (!finalDuration || finalDuration < 1) {
      setError('Enter a valid duration');
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await logWorkout(type, finalDuration, notes || undefined);
        setDone(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to log workout');
      }
    });
  };

  if (done) {
    const w = WORKOUT_TYPES.find((t) => t.id === type);
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-primary" />
        </div>
        <p className="text-lg font-bold">Workout logged!</p>
        <p className="text-sm text-muted-foreground">
          {w?.emoji} {w?.label} &middot; {finalDuration} min
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Workout Type</p>
        <div className="grid grid-cols-3 gap-2">
          {WORKOUT_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => setType(wt.id)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-sm font-medium transition-all ${
                type === wt.id
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
              }`}
            >
              <span className="text-2xl">{wt.emoji}</span>
              <span className="text-xs font-medium">{wt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Duration</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDuration(d); setCustomDuration(''); }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                duration === d && !customDuration
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom duration (minutes)"
          value={customDuration}
          onChange={(e) => { setCustomDuration(e.target.value); }}
          className="mt-2.5 w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Chest & back, 5km run, felt strong..."
          rows={2}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
          isPending
            ? 'bg-white/[0.04] text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:opacity-90'
        }`}
      >
        {isPending ? 'Logging...' : 'Log Workout'}
      </button>
    </div>
  );
}
