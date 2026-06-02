'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FOODS, CATEGORY_LABELS } from '@/lib/health/foods';
import { MEAL_TYPES, PORTION_MULTIPLIERS } from '@/lib/health/constants';
import { logMeal } from '@/lib/health/actions';
import type { FoodCategory, MealType } from '@/types/health';
import { CheckCircle2 } from 'lucide-react';

const CATEGORIES: FoodCategory[] = ['home_meals', 'junk_food', 'israeli_sweets', 'drinks'];

interface MealLogFormProps {
  defaultMealType?: string;
}

export function MealLogForm({ defaultMealType }: MealLogFormProps) {
  const validDefault = MEAL_TYPES.find(m => m.id === defaultMealType)?.id ?? 'lunch';
  const [mealType, setMealType] = useState<MealType>(validDefault as MealType);
  const [foodName, setFoodName] = useState('');
  const [portionMult, setPortionMult] = useState(1.0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedFood = FOODS.find(f => f.name === foodName);
  const portionG = selectedFood ? Math.round(selectedFood.default_portion_g * portionMult) : 0;
  const calcNutrient = (per100: number) =>
    selectedFood ? Math.round((per100 * portionG) / 100 * 10) / 10 : 0;
  const estCal = selectedFood ? Math.round((selectedFood.calories_per_100g * portionG) / 100) : 0;

  const handleSubmit = () => {
    if (!foodName) { setError('Please select a food.'); return; }
    setError('');
    const fd = new FormData();
    fd.set('food_name', foodName);
    fd.set('meal_type', mealType);
    fd.set('portion_multiplier', portionMult.toString());
    startTransition(async () => {
      try {
        await logMeal(fd);
        setDone(true);
        setTimeout(() => router.push('/dashboard'), 1200);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to log meal.');
      }
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <CheckCircle2 size={48} className="text-primary" />
        <p className="text-lg font-semibold">Logged!</p>
        <p className="text-sm text-muted-foreground">Heading back to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Meal Type */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Meal Type</p>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_TYPES.map(mt => (
            <button
              key={mt.id}
              type="button"
              onClick={() => setMealType(mt.id as MealType)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-xs font-medium transition-all ${
                mealType === mt.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{mt.emoji}</span>
              <span className="leading-tight text-center">{mt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Selector */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Food</p>
        <select
          value={foodName}
          onChange={e => { setFoodName(e.target.value); setPortionMult(1.0); }}
          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
        >
          <option value="">Choose a food...</option>
          {CATEGORIES.map(cat => (
            <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
              {FOODS.filter(f => f.category === cat).map(food => (
                <option key={food.name} value={food.name}>
                  {food.name}{food.name_he ? ` / ${food.name_he}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Portion */}
      {selectedFood && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Portion — <span className="text-foreground font-semibold">{portionG}g</span>
          </p>
          <div className="flex gap-2">
            {PORTION_MULTIPLIERS.map(pm => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPortionMult(pm.value)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  portionMult === pm.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Preview */}
      {selectedFood && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-primary tabular-nums">{estCal}</span>
            <span className="text-lg text-muted-foreground ml-1">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-500/10 rounded-xl p-2">
              <div className="text-sm font-bold text-blue-400 tabular-nums">{calcNutrient(selectedFood.protein_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-2">
              <div className="text-sm font-bold text-amber-400 tabular-nums">{calcNutrient(selectedFood.carbs_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
            </div>
            <div className="bg-pink-500/10 rounded-xl p-2">
              <div className="text-sm font-bold text-pink-400 tabular-nums">{calcNutrient(selectedFood.fat_per_100g)}g</div>
              <div className="text-xs text-muted-foreground">Fat</div>
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
        disabled={!foodName || isPending}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          !foodName || isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {isPending ? 'Logging...' : 'Log Meal'}
      </button>
    </div>
  );
}
