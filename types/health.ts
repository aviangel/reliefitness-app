export type MealType = 'breakfast' | 'commute_am' | 'lunch' | 'commute_pm' | 'dinner' | 'snack';
export type FoodCategory = 'home_meals' | 'junk_food' | 'israeli_sweets' | 'drinks';

export const DEFAULT_PROFILE = {
  name: 'Avi',
  height_cm: 181,
  current_weight_kg: 102 as number,
  target_weight_kg: 88 as number,
  birth_year: 2002,
  calorie_goal: 2000,
  protein_goal_g: 150,
  carbs_goal_g: 200,
  fat_goal_g: 65,
  water_goal_ml: 2500,
  hernia_flag: true,
};

export interface FoodItem {
  name: string;
  name_he: string | null;
  category: FoodCategory;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  default_portion_g: number;
}

export interface MealLogEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  food_id: string | null;
  food_name: string | null;
  food_name_he: string | null;
  portion_g: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  status: 'eaten' | 'skipped';
  notes: string | null;
  logged_at: string;
}

export interface WeightLogEntry {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
}

export interface UserProfileRow {
  id: string;
  user_id: string;
  name: string;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  birth_year: number;
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  water_goal_ml: number;
  hernia_flag: boolean;
}

export interface SleepLogEntry {
  id: string;
  date: string;
  hours: number;
  quality: number | null;
  notes: string | null;
}

export interface MeasurementLogEntry {
  id: string;
  date: string;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  notes: string | null;
}

export interface StepsLogEntry {
  id: string;
  date: string;
  steps: number;
}
