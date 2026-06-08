import type { MealLogEntry } from '@/types/health';
import { MEAL_TYPES } from '@/lib/health/constants';
import { getT } from '@/lib/i18n/server';
import Link from 'next/link';
import { CheckCircle2, Plus } from 'lucide-react';

interface MealChecklistProps {
  meals: MealLogEntry[];
}

export function MealChecklist({ meals }: MealChecklistProps) {
  const t = getT();
  return (
    <div className="space-y-2.5">
      {MEAL_TYPES.map(({ id, labelKey, emoji, time }) => {
        const label = t(labelKey);
        const logged = meals.filter(m => m.meal_type === id);
        const totalCal = Math.round(logged.reduce((s, m) => s + (m.calories ?? 0), 0));
        const hasLog = logged.length > 0;

        return (
          <div
            key={id}
            className={`relative flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] border transition-all duration-200 ${
              hasLog
                ? 'bg-primary/[0.06] border-primary/20'
                : 'bg-[#111111] border-white/[0.06] hover:border-white/[0.1]'
            }`}
          >
            {/* Left accent for logged meals */}
            {hasLog && (
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-primary to-[#00e5ff]" />
            )}

            {/* Emoji */}
            <span className="text-2xl w-9 text-center shrink-0 select-none">{emoji}</span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold">{label}</span>
                {!hasLog && (
                  <span className="text-[10px] text-muted-foreground/50 font-medium">
                    {time === 'Anytime' ? t('mealtime.anytime') : time}
                  </span>
                )}
              </div>
              {hasLog ? (
                <p className="text-xs text-muted-foreground truncate leading-relaxed">
                  {logged.map(m => m.food_name ?? t('meals.unknownFood')).join(', ')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/40">{t('checklist.notLogged')}</p>
              )}
            </div>

            {/* Right: calorie count + add button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {hasLog && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tabular-nums text-primary">{totalCal}</span>
                  <CheckCircle2 size={16} className="text-primary/70" />
                </div>
              )}
              <Link
                href={`/meals/log?meal_type=${id}`}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  hasLog
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-white/[0.06] text-muted-foreground/50 hover:bg-white/[0.1] hover:text-foreground'
                }`}
                aria-label={`Add ${label}`}
              >
                <Plus size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
