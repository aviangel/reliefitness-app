'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { findFood } from './foods';

export async function logMeal(formData: FormData) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const foodName = formData.get('food_name') as string;
  const mealType = formData.get('meal_type') as string;
  const portionMultiplier = parseFloat(formData.get('portion_multiplier') as string) || 1.0;

  const food = findFood(foodName);
  if (!food) throw new Error('Food not found: ' + foodName);

  const portionG = Math.round(food.default_portion_g * portionMultiplier);
  const factor = portionG / 100;

  const { error } = await supabase.from('meals_log').insert({
    user_id: user.id,
    meal_type: mealType,
    food_name: food.name,
    food_name_he: food.name_he ?? null,
    portion_g: portionG,
    calories: Math.round(food.calories_per_100g * factor),
    protein_g: Math.round(food.protein_per_100g * factor * 10) / 10,
    carbs_g: Math.round(food.carbs_per_100g * factor * 10) / 10,
    fat_g: Math.round(food.fat_per_100g * factor * 10) / 10,
    status: 'eaten',
    date: new Date().toISOString().split('T')[0],
  });

  if (error) throw error;
  revalidatePath('/dashboard');
  revalidatePath('/meals');
}

export async function deleteMealLog(id: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('meals_log').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/dashboard');
  revalidatePath('/meals');
}

export async function logWeight(weight: number, notes?: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('weight_log').upsert(
    { user_id: user.id, date: today, weight_kg: weight, notes: notes || null },
    { onConflict: 'user_id,date' }
  );

  if (error) throw error;
  revalidatePath('/dashboard');
  revalidatePath('/weight');
}

export async function logSlip(what: string, why?: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('slip_log').insert({
    user_id: user.id,
    date: new Date().toISOString().split('T')[0],
    what,
    why: why || null,
  });
  revalidatePath('/dashboard');
}

export async function updateGoals(
  calorieGoal: number,
  proteinGoal: number,
  carbsGoal: number,
  fatGoal: number
) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('user_profile').upsert(
    {
      user_id: user.id,
      calorie_goal: calorieGoal,
      protein_goal_g: proteinGoal,
      carbs_goal_g: carbsGoal,
      fat_goal_g: fatGoal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
  revalidatePath('/settings');
  revalidatePath('/dashboard');
}

export async function logDrink(type: 'water' | 'zero' | 'diet_coke', amountMl: number) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('drinks_log').insert({
    user_id: user.id,
    date: new Date().toISOString().split('T')[0],
    type,
    amount_ml: amountMl,
  });

  if (error) throw error;
  revalidatePath('/dashboard');
  revalidatePath('/drinks');
}

export async function deleteDrink(id: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('drinks_log').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/dashboard');
  revalidatePath('/drinks');
}

export async function logWorkout(
  type: string,
  durationMinutes: number,
  notes?: string,
  caloriesBurned?: number
) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('workout_log').insert({
    user_id: user.id,
    date: new Date().toISOString().split('T')[0],
    type,
    duration_minutes: durationMinutes,
    calories_burned: caloriesBurned || null,
    notes: notes || null,
  });

  if (error) throw error;
  revalidatePath('/dashboard');
  revalidatePath('/workout');
}

export async function deleteWorkout(id: string) {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('workout_log').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/dashboard');
  revalidatePath('/workout');
}
