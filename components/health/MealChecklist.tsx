import type { MealLogEntry } from '@/types/health';
import { MEAL_TYPES } from '@/lib/health/constants';
import { getT } from '@/lib/i18n/server';
import Link from 'next/link';
import { CheckCircle2, Clock, Plus } from 'lucide-react';

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
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              hasLog
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <span className="text-xl w-8 text-center">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{time === 'Anytime' ? t('mealtime.anytime') : time}</span>
              </div>
              {hasLog ? (
                <p className="text-xs text-muted-foreground truncate">
                  {logged.map(m => m.food_name ?? t('meals.unknownFood')).join(', ')}
                  {' · '}
                  <span className="text-primary font-medium">{totalCal} kcal</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('checklist.notLogged')}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasLog ? (
                <CheckCircle2 size={18} className="text-primary" />
              ) : (
                <Clock size={18} className="text-muted-foreground/50" />
              )}
              <Link
                href={`/meals/log?meal_type=${id}`}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label={`Add ${label}`}
              >
                <Plus size={16} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
