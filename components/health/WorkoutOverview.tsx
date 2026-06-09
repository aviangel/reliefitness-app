import { getT, getLang } from '@/lib/i18n/server';
import { startSession } from '@/lib/health/workout-actions';
import { Play, Dumbbell, ChevronRight } from 'lucide-react';

export interface OverviewTemplate {
  id: string;
  dayOrder: number;
  dayName: string;
  phase: string | null;
  exercises: { nameEn: string; nameHe: string | null }[];
}

export function WorkoutOverview({
  templates, recommendedOrder,
}: {
  templates: OverviewTemplate[]; recommendedOrder: number;
}) {
  const t = getT();
  const lang = getLang();

  const recommended = templates.find((x) => x.dayOrder === recommendedOrder) ?? templates[0];
  const others = templates.filter((x) => x.id !== recommended?.id);

  const exName = (e: { nameEn: string; nameHe: string | null }) =>
    lang === 'he' && e.nameHe ? e.nameHe : e.nameEn;

  if (!recommended) return null;

  return (
    <div className="space-y-4">
      {/* Recommended / today's workout */}
      <div className="rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/15 to-rose-500/10">
        <div className="px-5 pt-5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('gw.todaysPlan')}</span>
          <h2 className="text-2xl font-black mt-1.5">{recommended.dayName}</h2>
          {recommended.phase && <p className="text-xs font-semibold text-muted-foreground mt-0.5">{recommended.phase}</p>}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {recommended.exercises.slice(0, 5).map((e, i) => (
              <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-card/60 text-muted-foreground">
                {exName(e)}
              </span>
            ))}
            {recommended.exercises.length > 5 && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-card/60 text-muted-foreground">
                +{recommended.exercises.length - 5}
              </span>
            )}
          </div>
        </div>

        <form action={startSession.bind(null, recommended.id)} className="p-5 pt-4">
          <button
            type="submit"
            className="w-full py-5 rounded-2xl font-black text-base bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,197,94,0.4)]"
          >
            <Play size={22} strokeWidth={3} fill="currentColor" /> {t('gw.startWorkout')}
          </button>
        </form>
      </div>

      {/* Other days */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">{t('gw.otherDays')}</h3>
        <div className="space-y-2">
          {others.map((tpl) => (
            <form key={tpl.id} action={startSession.bind(null, tpl.id)}>
              <button
                type="submit"
                className="w-full glass-card rounded-2xl flex items-center gap-3 px-4 py-3.5 active:scale-[0.98] transition-transform text-start"
              >
                <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Dumbbell size={18} className="text-rose-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{tpl.dayName}</p>
                  <p className="text-xs text-muted-foreground">{t('gw.exerciseCount', { n: tpl.exercises.length })}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
