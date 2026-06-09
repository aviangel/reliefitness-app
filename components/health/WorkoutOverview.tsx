import { getT, getLang } from '@/lib/i18n/server';
import { startSession } from '@/lib/health/workout-actions';
import { Play, Dumbbell, ChevronRight } from 'lucide-react';

export interface OverviewTemplate {
  id: string;
  dayOrder: number;
  dayName: string;
  phase: string | null;
  coachNote?: string | null;
  exercises: { nameEn: string; nameHe: string | null; weightKg?: number | null }[];
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

      {/* ── HERO: today's recommended workout ── */}
      <div
        className="rounded-[28px] overflow-hidden border border-primary/20"
        style={{
          background:
            'radial-gradient(ellipse 140% 70% at 5% 5%, rgba(34,197,94,0.22), transparent 55%), hsl(var(--card))',
        }}
      >
        <div className="px-5 pt-5 pb-4">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
            {t('gw.todaysPlan')}
          </span>
          <h2 className="text-3xl font-black leading-tight">{recommended.dayName}</h2>
          {recommended.phase && (
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{recommended.phase}</p>
          )}
          {recommended.coachNote && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{recommended.coachNote}</p>
          )}

          {/* Exercise list with weights */}
          <div className="mt-3 space-y-1.5">
            {recommended.exercises.slice(0, 6).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="font-medium text-foreground/80">{exName(e)}</span>
                {e.weightKg != null && (
                  <span className="text-xs font-bold text-primary ms-auto">{e.weightKg}kg</span>
                )}
              </div>
            ))}
            {recommended.exercises.length > 6 && (
              <p className="text-xs text-muted-foreground ps-3.5">
                +{recommended.exercises.length - 6} {t('gw.moreExercises')}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">
          <form action={startSession.bind(null, recommended.id)}>
            <button
              type="submit"
              className="w-full py-5 rounded-2xl font-black text-base bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2.5 shadow-[0_6px_28px_rgba(34,197,94,0.5)]"
            >
              <Play size={22} strokeWidth={3} fill="currentColor" />
              {t('gw.startWorkout')}
            </button>
          </form>
        </div>
      </div>

      {/* ── OTHER DAYS: horizontal scroll strip ── */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-0.5">
            {t('gw.otherDays')}
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none snap-x snap-mandatory">
            {others.map((tpl) => (
              <form
                key={tpl.id}
                action={startSession.bind(null, tpl.id)}
                className="shrink-0 snap-start"
              >
                <button
                  type="submit"
                  className="w-[148px] glass-card rounded-2xl p-3.5 text-start active:scale-[0.97] transition-transform border border-border/60 hover:border-primary/30"
                >
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center mb-2">
                    <Dumbbell size={16} className="text-rose-400" />
                  </div>
                  <p className="text-sm font-black leading-tight mb-0.5">{tpl.dayName}</p>
                  {tpl.phase && (
                    <p className="text-[10px] text-muted-foreground mb-1">{tpl.phase}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {t('gw.exerciseCount', { n: tpl.exercises.length })}
                  </p>
                  <ChevronRight size={14} className="text-muted-foreground/50 mt-1.5" />
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
