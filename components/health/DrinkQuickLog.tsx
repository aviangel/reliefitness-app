'use client';

import { useTransition } from 'react';
import { logDrink } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

type DrinkType = 'water' | 'zero' | 'diet_coke';

const DRINKS: { type: DrinkType; labelKey: TranslationKey; emoji: string; color: string; bg: string }[] = [
  { type: 'water', labelKey: 'drink.water', emoji: '💧', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
  { type: 'zero', labelKey: 'drink.zero', emoji: '🟢', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
  { type: 'diet_coke', labelKey: 'drink.diet_coke', emoji: '🥤', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
];

const AMOUNTS = [150, 250, 330, 500];

interface DrinkQuickLogProps {
  selectedType: DrinkType;
  onTypeChange: (t: DrinkType) => void;
}

export function DrinkQuickLog({ selectedType, onTypeChange }: DrinkQuickLogProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const handleLog = (amount: number) => {
    startTransition(async () => {
      await logDrink(selectedType, amount);
    });
  };

  return (
    <div className="space-y-4">
      {/* Drink type selector */}
      <div className="grid grid-cols-3 gap-2">
        {DRINKS.map((d) => (
          <button
            key={d.type}
            type="button"
            onClick={() => onTypeChange(d.type)}
            className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border text-xs font-medium transition-all ${
              selectedType === d.type
                ? `${d.bg} ${d.color} border-current`
                : 'border-border bg-card text-muted-foreground hover:border-border'
            }`}
          >
            <span className="text-2xl">{d.emoji}</span>
            <span>{t(d.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Amount buttons */}
      <div className="grid grid-cols-4 gap-2">
        {AMOUNTS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => handleLog(ml)}
            disabled={isPending}
            className="py-3 rounded-xl border border-border bg-card text-sm font-bold text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 transition-all disabled:opacity-50"
          >
            {ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
          </button>
        ))}
      </div>
      {isPending && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">{t('common.logging')}</p>
      )}
    </div>
  );
}
