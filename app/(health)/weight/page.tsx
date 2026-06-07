import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WeightLogForm } from '@/components/health/WeightLogForm';
import { getT } from '@/lib/i18n/server';
import { format, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react';

export const revalidate = 0;

type WeightEntry = { id: string; date: string; weight_kg: number; notes: string | null };

export default async function WeightPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: historyRaw } = await supabase
    .from('weight_log')
    .select('id,date,weight_kg,notes')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const entries = (historyRaw ?? []) as WeightEntry[];
  const todayEntry = entries.find(e => e.date === today);
  const latestWeight = entries[0]?.weight_kg;
  const prevWeight = entries[1]?.weight_kg;
  const delta = latestWeight != null && prevWeight != null
    ? Number(latestWeight) - Number(prevWeight)
    : null;

  return (
    <div>
      <div className="px-4 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Scale size={22} className="text-primary" />
          <h1 className="text-xl font-bold">{t('weight.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Delta card */}
        {delta !== null && (
          <div className={`glass-card rounded-2xl flex items-center gap-3 px-5 py-4 ${
            delta < 0 ? 'border-primary/20' : delta > 0 ? 'border-red-500/20' : ''
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              delta < 0 ? 'bg-primary/15' : delta > 0 ? 'bg-red-500/15' : 'bg-white/[0.06]'
            }`}>
              {delta < 0
                ? <TrendingDown size={20} className="text-primary" />
                : delta > 0
                ? <TrendingUp size={20} className="text-red-400" />
                : <Minus size={20} className="text-muted-foreground" />}
            </div>
            <div>
              <p className={`text-base font-bold ${
                delta < 0 ? 'text-primary' : delta > 0 ? 'text-red-400' : 'text-foreground'
              }`}>
                {delta < 0 ? t('weight.down', { n: Math.abs(delta).toFixed(1) }) : delta > 0 ? t('weight.up', { n: delta.toFixed(1) }) : t('weight.noChange')}
              </p>
              <p className="text-xs text-muted-foreground">
                {delta < 0 ? t('weight.downMsg') :
                 delta > 0 ? t('weight.upMsg') :
                 t('weight.sameMsg')}
              </p>
            </div>
          </div>
        )}

        {/* Log form */}
        <div className="glass-card rounded-3xl p-4">
          <h2 className="font-semibold mb-4">
            {todayEntry ? t('weight.updateToday') : t('weight.logToday')}
          </h2>
          <WeightLogForm currentWeight={todayEntry ? Number(todayEntry.weight_kg) : undefined} />
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">{t('weight.history')}</h2>
            <div className="space-y-2">
              {entries.map((entry, i) => {
                const prev = entries[i + 1];
                const diff = prev != null ? Number(entry.weight_kg) - Number(prev.weight_kg) : null;
                return (
                  <div key={entry.id} className="glass-card rounded-2xl flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {format(parseISO(entry.date), 'EEE, MMM d')}
                        {entry.date === today && (
                          <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">{t('common.today')}</span>
                        )}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold tabular-nums">{Number(entry.weight_kg).toFixed(1)} {t('unit.kg')}</span>
                      {diff !== null && (
                        <p className={`text-xs tabular-nums font-medium ${
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
