'use client';

import { useTransition } from 'react';
import { deleteWorkout } from '@/lib/health/actions';
import { Trash2 } from 'lucide-react';

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteWorkout(workoutId))}
      disabled={isPending}
      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      aria-label="Delete workout"
    >
      <Trash2 size={15} />
    </button>
  );
}
