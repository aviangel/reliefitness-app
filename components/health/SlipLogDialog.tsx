'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { logSlip } from '@/lib/health/actions';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

export function SlipLogDialog() {
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!what.trim()) return;
    startTransition(async () => {
      await logSlip(what.trim(), why.trim() || undefined);
      setDone(true);
      setTimeout(() => { setOpen(false); setWhat(''); setWhy(''); setDone(false); }, 1500);
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-20 right-4 flex items-center gap-2 bg-amber-500/90 text-white px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:bg-amber-500 transition-colors z-40"
        >
          <AlertTriangle size={16} />
          Log Slip
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[480px] bg-card border border-border rounded-t-3xl p-6 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold">Log a Slip</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                No judgment — just honest tracking.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-full hover:bg-muted transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={36} className="text-primary" />
              <p className="font-medium">Logged. No biggie.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">What happened?</label>
                <input
                  type="text"
                  value={what}
                  onChange={e => setWhat(e.target.value)}
                  placeholder="e.g. Ate 3 Klik bars after dinner"
                  autoFocus
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Why? (optional)</label>
                <input
                  type="text"
                  value={why}
                  onChange={e => setWhy(e.target.value)}
                  placeholder="e.g. Stressed, bored, craving"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!what.trim() || isPending}
                className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
                  !what.trim() || isPending
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-amber-500 text-white hover:bg-amber-400 active:scale-[0.98]'
                }`}
              >
                {isPending ? 'Saving...' : 'Log It'}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
