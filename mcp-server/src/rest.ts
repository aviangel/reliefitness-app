/**
 * REST API for GPT Custom Actions (and any other non-MCP client).
 * Auth: Authorization: Bearer mk_xxx  (same key from mcp_api_keys table)
 */

import express from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

function today(): string { return new Date().toISOString().split('T')[0]; }
function round1(n: number): number { return Math.round(n * 10) / 10; }

async function resolveUser(
  supabase: SupabaseClient,
  req: express.Request,
  res: express.Response
): Promise<string | null> {
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization: Bearer <api_key> header' });
    return null;
  }
  const { data, error } = await supabase
    .from('mcp_api_keys').select('user_id').eq('api_key', token).single();
  if (error || !data) {
    res.status(401).json({ error: 'Invalid or revoked API key' });
    return null;
  }
  return (data as any).user_id as string;
}

export function createRestRouter(supabase: SupabaseClient): express.Router {
  const router = express.Router();

  // ── GET /api/today ────────────────────────────────────────────────────────
  router.get('/today', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const d = today();
    const [profileRes, mealsRes, weightRes, drinksRes, workoutsRes, sleepRes, stepsRes] = await Promise.all([
      supabase.from('user_profile').select('*').eq('user_id', userId).single(),
      supabase.from('meals_log').select('*').eq('user_id', userId).eq('date', d).order('logged_at'),
      supabase.from('weight_log').select('weight_kg,date').eq('user_id', userId).order('date', { ascending: false }).limit(2),
      supabase.from('drinks_log').select('type,amount_ml').eq('user_id', userId).eq('date', d),
      supabase.from('workout_log').select('type,duration_minutes,calories_burned,notes').eq('user_id', userId).eq('date', d),
      supabase.from('sleep_log').select('hours,quality').eq('user_id', userId).eq('date', d).maybeSingle(),
      supabase.from('steps_log').select('steps').eq('user_id', userId).eq('date', d).maybeSingle(),
    ]);
    const p = profileRes.data as any;
    const meals = (mealsRes.data ?? []) as any[];
    const weights = (weightRes.data ?? []) as any[];
    const drinks = (drinksRes.data ?? []) as any[];
    const workouts = (workoutsRes.data ?? []) as any[];
    const sleep = sleepRes.data as any;
    const steps = stepsRes.data as any;
    const totalCal = Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0));
    const totalBurned = workouts.reduce((s, w) => s + (w.calories_burned ?? 0), 0);
    const totalWater = drinks.filter((x) => x.type === 'water').reduce((s, x) => s + x.amount_ml, 0);
    const waterGoal = p?.water_goal_ml ?? 2500;
    const weightKg = weights[0] ? Number(weights[0].weight_kg) : Number(p?.current_weight_kg ?? 80);
    const heightCm = Number(p?.height_cm ?? 175);
    const age = new Date().getFullYear() - Number(p?.birth_year ?? 2000);
    const sexOffset = p?.sex === 'female' ? -161 : 5;
    const actMult: Record<string, number> = {
      sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725, extra_active: 1.9,
    };
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
    const tdee = Math.round(bmr * (actMult[p?.activity_level ?? 'lightly_active'] ?? 1.375));
    const calorieStatus = totalCal > tdee + 50 ? 'surplus' : totalCal < tdee - 50 ? 'deficit' : 'maintenance';
    res.json({
      date: d,
      calories: {
        eaten: totalCal, goal: p?.calorie_goal ?? 2000, remaining: (p?.calorie_goal ?? 2000) - totalCal,
        burned: totalBurned, net: totalCal - totalBurned,
        tdee, delta_from_maintenance: totalCal - tdee, status: calorieStatus,
      },
      macros: {
        protein: { eaten: round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)), goal: p?.protein_goal_g ?? 150 },
        carbs: { eaten: round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)), goal: p?.carbs_goal_g ?? 200 },
        fat: { eaten: round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)), goal: p?.fat_goal_g ?? 65 },
        sugar: { eaten: round1(meals.reduce((s, m) => s + (m.sugar_g ?? 0), 0)), goal: p?.sugar_goal_g ?? 50 },
      },
      meals_logged: meals.length,
      water_ml: totalWater, water_goal_ml: waterGoal, water_remaining_ml: Math.max(0, waterGoal - totalWater),
      weight: { current_kg: weights[0] ? Number(weights[0].weight_kg) : null, logged_today: weights[0]?.date === d },
      workouts: workouts.map((w) => ({ type: w.type, duration_minutes: w.duration_minutes, calories_burned: w.calories_burned, notes: w.notes })),
      total_workout_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
      sleep: sleep ? { hours: Number(sleep.hours), quality: sleep.quality } : null,
      steps: steps ? steps.steps : null,
    });
  });

  // ── GET /api/meals ────────────────────────────────────────────────────────
  router.get('/meals', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const d = (req.query.date as string) ?? today();
    const { data } = await supabase
      .from('meals_log')
      .select('id,meal_type,food_name,portion_g,calories,protein_g,carbs_g,fat_g,sugar_g,logged_at')
      .eq('user_id', userId).eq('date', d).order('logged_at');
    const meals = (data ?? []) as any[];
    res.json({
      date: d,
      totals: {
        calories: Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0)),
        protein_g: round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)),
        carbs_g: round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)),
        fat_g: round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)),
        sugar_g: round1(meals.reduce((s, m) => s + (m.sugar_g ?? 0), 0)),
      },
      meals,
    });
  });

  // ── POST /api/meals ────────────────────────────────────────────────────────
  router.post('/meals', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { food_name, meal_type, portion_multiplier = 1.0, date } = req.body;
    if (!food_name || !meal_type) {
      res.status(400).json({ error: 'food_name and meal_type are required' });
      return;
    }
    const { data: foods } = await supabase.from('foods').select('*').ilike('name', food_name).eq('is_active', true).limit(1);
    if (!foods?.length) {
      res.status(404).json({ error: `Food not found: "${food_name}". Use GET /api/foods to search.` });
      return;
    }
    const food = foods[0] as any;
    const portionG = Math.round(food.default_portion_g * portion_multiplier);
    const f = portionG / 100;
    const { data: inserted, error } = await supabase.from('meals_log').insert({
      user_id: userId, date: date ?? today(), meal_type,
      food_id: food.id, food_name: food.name, food_name_he: food.name_he ?? null, portion_g: portionG,
      calories: Math.round(food.calories_per_100g * f),
      protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f),
      fat_g: round1(food.fat_per_100g * f), sugar_g: round1((food.sugar_per_100g ?? 0) * f),
      status: 'eaten',
    }).select('id').single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({
      logged: true, id: (inserted as any)?.id, food: food.name, meal_type,
      portion_g: portionG, calories: Math.round(food.calories_per_100g * f),
      protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f),
      fat_g: round1(food.fat_per_100g * f), sugar_g: round1((food.sugar_per_100g ?? 0) * f),
    });
  });

  // ── POST /api/meals/direct ────────────────────────────────────────────────
  router.post('/meals/direct', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { food_name, food_name_he, meal_type, calories, protein_g, carbs_g, fat_g, sugar_g = 0, portion_g, date } = req.body;
    if (!food_name || !meal_type || calories == null || protein_g == null || carbs_g == null || fat_g == null || portion_g == null) {
      res.status(400).json({ error: 'Required: food_name, meal_type, calories, protein_g, carbs_g, fat_g, portion_g' });
      return;
    }
    const { data: inserted, error } = await supabase.from('meals_log').insert({
      user_id: userId, date: date ?? today(), meal_type,
      food_name, food_name_he: food_name_he ?? null, portion_g,
      calories, protein_g, carbs_g, fat_g, sugar_g, status: 'eaten',
    }).select('id').single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, id: (inserted as any)?.id, food_name, meal_type, portion_g, calories, protein_g, carbs_g, fat_g, sugar_g });
  });

  // ── DELETE /api/meals/:id ─────────────────────────────────────────────────
  router.delete('/meals/:id', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { error } = await supabase.from('meals_log').delete().eq('id', req.params.id).eq('user_id', userId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ deleted: true, id: req.params.id });
  });

  // ── GET /api/foods ────────────────────────────────────────────────────────
  router.get('/foods', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    let q = supabase.from('foods')
      .select('name,name_he,category,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,sugar_per_100g,default_portion_g')
      .eq('is_active', true).order('category').order('name');
    if (req.query.search) q = (q as any).or(`name.ilike.%${req.query.search}%,name_he.ilike.%${req.query.search}%`);
    const { data } = await q.limit(60);
    const foods = (data ?? []).map((f: any) => ({
      name: f.name, name_he: f.name_he, category: f.category, default_portion_g: f.default_portion_g,
      per_default_portion: {
        calories: Math.round(f.calories_per_100g * f.default_portion_g / 100),
        protein_g: round1(f.protein_per_100g * f.default_portion_g / 100),
        carbs_g: round1(f.carbs_per_100g * f.default_portion_g / 100),
        fat_g: round1(f.fat_per_100g * f.default_portion_g / 100),
        sugar_g: round1((f.sugar_per_100g ?? 0) * f.default_portion_g / 100),
      },
    }));
    res.json(foods);
  });

  // ── POST /api/foods ───────────────────────────────────────────────────────
  router.post('/foods', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { name, name_he, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g = 0, default_portion_g } = req.body;
    if (!name || !category || calories_per_100g == null || protein_per_100g == null || carbs_per_100g == null || fat_per_100g == null || default_portion_g == null) {
      res.status(400).json({ error: 'Required: name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, default_portion_g' });
      return;
    }
    const { data: existing } = await supabase.from('foods').select('name').ilike('name', name).limit(1);
    if (existing?.length) { res.status(409).json({ error: `Food "${name}" already exists.` }); return; }
    const { error } = await supabase.from('foods').insert({ name, name_he: name_he ?? null, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g, default_portion_g, is_active: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ added: true, name, category });
  });

  // ── GET /api/profile ──────────────────────────────────────────────────────
  router.get('/profile', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { data, error } = await supabase.from('user_profile').select('*').eq('user_id', userId).single();
    if (error || !data) { res.status(404).json({ error: 'Profile not found' }); return; }
    const p = data as any;
    res.json({
      name: p.name, height_cm: p.height_cm,
      current_weight_kg: Number(p.current_weight_kg), target_weight_kg: Number(p.target_weight_kg),
      to_lose_kg: round1(Number(p.current_weight_kg) - Number(p.target_weight_kg)),
      goals: {
        calorie_goal: p.calorie_goal, protein_goal_g: p.protein_goal_g, carbs_goal_g: p.carbs_goal_g,
        fat_goal_g: p.fat_goal_g, sugar_goal_g: p.sugar_goal_g ?? 50, water_goal_ml: p.water_goal_ml ?? 2500,
      },
    });
  });

  // ── POST /api/goals ───────────────────────────────────────────────────────
  router.post('/goals', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, sugar_goal_g, water_goal_ml } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (calorie_goal != null) updates.calorie_goal = calorie_goal;
    if (protein_goal_g != null) updates.protein_goal_g = protein_goal_g;
    if (carbs_goal_g != null) updates.carbs_goal_g = carbs_goal_g;
    if (fat_goal_g != null) updates.fat_goal_g = fat_goal_g;
    if (sugar_goal_g != null) updates.sugar_goal_g = sugar_goal_g;
    if (water_goal_ml != null) updates.water_goal_ml = water_goal_ml;
    const { error } = await supabase.from('user_profile').update(updates).eq('user_id', userId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ updated: true, changes: updates });
  });

  // ── GET /api/weight ───────────────────────────────────────────────────────
  router.get('/weight', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 14;
    const { data } = await supabase.from('weight_log').select('id,date,weight_kg,notes').eq('user_id', userId).order('date', { ascending: false }).limit(limit);
    const entries = (data ?? []).map((e: any) => ({ ...e, weight_kg: Number(e.weight_kg) }));
    const ws = entries.map((e) => e.weight_kg);
    res.json({ entries, stats: ws.length > 1 ? { current: ws[0], oldest: ws[ws.length - 1], change_kg: round1(ws[0] - ws[ws.length - 1]) } : null });
  });

  // ── POST /api/weight ──────────────────────────────────────────────────────
  router.post('/weight', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { weight_kg, notes, date } = req.body;
    if (weight_kg == null || weight_kg < 30 || weight_kg > 300) {
      res.status(400).json({ error: 'weight_kg is required and must be 30–300' });
      return;
    }
    const { error } = await supabase.from('weight_log').upsert(
      { user_id: userId, date: date ?? today(), weight_kg, notes: notes ?? null },
      { onConflict: 'user_id,date' }
    );
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ logged: true, weight_kg, date: date ?? today() });
  });

  // ── GET /api/drinks ───────────────────────────────────────────────────────
  router.get('/drinks', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const d = (req.query.date as string) ?? today();
    const { data } = await supabase.from('drinks_log').select('id,type,amount_ml,logged_at').eq('user_id', userId).eq('date', d).order('logged_at');
    const drinks = (data ?? []) as any[];
    const byType: Record<string, number> = {};
    for (const dr of drinks) byType[dr.type] = (byType[dr.type] ?? 0) + dr.amount_ml;
    res.json({
      date: d, entries: drinks,
      totals: { ...byType, all: Object.values(byType).reduce((s, v) => s + v, 0) },
      water_goal_ml: 2500, water_remaining_ml: Math.max(0, 2500 - (byType.water ?? 0)),
    });
  });

  // ── POST /api/drinks ──────────────────────────────────────────────────────
  router.post('/drinks', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { type, amount_ml, date } = req.body;
    if (!type || !amount_ml) { res.status(400).json({ error: 'type and amount_ml are required' }); return; }
    const d = date ?? today();
    const { error } = await supabase.from('drinks_log').insert({ user_id: userId, date: d, type, amount_ml });
    if (error) { res.status(500).json({ error: error.message }); return; }
    const { data: todayDrinks } = await supabase.from('drinks_log').select('type,amount_ml').eq('user_id', userId).eq('date', d);
    const totalWater = (todayDrinks ?? []).filter((x: any) => x.type === 'water').reduce((s, x: any) => s + x.amount_ml, 0);
    res.status(201).json({ logged: true, type, amount_ml, total_water_today_ml: totalWater, water_remaining_ml: Math.max(0, 2500 - totalWater) });
  });

  // ── GET /api/workouts ─────────────────────────────────────────────────────
  router.get('/workouts', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 10;
    const { data } = await supabase.from('workout_log').select('id,date,type,duration_minutes,calories_burned,notes,logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(limit);
    res.json(data ?? []);
  });

  // ── POST /api/workouts ────────────────────────────────────────────────────
  router.post('/workouts', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { type, duration_minutes, notes, calories_burned, date } = req.body;
    if (!type || !duration_minutes) { res.status(400).json({ error: 'type and duration_minutes are required' }); return; }
    const { error } = await supabase.from('workout_log').insert({ user_id: userId, date: date ?? today(), type, duration_minutes, calories_burned: calories_burned ?? null, notes: notes ?? null });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, type, duration_minutes, date: date ?? today() });
  });

  // ── GET /api/slips ────────────────────────────────────────────────────────
  router.get('/slips', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 10;
    const { data } = await supabase.from('slip_log').select('id,date,what,why,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    res.json(data ?? []);
  });

  // ── POST /api/slips ───────────────────────────────────────────────────────
  router.post('/slips', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { what, why, date } = req.body;
    if (!what) { res.status(400).json({ error: 'what is required' }); return; }
    const { error } = await supabase.from('slip_log').insert({ user_id: userId, date: date ?? today(), what, why: why ?? null });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, what, date: date ?? today() });
  });

  // ── GET /api/stats ────────────────────────────────────────────────────────
  router.get('/stats', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const days = parseInt(req.query.days as string) || 7;
    const from = new Date(); from.setDate(from.getDate() - days + 1);
    const fromStr = from.toISOString().split('T')[0];
    const to = today();
    const [mealsRes, weightRes, workoutsRes, profileRes] = await Promise.all([
      supabase.from('meals_log').select('date,calories,protein_g').eq('user_id', userId).gte('date', fromStr).lte('date', to),
      supabase.from('weight_log').select('date,weight_kg').eq('user_id', userId).gte('date', fromStr).lte('date', to).order('date'),
      supabase.from('workout_log').select('date,type,duration_minutes').eq('user_id', userId).gte('date', fromStr).lte('date', to),
      supabase.from('user_profile').select('calorie_goal,protein_goal_g').eq('user_id', userId).single(),
    ]);
    const meals = (mealsRes.data ?? []) as any[];
    const weights = (weightRes.data ?? []) as any[];
    const workouts = (workoutsRes.data ?? []) as any[];
    const p = profileRes.data as any;
    const dayTotals: Record<string, number> = {};
    for (const m of meals) dayTotals[m.date] = (dayTotals[m.date] ?? 0) + (m.calories ?? 0);
    const loggedDays = Object.keys(dayTotals).length;
    const ws = weights.map((w) => Number(w.weight_kg));
    res.json({
      period: { from: fromStr, to, days },
      calories: {
        average: loggedDays > 0 ? Math.round(Object.values(dayTotals).reduce((s, v) => s + v, 0) / loggedDays) : 0,
        goal: p?.calorie_goal ?? 2000, days_logged: loggedDays,
        days_under_goal: Object.values(dayTotals).filter((c) => c <= (p?.calorie_goal ?? 2000)).length,
      },
      weight: { entries: weights.map((w: any) => ({ date: w.date, weight_kg: Number(w.weight_kg) })), change_kg: ws.length > 1 ? round1(ws[ws.length - 1] - ws[0]) : null },
      workouts: { sessions: workouts.length, total_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0), types: Array.from(new Set(workouts.map((w) => w.type))) },
    });
  });

  // ── GET /api/calories/history ─────────────────────────────────────────────
  router.get('/calories/history', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(); since.setDate(since.getDate() - days + 1);
    const sinceDate = since.toISOString().split('T')[0];
    const { data, error } = await supabase.from('daily_calorie_status').select('*').eq('user_id', userId).gte('date', sinceDate).order('date', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    const rows = (data ?? []) as any[];
    const counts = { deficit: 0, maintenance: 0, surplus: 0 } as Record<string, number>;
    let totalDelta = 0;
    for (const r of rows) { counts[r.status] = (counts[r.status] ?? 0) + 1; totalDelta += r.delta_from_tdee; }
    res.json({
      days_with_data: rows.length, summary: counts,
      avg_daily_delta_from_tdee: rows.length ? Math.round(totalDelta / rows.length) : null,
      history: rows,
    });
  });

  // ── GET /api/sleep ────────────────────────────────────────────────────────
  router.get('/sleep', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 14;
    const { data } = await supabase.from('sleep_log').select('id,date,hours,quality,notes').eq('user_id', userId).order('date', { ascending: false }).limit(limit);
    res.json(data ?? []);
  });

  // ── POST /api/sleep ───────────────────────────────────────────────────────
  router.post('/sleep', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { hours, quality, notes, date } = req.body;
    if (hours == null) { res.status(400).json({ error: 'hours is required' }); return; }
    const { error } = await supabase.from('sleep_log').upsert(
      { user_id: userId, date: date ?? today(), hours, quality: quality ?? null, notes: notes ?? null },
      { onConflict: 'user_id,date' }
    );
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, hours, date: date ?? today() });
  });

  // ── GET /api/steps ────────────────────────────────────────────────────────
  router.get('/steps', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 14;
    const { data } = await supabase.from('steps_log').select('id,date,steps').eq('user_id', userId).order('date', { ascending: false }).limit(limit);
    res.json(data ?? []);
  });

  // ── POST /api/steps ───────────────────────────────────────────────────────
  router.post('/steps', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { steps, date } = req.body;
    if (steps == null) { res.status(400).json({ error: 'steps is required' }); return; }
    const { error } = await supabase.from('steps_log').upsert(
      { user_id: userId, date: date ?? today(), steps },
      { onConflict: 'user_id,date' }
    );
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, steps, date: date ?? today() });
  });

  // ── GET /api/measurements ─────────────────────────────────────────────────
  router.get('/measurements', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 14;
    const { data } = await supabase.from('measurements_log').select('id,date,waist_cm,chest_cm,hips_cm,arm_cm,notes').eq('user_id', userId).order('date', { ascending: false }).limit(limit);
    res.json(data ?? []);
  });

  // ── POST /api/measurements ────────────────────────────────────────────────
  router.post('/measurements', async (req, res) => {
    const userId = await resolveUser(supabase, req, res);
    if (!userId) return;
    const { waist_cm, chest_cm, hips_cm, arm_cm, notes, date } = req.body;
    const row: Record<string, unknown> = { user_id: userId, date: date ?? today() };
    if (waist_cm != null) row.waist_cm = waist_cm;
    if (chest_cm != null) row.chest_cm = chest_cm;
    if (hips_cm != null) row.hips_cm = hips_cm;
    if (arm_cm != null) row.arm_cm = arm_cm;
    if (notes != null) row.notes = notes;
    const { error } = await supabase.from('measurements_log').upsert(row, { onConflict: 'user_id,date' });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ logged: true, date: row.date });
  });

  return router;
}

export function buildOpenApiSpec(baseUrl: string): object {
  return {
    openapi: '3.1.0',
    info: {
      title: 'RelieFitness',
      description: 'Personal health tracking API — log meals, weight, workouts, drinks, sleep, steps, and more.',
      version: '1.0.0',
    },
    servers: [{ url: `${baseUrl}/api` }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'Your personal RelieFitness API key (mk_...)' },
      },
    },
    paths: {
      '/today': {
        get: {
          operationId: 'getToday',
          summary: "Get today's full health summary",
          description: 'Returns calories eaten vs goal, macros, TDEE, water, weight, workouts, sleep, and steps for today.',
          responses: { '200': { description: "Today's summary" } },
        },
      },
      '/meals': {
        get: {
          operationId: 'getMeals',
          summary: 'List meals for a date',
          parameters: [{ name: 'date', in: 'query', schema: { type: 'string', example: '2025-01-15' }, description: 'YYYY-MM-DD. Defaults to today.' }],
          responses: { '200': { description: 'Meal list with totals' } },
        },
        post: {
          operationId: 'logMeal',
          summary: 'Log a meal from the food database',
          description: 'Use GET /foods to find the exact food name first.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['food_name', 'meal_type'],
                  properties: {
                    food_name: { type: 'string', description: 'Exact name from GET /foods' },
                    meal_type: { type: 'string', enum: ['breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack'] },
                    portion_multiplier: { type: 'number', description: 'Multiplier vs default portion. Default 1.0.' },
                    date: { type: 'string', description: 'YYYY-MM-DD. Defaults to today.' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Meal logged' } },
        },
      },
      '/meals/direct': {
        post: {
          operationId: 'logMealDirect',
          summary: 'Log a meal with manual nutrition values',
          description: 'Use when the food is not in the database.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['food_name', 'meal_type', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'portion_g'],
                  properties: {
                    food_name: { type: 'string' },
                    food_name_he: { type: 'string', description: 'Hebrew name if known' },
                    meal_type: { type: 'string', enum: ['breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack'] },
                    calories: { type: 'number' },
                    protein_g: { type: 'number' },
                    carbs_g: { type: 'number' },
                    fat_g: { type: 'number' },
                    sugar_g: { type: 'number' },
                    portion_g: { type: 'number' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Meal logged' } },
        },
      },
      '/meals/{id}': {
        delete: {
          operationId: 'deleteMeal',
          summary: 'Delete a meal log entry',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/foods': {
        get: {
          operationId: 'listFoods',
          summary: 'Search the food database',
          parameters: [{ name: 'search', in: 'query', schema: { type: 'string' }, description: 'English or Hebrew search term. Omit to list all.' }],
          responses: { '200': { description: 'List of foods with per-default-portion nutrition' } },
        },
        post: {
          operationId: 'addFood',
          summary: 'Add a new food to the database',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'category', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'default_portion_g'],
                  properties: {
                    name: { type: 'string' }, name_he: { type: 'string' },
                    category: { type: 'string', enum: ['home_meals', 'junk_food', 'israeli_sweets', 'drinks', 'other'] },
                    calories_per_100g: { type: 'number' }, protein_per_100g: { type: 'number' },
                    carbs_per_100g: { type: 'number' }, fat_per_100g: { type: 'number' },
                    sugar_per_100g: { type: 'number' }, default_portion_g: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Food added' } },
        },
      },
      '/profile': {
        get: {
          operationId: 'getProfile',
          summary: 'Get user profile and daily goals',
          responses: { '200': { description: 'Profile with goals' } },
        },
      },
      '/goals': {
        post: {
          operationId: 'updateGoals',
          summary: 'Update daily nutrition and hydration goals',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    calorie_goal: { type: 'number' }, protein_goal_g: { type: 'number' },
                    carbs_goal_g: { type: 'number' }, fat_goal_g: { type: 'number' },
                    sugar_goal_g: { type: 'number' }, water_goal_ml: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Goals updated' } },
        },
      },
      '/weight': {
        get: {
          operationId: 'getWeightHistory',
          summary: 'Get weight log history',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 14 } }],
          responses: { '200': { description: 'Weight entries with trend stats' } },
        },
        post: {
          operationId: 'logWeight',
          summary: 'Log body weight',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['weight_kg'],
                  properties: {
                    weight_kg: { type: 'number', description: '30–300 kg' },
                    notes: { type: 'string' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Weight logged' } },
        },
      },
      '/drinks': {
        get: {
          operationId: 'getDrinks',
          summary: 'Get drink log for a date',
          parameters: [{ name: 'date', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: 'Drink entries with totals' } },
        },
        post: {
          operationId: 'logDrink',
          summary: 'Log a drink',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'amount_ml'],
                  properties: {
                    type: { type: 'string', enum: ['water', 'zero', 'diet_coke'] },
                    amount_ml: { type: 'number' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Drink logged' } },
        },
      },
      '/workouts': {
        get: {
          operationId: 'getWorkouts',
          summary: 'Get recent workout sessions',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
          responses: { '200': { description: 'Workout list' } },
        },
        post: {
          operationId: 'logWorkout',
          summary: 'Log a workout session',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'duration_minutes'],
                  properties: {
                    type: { type: 'string', enum: ['gym', 'walk', 'run', 'swim', 'cycling', 'other'] },
                    duration_minutes: { type: 'number' },
                    notes: { type: 'string' },
                    calories_burned: { type: 'number' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Workout logged' } },
        },
      },
      '/slips': {
        get: {
          operationId: 'getSlips',
          summary: 'Get dietary slip log',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
          responses: { '200': { description: 'Slip entries' } },
        },
        post: {
          operationId: 'logSlip',
          summary: 'Log a dietary slip',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['what'],
                  properties: { what: { type: 'string' }, why: { type: 'string' }, date: { type: 'string' } },
                },
              },
            },
          },
          responses: { '201': { description: 'Slip logged' } },
        },
      },
      '/stats': {
        get: {
          operationId: 'getStats',
          summary: 'Get statistics for recent days',
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 7 } }],
          responses: { '200': { description: 'Stats for the period' } },
        },
      },
      '/calories/history': {
        get: {
          operationId: 'getCalorieHistory',
          summary: 'Daily calorie history with deficit/maintenance/surplus status',
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
          responses: { '200': { description: 'Calorie history with TDEE comparison' } },
        },
      },
      '/sleep': {
        get: {
          operationId: 'getSleep',
          summary: 'Get sleep history',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 14 } }],
          responses: { '200': { description: 'Sleep entries' } },
        },
        post: {
          operationId: 'logSleep',
          summary: 'Log a night of sleep',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['hours'],
                  properties: {
                    hours: { type: 'number' },
                    quality: { type: 'integer', description: '1 (poor) to 5 (great)' },
                    notes: { type: 'string' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Sleep logged' } },
        },
      },
      '/steps': {
        get: {
          operationId: 'getSteps',
          summary: 'Get step count history',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 14 } }],
          responses: { '200': { description: 'Steps history' } },
        },
        post: {
          operationId: 'logSteps',
          summary: 'Log daily steps',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['steps'],
                  properties: { steps: { type: 'integer' }, date: { type: 'string' } },
                },
              },
            },
          },
          responses: { '201': { description: 'Steps logged' } },
        },
      },
      '/measurements': {
        get: {
          operationId: 'getMeasurements',
          summary: 'Get body measurement history',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 14 } }],
          responses: { '200': { description: 'Measurement entries' } },
        },
        post: {
          operationId: 'logMeasurement',
          summary: 'Log body measurements (any combination of waist/chest/hips/arm)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    waist_cm: { type: 'number' }, chest_cm: { type: 'number' },
                    hips_cm: { type: 'number' }, arm_cm: { type: 'number' },
                    notes: { type: 'string' }, date: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Measurements logged' } },
        },
      },
    },
  };
}
