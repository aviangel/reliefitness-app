import type { MealType } from '@/types/health';

export const MEAL_TYPES: { id: MealType; label: string; emoji: string; time: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7:45' },
  { id: 'commute_am', label: 'Morning Commute', emoji: '🚌', time: '8:30' },
  { id: 'lunch', label: 'Lunch', emoji: '🍽️', time: '12:30' },
  { id: 'commute_pm', label: 'Evening Commute', emoji: '🚌', time: '18:00' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙', time: '20:30' },
  { id: 'snack', label: 'Snack / Extra', emoji: '🍫', time: 'Anytime' },
];

export const PORTION_MULTIPLIERS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1.0, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
];
