import type { MealType } from '@/types/health';
import type { TranslationKey } from '@/lib/i18n/translations';

export const MEAL_TYPES: {
  id: MealType;
  label: string;
  labelKey: TranslationKey;
  emoji: string;
  time: string;
}[] = [
  { id: 'breakfast', label: 'Breakfast', labelKey: 'meal.breakfast', emoji: '🌅', time: '7:45' },
  { id: 'commute_am', label: 'Morning Commute', labelKey: 'meal.commute_am', emoji: '🚌', time: '8:30' },
  { id: 'lunch', label: 'Lunch', labelKey: 'meal.lunch', emoji: '🍽️', time: '12:30' },
  { id: 'commute_pm', label: 'Evening Commute', labelKey: 'meal.commute_pm', emoji: '🚌', time: '18:00' },
  { id: 'dinner', label: 'Dinner', labelKey: 'meal.dinner', emoji: '🌙', time: '20:30' },
  { id: 'snack', label: 'Snack / Extra', labelKey: 'meal.snack', emoji: '🍫', time: 'Anytime' },
];

export const PORTION_MULTIPLIERS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1.0, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
];
