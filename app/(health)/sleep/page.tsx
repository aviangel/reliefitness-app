import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SleepLogForm } from '@/components/health/SleepLogForm';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT, getLang } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { format, parseISO } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { Moon } from 'lucide-react';

export const revalidate = 0;

type SleepEntry = { id: string; date: string; hours: number; quality: number | null; notes: string | null };

const QUALITY_KEYS: TranslationKey[] = ['sleep.q1', 'sleep.q2', 'sleep.q3', 'sleep.q4', 'sleep.q5'];

export default async function SleepPage() {
  const t = getT();
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: historyRaw } = await supabase
    .from('sleep_log')
    .select('id,date,hours,quality,notes')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const entries = (historyRaw ?? []) as SleepEntry[];
  const todayEntry = entries.find(e => e.date === today);
  const avg = entries.length > 0
    ? (entries.reduce((s, e) => s + Number(e.hours), 0) / entries.length).toFixed(1)
    : null;

  return (
    <ScrollShell>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Moon size={22} className="text-indigo-400" />
          {t('sleep.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('sleep.subtitle')}</p>
      </div>

      <div className="p-4 space-y-4">
        {avg && (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400 tabular-nums">{avg}<span className="text-base text-muted-foreground font-medium ms-1">{t('unit.hours')}</span></p>
            <p className="text-xs text-muted-foreground mt-1">{t('sleep.avg')}</p>
          </div>
        )}

        <div className="glass-card rounded-3xl p-4">
          <h2 className="font-semibold mb-4">{todayEntry ? t('sleep.updateToday') : t('sleep.logToday')}</h2>
          <SleepLogForm
            currentHours={todayEntry ? Number(todayEntry.hours) : undefined}
            currentQuality={todayEntry?.quality ?? undefined}
          />
        </div>

        {entries.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">{t('sleep.history')}</h2>
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="glass-card rounded-2xl flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {format(parseISO(entry.date), 'EEE, d MMM', { locale: dateLocale })}
                      {entry.date === today && (
                        <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">{t('common.today')}</span>
                      )}
                    </p>
                    {entry.quality != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t(QUALITY_KEYS[entry.quality - 1])}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold tabular-nums text-indigo-400">
                    {Number(entry.hours)}<span className="text-xs text-muted-foreground font-medium ms-0.5">{t('unit.hours')}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">{t('sleep.empty')}</p>
        )}
      </div>
    </ScrollShell>
  );
}
