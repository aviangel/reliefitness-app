'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FOODS } from '@/lib/health/foods';
import { MEAL_TYPES, PORTION_MULTIPLIERS } from '@/lib/health/constants';
import { logMeal } from '@/lib/health/actions';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { FoodCategory, MealType, FoodItem } from '@/types/health';
import { CheckCircle2, Search, X } from 'lucide-react';

const CATEGORIES: { id: FoodCategory; emoji: string; shortKey: TranslationKey }[] = [
  { id: 'home_meals', emoji: '🏠', shortKey: 'cat.home' },
  { id: 'junk_food', emoji: '🍔', shortKey: 'cat.junk' },
  { id: 'israeli_sweets', emoji: '🍫', shortKey: 'cat.sweets' },
  { id: 'drinks', emoji: '🥤', shortKey: 'cat.drinks' },
];

interface MealLogFormProps {
  defaultMealType?: string;
}

export function MealLogForm({ defaultMealType }: MealLogFormProps) {
  const { t } = useI18n();
  const validDefault = MEAL_TYPES.find(m => m.id === defaultMealType)?.id ?? 'lunch';
  const [mealType, setMealType] = useState<MealType>(validDefault as MealType);
  const [activeCategory, setActiveCategory] = useState<FoodCategory>('home_meals');
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionMult, setPortionMult] = useState(1.0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredFoods = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return FOODS.filter(
        f => f.name.toLowerCase().includes(q) || (f.name_he ?? '').includes(q)
      );
    }
    return FOODS.filter(f => f.category === activeCategory);
  }, [search, activeCategory]);

  const portionG = selectedFood ? Math.round(selectedFood.default_portion_g * portionMult) : 0;
  const calcNutrient = (per100: number) =>
    selectedFood ? Math.round((per100 * portionG) / 100 * 10) / 10 : 0;
  const estCal = selectedFood ? Math.round((selectedFood.calories_per_100g * portionG) / 100) : 0;

  const handleSubmit = () => {
    if (!selectedFood) { setError(t('form.pleaseSelectFood')); return; }
    setError('');
    const fd = new FormData();
    fd.set('food_name', selectedFood.name);
    fd.set('meal_type', mealType);
    fd.set('portion_multiplier', portionMult.toString());
    startTransition(async () => {
      try {
        await logMeal(fd);
        setDone(true);
        setTimeout(() => router.push('/dashboard'), 1200);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('form.failedLogMeal'));
      }
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-primary" />
        </div>
        <p className="text-lg font-semibold">{t('form.logged')}</p>
        <p className="text-sm text-muted-foreground">{t('form.headingBack')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Meal Type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('form.mealType')}</p>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_TYPES.map(mt => (
            <button
              key={mt.id}
              type="button"
              onClick={() => setMealType(mt.id as MealType)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-xs font-medium transition-all ${
                mealType === mt.id
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
              }`}
            >
              <span className="text-xl">{mt.emoji}</span>
              <span className="leading-tight text-center">{t(mt.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Selector */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('form.food')}</p>

        {selectedFood ? (
          /* Selected food bar */
          <button
            type="button"
            onClick={() => { setSelectedFood(null); setPortionMult(1.0); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-primary/40 bg-primary/8 text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{selectedFood.name}</p>
              {selectedFood.name_he && (
                <p className="text-xs text-muted-foreground">{selectedFood.name_he} · {t('form.tapToChange')}</p>
              )}
              {!selectedFood.name_he && (
                <p className="text-xs text-muted-foreground">{t('form.tapToChange')}</p>
              )}
            </div>
            <X size={16} className="text-muted-foreground shrink-0" />
          </button>
        ) : (
          /* Food picker */
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder={t('form.searchFoods')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category pills */}
            {!search && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(34,197,94,0.25)]'
                        : 'bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:border-primary/20'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{t(cat.shortKey)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Food list */}
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 no-scrollbar">
              {filteredFoods.map(food => (
                <button
                  key={food.name}
                  type="button"
                  onClick={() => { setSelectedFood(food); setPortionMult(1.0); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{food.name}</p>
                    {food.name_he && (
                      <p className="text-xs text-muted-foreground">{food.name_he}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-primary">
                      {Math.round(food.calories_per_100g * food.default_portion_g / 100)} kcal
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t('meals.proteinShort', { n: Math.round(food.protein_per_100g * food.default_portion_g / 100) })}
                    </p>
                  </div>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t('form.noFoods')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Portion selector */}
      {selectedFood && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            {t('form.portion', { n: portionG })}
          </p>
          <div className="flex gap-2">
            {PORTION_MULTIPLIERS.map(pm => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPortionMult(pm.value)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  portionMult === pm.value
                    ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                    : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition preview */}
      {selectedFood && (
        <div className="glass-card rounded-2xl p-4">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold gradient-text tabular-nums">{estCal}</span>
            <span className="text-lg text-muted-foreground ml-1">{t('unit.kcal')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-500/10 rounded-xl p-2.5">
              <div className="text-sm font-bold text-blue-400 tabular-nums">{calcNutrient(selectedFood.protein_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">{t('form.protein')}</div>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-2.5">
              <div className="text-sm font-bold text-amber-400 tabular-nums">{calcNutrient(selectedFood.carbs_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">{t('form.carbs')}</div>
            </div>
            <div className="bg-pink-500/10 rounded-xl p-2.5">
              <div className="text-sm font-bold text-pink-400 tabular-nums">{calcNutrient(selectedFood.fat_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">{t('form.fat')}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFood || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          selectedFood && !isPending
            ? 'bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:opacity-90 active:scale-[0.98]'
            : 'bg-white/[0.04] text-muted-foreground cursor-not-allowed'
        }`}
      >
        {isPending
          ? t('common.logging')
          : selectedFood
          ? t('form.logFood', { name: selectedFood.name.split(' ')[0] })
          : t('form.selectFood')}
      </button>
    </div>
  );
}
