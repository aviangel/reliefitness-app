import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StepCounterLive } from '@/components/health/StepCounterLive';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT, getLang } from '@/lib/i18n/server';
import { format, parseISO } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { Footprints } from 'lucide-react';

export const revalidate = 0;

type StepsEntry = { id: string; date: string; steps: number };

export default async function StepsPage() {
  const t = getT();
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: historyRaw } = await supabase
    .from('steps_log')
    .select('id,date,steps')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const entries = (historyRaw ?? []) as StepsEntry[];
  const todayEntry = entries.find(e => e.date === today);
  const avg = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.steps, 0) / entries.length)
    : null;
  const maxSteps = Math.max(...entries.map(e => e.steps), 1);

  return (
    <ScrollShell>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Footprints size={22} className="text-lime-500" />
          {t('steps.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('steps.subtitle')}</p>
      </div>

      <div className="p-4 space-y-4">
        {avg != null && (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-lime-500 tabular-nums">{avg.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('steps.avg')}</p>
          </div>
        )}

        <StepCounterLive initialSteps={todayEntry?.steps ?? 0} />

        {entries.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">{t('steps.history')}</h2>
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="glass-card rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {format(parseISO(entry.date), 'EEE, d MMM', { locale: dateLocale })}
                      {entry.date === today && (
                        <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">{t('common.today')}</span>
                      )}
                    </p>
                    <span className="text-sm font-bold tabular-nums text-lime-500">{entry.steps.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-lime-500" style={{ width: `${(entry.steps / maxSteps) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">{t('steps.empty')}</p>
        )}
      </div>
    </ScrollShell>
  );
}
