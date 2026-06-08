import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SlipLogForm } from '@/components/health/SlipLogForm';
import { DeleteSlipButton } from '@/components/health/DeleteSlipButton';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT, getLang } from '@/lib/i18n/server';
import { format, parseISO } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';

export const revalidate = 0;

type SlipEntry = { id: string; date: string; what: string; why: string | null; created_at: string };

export default async function SlipsPage() {
  const t = getT();
  const lang = getLang();
  const dateLocale = lang === 'he' ? heLocale : undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: historyRaw } = await supabase
    .from('slip_log')
    .select('id,date,what,why,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  const entries = (historyRaw ?? []) as SlipEntry[];

  return (
    <ScrollShell>
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle size={22} className="text-rose-400" />
          {t('slips.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('slips.subtitle')}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="glass-card rounded-3xl p-4">
          <h2 className="font-semibold mb-4">{t('slips.log')}</h2>
          <SlipLogForm />
        </div>

        {entries.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">{t('slips.history')}</h2>
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="glass-card rounded-2xl flex items-start gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.what}</p>
                    {entry.why && <p className="text-xs text-muted-foreground mt-0.5">{entry.why}</p>}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {format(parseISO(entry.date), 'EEE, d MMM', { locale: dateLocale })}
                    </p>
                  </div>
                  <DeleteSlipButton slipId={entry.id} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">{t('slips.empty')}</p>
        )}
      </div>
    </ScrollShell>
  );
}
