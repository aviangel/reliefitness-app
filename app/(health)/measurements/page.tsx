import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MeasurementLogForm } from '@/components/health/MeasurementLogForm';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT, getLang } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n/translations';
import { format, parseISO } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { Ruler } from 'lucide-react';

export const revalidate = 0;

type MeasurementEntry = {
  id: string;
  date: string;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
};

export default async function MeasurementsPage() {
  const t = getT();
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: historyRaw } = await supabase
    .from('measurements_log')
    .select('id,date,waist_cm,chest_cm,hips_cm,arm_cm')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const entries = (historyRaw ?? []) as MeasurementEntry[];
  const todayEntry = entries.find(e => e.date === today);

  const cols: { key: keyof MeasurementEntry; labelKey: TranslationKey }[] = [
    { key: 'waist_cm', labelKey: 'meas.waist' },
    { key: 'chest_cm', labelKey: 'meas.chest' },
    { key: 'hips_cm', labelKey: 'meas.hips' },
    { key: 'arm_cm', labelKey: 'meas.arm' },
  ];

  return (
    <ScrollShell>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Ruler size={22} className="text-teal-400" />
          {t('meas.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('meas.subtitle')}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="glass-card rounded-3xl p-4">
          <h2 className="font-semibold mb-4">{todayEntry ? t('meas.updateToday') : t('meas.logToday')}</h2>
          <MeasurementLogForm current={todayEntry ?? undefined} />
        </div>

        {entries.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">{t('meas.history')}</h2>
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="glass-card rounded-2xl px-4 py-3.5">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    {format(parseISO(entry.date), 'EEE, d MMM', { locale: dateLocale })}
                    {entry.date === today && (
                      <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">{t('common.today')}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {cols.map(({ key, labelKey }) => {
                      const v = entry[key] as number | null;
                      if (v == null) return null;
                      return (
                        <span key={key} className="text-xs text-muted-foreground">
                          {t(labelKey)}: <span className="font-bold text-teal-400 tabular-nums">{Number(v)}{t('unit.cm')}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">{t('meas.empty')}</p>
        )}
      </div>
    </ScrollShell>
  );
}
