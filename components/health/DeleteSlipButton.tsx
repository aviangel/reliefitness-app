'use client';

import { useTransition } from 'react';
import { deleteSlip } from '@/lib/health/actions';
import { Trash2 } from 'lucide-react';

export function DeleteSlipButton({ slipId }: { slipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteSlip(slipId))}
      disabled={isPending}
      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
      aria-label="Delete slip"
    >
      <Trash2 size={15} />
    </button>
  );
}
