import type { MealLogEntry } from '@/types/health';
import { MEAL_TYPES } from '@/lib/health/constants';
import { getT } from '@/lib/i18n/server';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';

interface MealChecklistProps {
  meals: MealLogEntry[];
}

export function MealChecklist({ meals }: MealChecklistProps) {
  const t = getT();
  return (
    <div className="space-y-2">
      {MEAL_TYPES.map(({ id, labelKey, emoji, time }) => {
        const label = t(labelKey);
        const logged = meals.filter(m => m.meal_type === id);
        const totalCal = Math.round(logged.reduce((s, m) => s + (m.calories ?? 0), 0));
        const hasLog = logged.length > 0;

        return (
          <div
            key={id}
            className={`relative flex items-center gap-3 px-3.5 py-3 rounded-[16px] border transition-all ${
              hasLog
                ? 'bg-primary/[0.05] border-primary/15'
                : 'bg-surface border-border'
            }`}
          >
            {/* Left accent */}
            {hasLog && (
              <div className="absolute start-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-primary to-[#00e5ff]" />
            )}

            <span className="text-xl w-8 text-center shrink-0 select-none">{emoji}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold leading-tight">{label}</span>
                {!hasLog && (
                  <span className="text-[10px] text-muted-foreground/35">
                    {time === 'Anytime' ? t('mealtime.anytime') : time}
                  </span>
                )}
              </div>
              {hasLog && (
                <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                  {logged.map(m => m.food_name ?? '').filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasLog && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black tabular-nums text-primary">{totalCal}</span>
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check size={11} className="text-primary" strokeWidth={3} />
                  </div>
                </div>
              )}
              <Link
                href={`/meals/log?meal_type=${id}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  hasLog
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground/40 hover:bg-muted'
                }`}
                aria-label={`Add ${label}`}
              >
                <Plus size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
