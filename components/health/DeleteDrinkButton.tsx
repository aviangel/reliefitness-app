'use client';

import { useTransition } from 'react';
import { deleteDrink } from '@/lib/health/actions';
import { X } from 'lucide-react';

export function DeleteDrinkButton({ drinkId }: { drinkId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteDrink(drinkId))}
      disabled={isPending}
      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
      aria-label="Delete drink"
    >
      <X size={14} />
    </button>
  );
}
