import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WeightLogForm } from '@/components/health/WeightLogForm';
import { format, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export const revalidate = 0;

export default async function WeightPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: history } = await supabase
    .from('weight_log')
    .select('id,date,weight_kg,notes')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const entries = history ?? [];
  const todayEntry = entries.find(e => e.date === today);
  const latestWeight = entries[0]?.weight_kg;
  const prevWeight = entries[1]?.weight_kg;
  const delta = latestWeight && prevWeight ? Number(latestWeight) - Number(prevWeight) : null;

  return (
    <div>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold">Weight Log</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-6">
        {delta !== null && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${
            delta < 0
              ? 'bg-primary/10 text-primary'
              : delta > 0
              ? 'bg-red-500/10 text-red-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {delta < 0 ? <TrendingDown size={18} /> : delta > 0 ? <TrendingUp size={18} /> : <Minus size={18} />}
            <span>
              {delta < 0 ? `Down ${Math.abs(delta).toFixed(1)} kg from last entry` :
               delta > 0 ? `Up ${delta.toFixed(1)} kg from last entry` :
               'Same as last entry'}
            </span>
          </div>
        )}

        <div className="bg-card rounded-3xl border border-border p-4">
          <h2 className="font-semibold mb-4">
            {todayEntry ? 'Update Today\'s Weight' : 'Log Today\'s Weight'}
          </h2>
          <WeightLogForm currentWeight={todayEntry ? Number(todayEntry.weight_kg) : undefined} />
        </div>

        {entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">History</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {entries.map((entry, i) => {
                const prev = entries[i + 1];
                const diff = prev ? Number(entry.weight_kg) - Number(prev.weight_kg) : null;
                return (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {format(parseISO(entry.date), 'EEE, MMM d')}
                        {entry.date === today && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">Today</span>
                        )}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold tabular-nums">{Number(entry.weight_kg).toFixed(1)} kg</span>
                      {diff !== null && (
                        <p className={`text-xs tabular-nums ${
                          diff < 0 ? 'text-primary' : diff > 0 ? 'text-red-400' : 'text-muted-foreground'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
