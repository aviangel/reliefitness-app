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
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 size={48} className="text-primary" />
        <p className="text-lg font-bold">Workout logged!</p>
        <p className="text-sm text-muted-foreground">
          {w?.emoji} {w?.label} · {finalDuration} min
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Type */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Workout Type</p>
        <div className="grid grid-cols-3 gap-2">
          {WORKOUT_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => setType(wt.id)}
              className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                type === wt.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{wt.emoji}</span>
              <span className="text-xs">{wt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Duration (minutes)</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDuration(d); setCustomDuration(''); }}
              className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                duration === d && !customDuration
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom (e.g. 50)"
          value={customDuration}
          onChange={(e) => { setCustomDuration(e.target.value); }}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Notes */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Chest & back, 5km run, felt strong..."
          rows={2}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? 'Logging...' : 'Log Workout'}
      </button>
    </div>
  );
}
