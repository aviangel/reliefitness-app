'use client';

import { useTransition } from 'react';
import { deleteMealLog } from '@/lib/health/actions';
import { Trash2 } from 'lucide-react';

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteMealLog(mealId))}
      disabled={isPending}
      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      aria-label="Delete meal"
    >
      <Trash2 size={16} />
    </button>
  );
}
