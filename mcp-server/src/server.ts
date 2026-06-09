import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';

function today(): string {
  return new Date().toISOString().split('T')[0];
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function createMcpServer(supabase: SupabaseClient, userId: string): Server {
  const server = new Server(
    { name: 'reliefitness', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_today',
        description:
          "Get today's full health summary: calories eaten vs goal, macros, water, weight, and workouts. Call this first when asked about today.",
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'get_meals',
        description: 'Get the meal log for a specific date (default today).',
        inputSchema: {
          type: 'object',
          properties: { date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' } },
          required: [],
        },
      },
      {
        name: 'get_weight_history',
        description: 'Get weight log history, most recent first.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Entries to return (default 14).' } },
          required: [],
        },
      },
      {
        name: 'get_drinks',
        description: 'Get drink log for a date (default today).',
        inputSchema: {
          type: 'object',
          properties: { date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' } },
          required: [],
        },
      },
      {
        name: 'get_workouts',
        description: 'Get recent workout sessions.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Entries to return (default 10).' } },
          required: [],
        },
      },
      {
        name: 'get_profile',
        description: 'Get profile: weight, target weight, height, and daily goals.',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'get_slips',
        description: 'Get recent dietary slip log entries.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Entries to return (default 10).' } },
          required: [],
        },
      },
      {
        name: 'get_weekly_stats',
        description: 'Stats for the past N days: avg calories, weight trend, workout frequency.',
        inputSchema: {
          type: 'object',
          properties: { days: { type: 'number', description: 'Days to look back (default 7).' } },
          required: [],
        },
      },
      {
        name: 'list_foods',
        description: 'Search the food database. Call before log_meal to find the exact food name.',
        inputSchema: {
          type: 'object',
          properties: { search: { type: 'string', description: 'English or Hebrew search term. Omit to list all.' } },
          required: [],
        },
      },
      {
        name: 'add_food',
        description: 'Add a new food to the permanent database. Use this when the user mentions a food not in list_foods — research its nutritional values first, then add it. Supports any food: restaurant dishes, branded products, home-cooked meals, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Food name in English.' },
            name_he: { type: 'string', description: 'Hebrew name if known.' },
            category: { type: 'string', enum: ['home_meals', 'junk_food', 'israeli_sweets', 'drinks', 'other'] },
            calories_per_100g: { type: 'number' },
            protein_per_100g: { type: 'number' },
            carbs_per_100g: { type: 'number' },
            fat_per_100g: { type: 'number' },
            default_portion_g: { type: 'number', description: 'Typical serving in grams/ml.' },
          },
          required: ['name', 'category', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'default_portion_g'],
        },
      },
      {
        name: 'log_meal',
        description: 'Log a meal. Call list_foods first — food_name must be an exact match.',
        inputSchema: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Exact name from list_foods.' },
            meal_type: {
              type: 'string',
              enum: ['breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack'],
            },
            portion_multiplier: { type: 'number', description: 'Multiplier vs default portion (0.5–2.0). Default 1.0.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['food_name', 'meal_type'],
        },
      },
      {
        name: 'log_meal_direct',
        description: 'Log a meal with explicit nutritional values — use when the exact food is not in the database and you know the nutrition. Does NOT add the food permanently.',
        inputSchema: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Display name for this entry (English).' },
            food_name_he: { type: 'string', description: 'Hebrew display name — provide so the app shows the right name in Hebrew mode.' },
            meal_type: { type: 'string', enum: ['breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack'] },
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            portion_g: { type: 'number', description: 'Actual portion in grams.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['food_name', 'meal_type', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'portion_g'],
        },
      },
      {
        name: 'delete_meal',
        description: 'Delete a meal log entry by ID. Get IDs from get_meals.',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string', description: 'Meal log entry UUID.' } },
          required: ['id'],
        },
      },
      {
        name: 'log_weight',
        description: 'Log body weight in kg. One entry per day (overwrites if already logged).',
        inputSchema: {
          type: 'object',
          properties: {
            weight_kg: { type: 'number', description: 'Body weight in kg (e.g. 101.5).' },
            notes: { type: 'string', description: 'Optional note.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['weight_kg'],
        },
      },
      {
        name: 'log_drink',
        description: 'Log a drink. Water counts toward the 2.5L daily goal.',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['water', 'zero', 'diet_coke'] },
            amount_ml: { type: 'number', description: 'Amount in ml.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['type', 'amount_ml'],
        },
      },
      {
        name: 'log_workout',
        description: 'Log a workout session.',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['gym', 'walk', 'run', 'swim', 'cycling', 'other'] },
            duration_minutes: { type: 'number' },
            notes: { type: 'string', description: 'e.g. "chest & back", "5km easy run"' },
            calories_burned: { type: 'number', description: 'Optional estimate.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['type', 'duration_minutes'],
        },
      },
      {
        name: 'log_slip',
        description: 'Log a dietary slip — no judgment, just honest tracking.',
        inputSchema: {
          type: 'object',
          properties: {
            what: { type: 'string' },
            why: { type: 'string', description: 'Optional reason.' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['what'],
        },
      },
      {
        name: 'update_goals',
        description: 'Update daily nutrition and hydration goals.',
        inputSchema: {
          type: 'object',
          properties: {
            calorie_goal: { type: 'number' },
            protein_goal_g: { type: 'number' },
            carbs_goal_g: { type: 'number' },
            fat_goal_g: { type: 'number' },
            water_goal_ml: { type: 'number', description: 'Daily water target in ml.' },
          },
          required: [],
        },
      },
      {
        name: 'log_sleep',
        description: "Log a night's sleep for a day. Upserts (one entry per date).",
        inputSchema: {
          type: 'object',
          properties: {
            hours: { type: 'number', description: 'Hours slept (e.g. 7.5).' },
            quality: { type: 'number', description: 'Quality 1 (poor) to 5 (great).' },
            notes: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['hours'],
        },
      },
      {
        name: 'get_sleep',
        description: 'Get recent sleep history.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Default 14.' } },
          required: [],
        },
      },
      {
        name: 'log_measurement',
        description: 'Log body measurements (cm) for a day. Upserts. Provide any subset.',
        inputSchema: {
          type: 'object',
          properties: {
            waist_cm: { type: 'number' },
            chest_cm: { type: 'number' },
            hips_cm: { type: 'number' },
            arm_cm: { type: 'number' },
            notes: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: [],
        },
      },
      {
        name: 'get_measurements',
        description: 'Get recent body measurement history.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Default 14.' } },
          required: [],
        },
      },
      {
        name: 'log_steps',
        description: 'Log daily step count. Upserts (one entry per date).',
        inputSchema: {
          type: 'object',
          properties: {
            steps: { type: 'number' },
            date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' },
          },
          required: ['steps'],
        },
      },
      {
        name: 'get_steps',
        description: 'Get recent daily step history.',
        inputSchema: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Default 14.' } },
          required: [],
        },
      },
      {
        name: 'get_workout_session',
        description:
          'Get full details of a guided workout session for a date (default most recent): every exercise, each set with weight/reps, total volume, duration and estimated calories.',
        inputSchema: {
          type: 'object',
          properties: { date: { type: 'string', description: 'YYYY-MM-DD. Omit for the most recent completed session.' } },
          required: [],
        },
      },
      {
        name: 'get_workout_progression',
        description:
          'Show weight/rep history over time for a single exercise (by name), one entry per session, oldest to newest. Use to see if the user is progressing on a specific lift.',
        inputSchema: {
          type: 'object',
          properties: {
            exercise_name: { type: 'string', description: 'Exercise name or partial match, e.g. "incline" or "lat pulldown".' },
            limit: { type: 'number', description: 'Number of past sessions (default 10).' },
          },
          required: ['exercise_name'],
        },
      },
      {
        name: 'get_volume_trend',
        description: 'Total training volume (kg lifted) per week over the last N weeks, plus session counts.',
        inputSchema: {
          type: 'object',
          properties: { weeks: { type: 'number', description: 'Number of weeks (default 8).' } },
          required: [],
        },
      },
      {
        name: 'get_personal_records',
        description: 'All-time personal records per exercise: heaviest weight and best estimated 1-rep max.',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },

      // ─────────────────────────────────────────────────────────────────────
      // COACH TOOLS — full control over the user's workout plan.
      // The plan is what the app pre-fills (predetermined weight + reps) and
      // what guided mode executes. Build it with save_workout_day, inspect it
      // with get_workout_plan, and progress it with update_exercise_target.
      // ─────────────────────────────────────────────────────────────────────
      {
        name: 'get_exercise_catalog',
        description:
          'List every exercise available to put in a plan (slug, name, type, muscle groups, timed flag, hernia warning). Call this before save_workout_day so you use exact slugs. If an exercise you want is missing, create it with add_exercise.',
        inputSchema: {
          type: 'object',
          properties: { search: { type: 'string', description: 'Optional name filter.' } },
          required: [],
        },
      },
      {
        name: 'add_exercise',
        description:
          'Add a new exercise to the catalog so it can be used in a plan. Research the movement first. Provide a demo_gif_url if you can find a directly-linkable image/gif.',
        inputSchema: {
          type: 'object',
          properties: {
            name_en: { type: 'string' },
            name_he: { type: 'string', description: 'Hebrew name if known.' },
            slug: { type: 'string', description: 'kebab-case unique id. Omit to auto-generate from name.' },
            exercise_type: { type: 'string', enum: ['compound', 'isolation'] },
            muscle_groups: { type: 'array', items: { type: 'string' }, description: 'e.g. ["chest","triceps"]' },
            default_rest_seconds: { type: 'number', description: 'Default 60.' },
            demo_gif_url: { type: 'string' },
            instructions_text: { type: 'string' },
            hernia_warning: { type: 'boolean', description: 'True if it stresses the abdominal wall (user has a hernia).' },
            is_timed: { type: 'boolean', description: 'True if reps actually mean seconds held (e.g. plank).' },
          },
          required: ['name_en', 'exercise_type', 'muscle_groups'],
        },
      },
      {
        name: 'get_workout_plan',
        description:
          "Read the user's current workout plan day-by-day: every exercise with target sets, rep range, predetermined weight, rest, and your progression note. Also shows each lift's most recent performed top set so you can compare planned vs actual. If the user has no personal plan yet, returns the default system split flagged source:'system' — build a personal one with save_workout_day.",
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'save_workout_day',
        description:
          "Create or replace ONE day of the user's personal plan (idempotent on day_order). Pass the full ordered exercise list for that day — it fully replaces that day's exercises. This is the main tool for building a plan: call it once per training day. Marks the plan as the user's active coach plan, which the app uses instead of the default split.",
        inputSchema: {
          type: 'object',
          properties: {
            day_order: { type: 'number', description: 'Day position in the rotation (1,2,3,...). Reusing a number overwrites that day.' },
            day_name: { type: 'string', description: 'e.g. "Pull A", "Push", "Legs & Core".' },
            phase: { type: 'string', description: 'Optional focus tag, e.g. "Hypertrophy".' },
            coach_note: { type: 'string', description: 'Short guidance shown to the user for this day.' },
            auto_progress: { type: 'boolean', description: 'If true (default), the app auto-bumps target weight +2.5kg when the user hits the top of the rep range on every set.' },
            exercises: {
              type: 'array',
              description: 'Ordered list of exercises for this day.',
              items: {
                type: 'object',
                properties: {
                  exercise_slug: { type: 'string', description: 'Exact slug from get_exercise_catalog.' },
                  target_sets: { type: 'number', description: 'Default 3.' },
                  reps_min: { type: 'number', description: 'Bottom of rep range (or seconds if timed). Default 8.' },
                  reps_max: { type: 'number', description: 'Top of rep range. Omit for a fixed target.' },
                  target_weight_kg: { type: 'number', description: 'Predetermined working weight. Omit for bodyweight/timed moves.' },
                  rest_seconds: { type: 'number', description: 'Rest after each set. Default = exercise default.' },
                  progression_note: { type: 'string', description: 'e.g. "Add 2.5kg once you get 12 on all sets".' },
                  warning_text: { type: 'string', description: 'Form/safety cue shown prominently.' },
                },
                required: ['exercise_slug'],
              },
            },
          },
          required: ['day_order', 'day_name', 'exercises'],
        },
      },
      {
        name: 'update_exercise_target',
        description:
          'Adjust a single exercise in the plan without rebuilding the whole day — use this to progress (raise weight/reps) or tweak. Provide only the fields you want to change.',
        inputSchema: {
          type: 'object',
          properties: {
            day_order: { type: 'number', description: 'Which day the exercise is on.' },
            exercise_slug: { type: 'string' },
            target_weight_kg: { type: 'number' },
            reps_min: { type: 'number' },
            reps_max: { type: 'number' },
            target_sets: { type: 'number' },
            progression_note: { type: 'string' },
          },
          required: ['day_order', 'exercise_slug'],
        },
      },
      {
        name: 'delete_workout_day',
        description: "Remove one day from the user's personal plan by day_order.",
        inputSchema: {
          type: 'object',
          properties: { day_order: { type: 'number' } },
          required: ['day_order'],
        },
      },
      {
        name: 'get_workout_adherence',
        description:
          'Coaching report: how many guided sessions were actually completed each of the last N weeks vs the number of planned days, plus a per-exercise "ready to progress" check (did they hit the top of the rep range on every set last time?). Use this to decide whether to raise weights/reps.',
        inputSchema: {
          type: 'object',
          properties: { weeks: { type: 'number', description: 'Weeks to look back (default 4).' } },
          required: [],
        },
      },
      {
        name: 'get_calorie_history',
        description:
          'Daily calorie history with TDEE comparison. Returns deficit/maintenance/surplus status, total calories, and delta vs maintenance for each day. Use this to monitor weight-loss progress, spot problem days, and decide whether to adjust the calorie goal.',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'How many days to look back (default 30).' },
          },
          required: [],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const a = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case 'get_today': {
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
          // TDEE via Mifflin-St Jeor
          const weightKg = weights[0] ? Number(weights[0].weight_kg) : Number(p?.current_weight_kg ?? 80);
          const heightCm = Number(p?.height_cm ?? 175);
          const age = new Date().getFullYear() - Number(p?.birth_year ?? 2000);
          const sexOffset = p?.sex === 'female' ? -161 : 5;
          const activityMultiplier: Record<string, number> = {
            sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55,
            very_active: 1.725, extra_active: 1.9,
          };
          const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
          const tdee = Math.round(bmr * (activityMultiplier[p?.activity_level ?? 'lightly_active'] ?? 1.375));
          const calorieStatus = totalCal > tdee + 50 ? 'surplus' : totalCal < tdee - 50 ? 'deficit' : 'maintenance';
          return {
            content: [{
              type: 'text', text: JSON.stringify({
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
                },
                meals_logged: meals.length,
                water_ml: totalWater, water_goal_ml: waterGoal, water_remaining_ml: Math.max(0, waterGoal - totalWater),
                weight: { current_kg: weights[0] ? Number(weights[0].weight_kg) : null, logged_today: weights[0]?.date === d },
                workouts: workouts.map((w) => ({ type: w.type, duration_minutes: w.duration_minutes, calories_burned: w.calories_burned, notes: w.notes })),
                total_workout_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
                sleep: sleep ? { hours: Number(sleep.hours), quality: sleep.quality } : null,
                steps: steps ? steps.steps : null,
              }, null, 2),
            }],
          };
        }

        case 'get_meals': {
          const d = (a.date as string) ?? today();
          const { data } = await supabase.from('meals_log').select('id,meal_type,food_name,portion_g,calories,protein_g,carbs_g,fat_g,logged_at').eq('user_id', userId).eq('date', d).order('logged_at');
          const meals = (data ?? []) as any[];
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                date: d,
                totals: {
                  calories: Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0)),
                  protein_g: round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)),
                  carbs_g: round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)),
                  fat_g: round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)),
                },
                meals,
              }, null, 2),
            }],
          };
        }

        case 'get_weight_history': {
          const { data } = await supabase.from('weight_log').select('id,date,weight_kg,notes').eq('user_id', userId).order('date', { ascending: false }).limit((a.limit as number) ?? 14);
          const entries = (data ?? []).map((e: any) => ({ ...e, weight_kg: Number(e.weight_kg) }));
          const ws = entries.map((e) => e.weight_kg);
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                entries,
                stats: ws.length > 1 ? { current: ws[0], oldest: ws[ws.length - 1], change_kg: round1(ws[0] - ws[ws.length - 1]) } : null,
              }, null, 2),
            }],
          };
        }

        case 'get_drinks': {
          const d = (a.date as string) ?? today();
          const { data } = await supabase.from('drinks_log').select('id,type,amount_ml,logged_at').eq('user_id', userId).eq('date', d).order('logged_at');
          const drinks = (data ?? []) as any[];
          const byType: Record<string, number> = {};
          for (const dr of drinks) byType[dr.type] = (byType[dr.type] ?? 0) + dr.amount_ml;
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                date: d, entries: drinks,
                totals: { ...byType, all: Object.values(byType).reduce((s, v) => s + v, 0) },
                water_goal_ml: 2500, water_remaining_ml: Math.max(0, 2500 - (byType.water ?? 0)),
              }, null, 2),
            }],
          };
        }

        case 'get_workouts': {
          const { data } = await supabase.from('workout_log').select('id,date,type,duration_minutes,calories_burned,notes,logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit((a.limit as number) ?? 10);
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'get_profile': {
          const { data } = await supabase.from('user_profile').select('*').eq('user_id', userId).single();
          const p = data as any;
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                name: p.name, height_cm: p.height_cm,
                current_weight_kg: Number(p.current_weight_kg), target_weight_kg: Number(p.target_weight_kg),
                to_lose_kg: round1(Number(p.current_weight_kg) - Number(p.target_weight_kg)),
                goals: { calorie_goal: p.calorie_goal, protein_goal_g: p.protein_goal_g, carbs_goal_g: p.carbs_goal_g, fat_goal_g: p.fat_goal_g, water_goal_ml: p.water_goal_ml ?? 2500 },
              }, null, 2),
            }],
          };
        }

        case 'get_slips': {
          const { data } = await supabase.from('slip_log').select('id,date,what,why,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit((a.limit as number) ?? 10);
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'get_weekly_stats': {
          const days = (a.days as number) ?? 7;
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
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                period: { from: fromStr, to, days },
                calories: {
                  average: loggedDays > 0 ? Math.round(Object.values(dayTotals).reduce((s, v) => s + v, 0) / loggedDays) : 0,
                  goal: p?.calorie_goal ?? 2000, days_logged: loggedDays,
                  days_under_goal: Object.values(dayTotals).filter((c) => c <= (p?.calorie_goal ?? 2000)).length,
                },
                weight: { entries: weights.map((w: any) => ({ date: w.date, weight_kg: Number(w.weight_kg) })), change_kg: ws.length > 1 ? round1(ws[ws.length - 1] - ws[0]) : null },
                workouts: { sessions: workouts.length, total_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0), types: Array.from(new Set(workouts.map((w) => w.type))) },
              }, null, 2),
            }],
          };
        }

        case 'list_foods': {
          let query = supabase.from('foods').select('name,name_he,category,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,default_portion_g').eq('is_active', true).order('category').order('name');
          if (a.search) query = (query as any).or(`name.ilike.%${a.search}%,name_he.ilike.%${a.search}%`);
          const { data } = await query.limit(60);
          const foods = (data ?? []).map((f: any) => ({
            name: f.name, name_he: f.name_he, category: f.category, default_portion_g: f.default_portion_g,
            per_default_portion: {
              calories: Math.round(f.calories_per_100g * f.default_portion_g / 100),
              protein_g: round1(f.protein_per_100g * f.default_portion_g / 100),
              carbs_g: round1(f.carbs_per_100g * f.default_portion_g / 100),
              fat_g: round1(f.fat_per_100g * f.default_portion_g / 100),
            },
          }));
          return { content: [{ type: 'text', text: JSON.stringify(foods, null, 2) }] };
        }

        case 'log_meal': {
          const { data: foods } = await supabase.from('foods').select('*').ilike('name', a.food_name as string).eq('is_active', true).limit(1);
          if (!foods?.length) return { content: [{ type: 'text', text: `Food not found: "${a.food_name}". Use list_foods to find the exact name.` }], isError: true };
          const food = foods[0] as any;
          const mult = (a.portion_multiplier as number) ?? 1.0;
          const portionG = Math.round(food.default_portion_g * mult);
          const f = portionG / 100;
          const { data: inserted, error } = await supabase.from('meals_log').insert({
            user_id: userId, date: (a.date as string) ?? today(), meal_type: a.meal_type,
            food_id: food.id, food_name: food.name, food_name_he: food.name_he ?? null, portion_g: portionG,
            calories: Math.round(food.calories_per_100g * f),
            protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f), fat_g: round1(food.fat_per_100g * f),
            status: 'eaten',
          }).select('id').single();
          if (error) throw error;
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                logged: true, id: (inserted as any)?.id, food: food.name, meal_type: a.meal_type,
                portion_g: portionG, calories: Math.round(food.calories_per_100g * f),
                protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f), fat_g: round1(food.fat_per_100g * f),
              }, null, 2),
            }],
          };
        }

        case 'add_food': {
          const { data: existing } = await supabase.from('foods').select('name').ilike('name', a.name as string).limit(1);
          if (existing?.length) {
            return { content: [{ type: 'text', text: `Food "${a.name}" already exists. Use log_meal with this exact name.` }] };
          }
          const portionG = a.default_portion_g as number;
          const f = portionG / 100;
          const { error } = await supabase.from('foods').insert({
            name: a.name,
            name_he: (a.name_he as string) ?? null,
            category: a.category,
            calories_per_100g: a.calories_per_100g,
            protein_per_100g: a.protein_per_100g,
            carbs_per_100g: a.carbs_per_100g,
            fat_per_100g: a.fat_per_100g,
            default_portion_g: portionG,
            is_active: true,
          });
          if (error) throw error;
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                added: true,
                name: a.name,
                category: a.category,
                per_default_portion: {
                  calories: Math.round((a.calories_per_100g as number) * f),
                  protein_g: round1((a.protein_per_100g as number) * f),
                  carbs_g: round1((a.carbs_per_100g as number) * f),
                  fat_g: round1((a.fat_per_100g as number) * f),
                },
                next_step: 'Food saved. Now call log_meal with this exact name.',
              }, null, 2),
            }],
          };
        }

        case 'log_meal_direct': {
          const directName = typeof a.food_name === 'string' ? a.food_name.trim() : '';
          if (!directName) {
            return { content: [{ type: 'text', text: 'food_name is required and cannot be empty. Provide the display name of the food being logged.' }], isError: true };
          }
          const { data: inserted, error } = await supabase.from('meals_log').insert({
            user_id: userId,
            date: (a.date as string) ?? today(),
            meal_type: a.meal_type,
            food_name: directName,
            food_name_he: (a.food_name_he as string) ?? null,
            portion_g: a.portion_g,
            calories: a.calories,
            protein_g: a.protein_g,
            carbs_g: a.carbs_g,
            fat_g: a.fat_g,
            status: 'eaten',
          }).select('id').single();
          if (error) throw error;
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                logged: true,
                id: (inserted as any)?.id,
                food_name: directName,
                meal_type: a.meal_type,
                date: (a.date as string) ?? today(),
                portion_g: a.portion_g,
                calories: a.calories,
                protein_g: a.protein_g,
                carbs_g: a.carbs_g,
                fat_g: a.fat_g,
              }, null, 2),
            }],
          };
        }

        case 'delete_meal': {
          const { error } = await supabase.from('meals_log').delete().eq('id', a.id as string).eq('user_id', userId);
          if (error) throw error;
          return { content: [{ type: 'text', text: `Deleted meal log entry ${a.id}` }] };
        }

        case 'log_weight': {
          const weight = a.weight_kg as number;
          if (weight < 30 || weight > 300) return { content: [{ type: 'text', text: 'Invalid weight (must be 30–300 kg).' }], isError: true };
          const { error } = await supabase.from('weight_log').upsert(
            { user_id: userId, date: (a.date as string) ?? today(), weight_kg: weight, notes: (a.notes as string) ?? null },
            { onConflict: 'user_id,date' }
          );
          if (error) throw error;
          return { content: [{ type: 'text', text: `Logged ${weight} kg` }] };
        }

        case 'log_drink': {
          const d = (a.date as string) ?? today();
          const { error } = await supabase.from('drinks_log').insert({ user_id: userId, date: d, type: a.type, amount_ml: a.amount_ml });
          if (error) throw error;
          const { data: todayDrinks } = await supabase.from('drinks_log').select('type,amount_ml').eq('user_id', userId).eq('date', d);
          const totalWater = (todayDrinks ?? []).filter((x: any) => x.type === 'water').reduce((s, x: any) => s + x.amount_ml, 0);
          return {
            content: [{
              type: 'text', text: JSON.stringify({ logged: true, type: a.type, amount_ml: a.amount_ml, total_water_today_ml: totalWater, water_remaining_ml: Math.max(0, 2500 - totalWater) }, null, 2),
            }],
          };
        }

        case 'log_workout': {
          const { error } = await supabase.from('workout_log').insert({
            user_id: userId, date: (a.date as string) ?? today(),
            type: a.type, duration_minutes: a.duration_minutes,
            calories_burned: (a.calories_burned as number) ?? null, notes: (a.notes as string) ?? null,
          });
          if (error) throw error;
          return { content: [{ type: 'text', text: `Logged ${a.type} workout: ${a.duration_minutes} min${a.notes ? ` — ${a.notes}` : ''}` }] };
        }

        case 'log_slip': {
          const { error } = await supabase.from('slip_log').insert({ user_id: userId, date: (a.date as string) ?? today(), what: a.what, why: (a.why as string) ?? null });
          if (error) throw error;
          return { content: [{ type: 'text', text: `Slip logged: "${a.what}"` }] };
        }

        case 'update_goals': {
          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (a.calorie_goal != null) updates.calorie_goal = a.calorie_goal;
          if (a.protein_goal_g != null) updates.protein_goal_g = a.protein_goal_g;
          if (a.carbs_goal_g != null) updates.carbs_goal_g = a.carbs_goal_g;
          if (a.fat_goal_g != null) updates.fat_goal_g = a.fat_goal_g;
          if (a.water_goal_ml != null) updates.water_goal_ml = a.water_goal_ml;
          const { error } = await supabase.from('user_profile').update(updates).eq('user_id', userId);
          if (error) throw error;
          return { content: [{ type: 'text', text: `Goals updated: ${JSON.stringify(updates)}` }] };
        }

        case 'log_sleep': {
          const { error } = await supabase.from('sleep_log').upsert(
            { user_id: userId, date: (a.date as string) ?? today(), hours: a.hours, quality: (a.quality as number) ?? null, notes: (a.notes as string) ?? null },
            { onConflict: 'user_id,date' },
          );
          if (error) throw error;
          return { content: [{ type: 'text', text: `Logged ${a.hours}h of sleep${a.quality ? ` (quality ${a.quality}/5)` : ''}.` }] };
        }

        case 'get_sleep': {
          const { data } = await supabase.from('sleep_log').select('id,date,hours,quality,notes').eq('user_id', userId).order('date', { ascending: false }).limit((a.limit as number) ?? 14);
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'log_measurement': {
          const row: Record<string, unknown> = { user_id: userId, date: (a.date as string) ?? today() };
          if (a.waist_cm != null) row.waist_cm = a.waist_cm;
          if (a.chest_cm != null) row.chest_cm = a.chest_cm;
          if (a.hips_cm != null) row.hips_cm = a.hips_cm;
          if (a.arm_cm != null) row.arm_cm = a.arm_cm;
          if (a.notes != null) row.notes = a.notes;
          const { error } = await supabase.from('measurements_log').upsert(row, { onConflict: 'user_id,date' });
          if (error) throw error;
          return { content: [{ type: 'text', text: `Measurements logged for ${row.date}.` }] };
        }

        case 'get_measurements': {
          const { data } = await supabase.from('measurements_log').select('id,date,waist_cm,chest_cm,hips_cm,arm_cm,notes').eq('user_id', userId).order('date', { ascending: false }).limit((a.limit as number) ?? 14);
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'log_steps': {
          const { error } = await supabase.from('steps_log').upsert(
            { user_id: userId, date: (a.date as string) ?? today(), steps: a.steps },
            { onConflict: 'user_id,date' },
          );
          if (error) throw error;
          return { content: [{ type: 'text', text: `Logged ${a.steps} steps.` }] };
        }

        case 'get_steps': {
          const { data } = await supabase.from('steps_log').select('id,date,steps').eq('user_id', userId).order('date', { ascending: false }).limit((a.limit as number) ?? 14);
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'get_workout_session': {
          let sessionQuery = supabase
            .from('workout_sessions')
            .select('id,date,started_at,ended_at,completed_status,total_volume_kg,estimated_calories,template_id')
            .eq('user_id', userId)
            .eq('completed_status', 'completed');
          if (a.date) sessionQuery = sessionQuery.eq('date', a.date as string);
          const { data: sess } = await sessionQuery.order('ended_at', { ascending: false }).limit(1).maybeSingle();
          if (!sess) return { content: [{ type: 'text', text: 'No completed workout session found.' }] };

          const [{ data: tpl }, { data: setRows }] = await Promise.all([
            supabase.from('workout_templates').select('day_name,phase').eq('id', (sess as any).template_id).maybeSingle(),
            supabase.from('workout_set_log').select('exercise_id,set_number,weight_kg,reps,was_failure').eq('session_id', (sess as any).id).order('set_number'),
          ]);
          const sets = (setRows ?? []) as any[];
          const exIds = Array.from(new Set(sets.map((s) => s.exercise_id)));
          const { data: exRows } = await supabase.from('exercises').select('id,name_en').in('id', exIds.length ? exIds : ['00000000-0000-0000-0000-000000000000']);
          const nameById = new Map((exRows ?? []).map((e: any) => [e.id, e.name_en]));
          const byExercise = exIds.map((id) => ({
            exercise: nameById.get(id) ?? 'Exercise',
            sets: sets.filter((s) => s.exercise_id === id).map((s) => ({ set: s.set_number, weight_kg: Number(s.weight_kg), reps: s.reps, failure: s.was_failure })),
          }));
          return { content: [{ type: 'text', text: JSON.stringify({
            date: (sess as any).date,
            day: (tpl as any)?.day_name ?? null,
            phase: (tpl as any)?.phase ?? null,
            total_volume_kg: Number((sess as any).total_volume_kg),
            estimated_calories: (sess as any).estimated_calories,
            exercises: byExercise,
          }, null, 2) }] };
        }

        case 'get_workout_progression': {
          const term = String(a.exercise_name ?? '').trim();
          const { data: matches } = await supabase.from('exercises').select('id,name_en').ilike('name_en', `%${term}%`).limit(1);
          const ex = (matches ?? [])[0] as any;
          if (!ex) return { content: [{ type: 'text', text: `No exercise matching "${term}".` }] };
          const { data: rows } = await supabase
            .from('workout_set_log')
            .select('weight_kg,reps,session_id,completed_at')
            .eq('user_id', userId)
            .eq('exercise_id', ex.id)
            .order('completed_at', { ascending: false })
            .limit(300);
          const all = (rows ?? []) as any[];
          // Group by session, summarize top set per session
          const bySession = new Map<string, any[]>();
          for (const r of all) {
            if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
            bySession.get(r.session_id)!.push(r);
          }
          const limit = (a.limit as number) ?? 10;
          const sessions = Array.from(bySession.values())
            .map((ss) => {
              const top = ss.reduce((b, s) => (Number(s.weight_kg) > Number(b.weight_kg) ? s : b), ss[0]);
              const e1rm = Number(top.weight_kg) * (1 + top.reps / 30);
              return { date: String(top.completed_at).slice(0, 10), top_weight_kg: Number(top.weight_kg), reps: top.reps, sets: ss.length, est_1rm_kg: Math.round(e1rm) };
            })
            .sort((x, y) => (x.date < y.date ? -1 : 1))
            .slice(-limit);
          return { content: [{ type: 'text', text: JSON.stringify({ exercise: ex.name_en, sessions }, null, 2) }] };
        }

        case 'get_volume_trend': {
          const weeks = (a.weeks as number) ?? 8;
          const since = new Date(Date.now() - weeks * 7 * 86400000).toISOString().slice(0, 10);
          const { data: rows } = await supabase
            .from('workout_set_log')
            .select('weight_kg,reps,completed_at')
            .eq('user_id', userId)
            .gte('completed_at', since);
          const all = (rows ?? []) as any[];
          const buckets = new Map<string, { volume: number; sets: number }>();
          for (const r of all) {
            const d = new Date(r.completed_at);
            const day = (d.getUTCDay() + 6) % 7; // Monday=0
            const monday = new Date(d);
            monday.setUTCDate(d.getUTCDate() - day);
            const key = monday.toISOString().slice(0, 10);
            const b = buckets.get(key) ?? { volume: 0, sets: 0 };
            b.volume += Number(r.weight_kg) * r.reps;
            b.sets += 1;
            buckets.set(key, b);
          }
          const trend = Array.from(buckets.entries())
            .map(([week_starting, v]) => ({ week_starting, volume_kg: Math.round(v.volume), sets: v.sets }))
            .sort((x, y) => (x.week_starting < y.week_starting ? -1 : 1));
          return { content: [{ type: 'text', text: JSON.stringify({ weeks, trend }, null, 2) }] };
        }

        case 'get_personal_records': {
          const { data: rows } = await supabase
            .from('workout_set_log')
            .select('exercise_id,weight_kg,reps')
            .eq('user_id', userId);
          const all = (rows ?? []) as any[];
          if (all.length === 0) return { content: [{ type: 'text', text: 'No workout sets logged yet.' }] };
          const exIds = Array.from(new Set(all.map((r) => r.exercise_id)));
          const { data: exRows } = await supabase.from('exercises').select('id,name_en').in('id', exIds);
          const nameById = new Map((exRows ?? []).map((e: any) => [e.id, e.name_en]));
          const prs = exIds.map((id) => {
            const mine = all.filter((r) => r.exercise_id === id);
            const heaviest = mine.reduce((b, s) => (Number(s.weight_kg) > Number(b.weight_kg) ? s : b), mine[0]);
            const bestE1rm = mine.reduce((m, s) => Math.max(m, Number(s.weight_kg) * (1 + s.reps / 30)), 0);
            return {
              exercise: nameById.get(id) ?? 'Exercise',
              heaviest_kg: Number(heaviest.weight_kg),
              heaviest_reps: heaviest.reps,
              best_est_1rm_kg: Math.round(bestE1rm),
            };
          }).sort((x, y) => y.heaviest_kg - x.heaviest_kg);
          return { content: [{ type: 'text', text: JSON.stringify(prs, null, 2) }] };
        }

        case 'get_exercise_catalog': {
          let q = supabase.from('exercises').select('slug,name_en,name_he,exercise_type,muscle_groups,is_timed,hernia_warning,default_rest_seconds').order('name_en');
          if (a.search) q = (q as any).ilike('name_en', `%${a.search}%`);
          const { data } = await q;
          return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
        }

        case 'add_exercise': {
          const nameEn = String(a.name_en ?? '').trim();
          if (!nameEn) return { content: [{ type: 'text', text: 'name_en is required.' }], isError: true };
          const slug = (a.slug as string)?.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const { data: existing } = await supabase.from('exercises').select('slug').eq('slug', slug).maybeSingle();
          if (existing) return { content: [{ type: 'text', text: `Exercise "${slug}" already exists — use it directly in save_workout_day.` }] };
          const { error } = await supabase.from('exercises').insert({
            slug, name_en: nameEn, name_he: (a.name_he as string) ?? null,
            exercise_type: a.exercise_type, muscle_groups: (a.muscle_groups as string[]) ?? [],
            default_rest_seconds: (a.default_rest_seconds as number) ?? 60,
            demo_gif_url: (a.demo_gif_url as string) ?? null,
            instructions_text: (a.instructions_text as string) ?? null,
            hernia_warning: (a.hernia_warning as boolean) ?? false,
            is_timed: (a.is_timed as boolean) ?? false,
          });
          if (error) throw error;
          return { content: [{ type: 'text', text: `Added exercise "${nameEn}" (slug: ${slug}).` }] };
        }

        case 'get_workout_plan': {
          // Prefer the user's active coach plan; fall back to the system split.
          let { data: tpls } = await supabase
            .from('workout_templates')
            .select('id,day_order,day_name,phase,coach_note,source,auto_progress')
            .eq('user_id', userId).eq('is_active', true).order('day_order');
          let isPersonal = (tpls ?? []).length > 0;
          if (!isPersonal) {
            const sys = await supabase
              .from('workout_templates')
              .select('id,day_order,day_name,phase,coach_note,source,auto_progress')
              .is('user_id', null).order('day_order');
            tpls = sys.data ?? [];
          }
          const templates = (tpls ?? []) as any[];
          const tplIds = templates.map((t) => t.id);
          const { data: texRows } = await supabase
            .from('workout_template_exercises')
            .select('template_id,order_index,target_sets,target_reps_min,target_reps_max,target_weight_kg,rest_seconds,progression_note,warning_text,exercise:exercises(slug,name_en,is_timed)')
            .in('template_id', tplIds.length ? tplIds : ['00000000-0000-0000-0000-000000000000'])
            .order('order_index');
          const tex = (texRows ?? []) as any[];

          // Most recent performed top set per exercise (planned vs actual).
          const { data: recentSets } = await supabase
            .from('workout_set_log')
            .select('exercise_id,weight_kg,reps,completed_at')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
            .limit(400);
          const lastByEx = new Map<string, { weight_kg: number; reps: number }>();
          for (const r of (recentSets ?? []) as any[]) {
            if (!lastByEx.has(r.exercise_id)) lastByEx.set(r.exercise_id, { weight_kg: Number(r.weight_kg), reps: r.reps });
          }
          const { data: exIdRows } = await supabase.from('exercises').select('id,slug');
          const idBySlug = new Map((exIdRows ?? []).map((e: any) => [e.slug, e.id]));

          const days = templates.map((t) => ({
            day_order: t.day_order, day_name: t.day_name, phase: t.phase, coach_note: t.coach_note,
            auto_progress: t.auto_progress,
            exercises: tex.filter((x) => x.template_id === t.id).map((x) => {
              const last = lastByEx.get(idBySlug.get(x.exercise?.slug) as string);
              return {
                exercise_slug: x.exercise?.slug, name: x.exercise?.name_en, is_timed: x.exercise?.is_timed,
                target_sets: x.target_sets, reps_min: x.target_reps_min, reps_max: x.target_reps_max,
                target_weight_kg: x.target_weight_kg != null ? Number(x.target_weight_kg) : null,
                rest_seconds: x.rest_seconds, progression_note: x.progression_note, warning_text: x.warning_text,
                last_performed: last ? { weight_kg: last.weight_kg, reps: last.reps } : null,
              };
            }),
          }));
          return { content: [{ type: 'text', text: JSON.stringify({ source: isPersonal ? 'coach' : 'system', editable: isPersonal, days }, null, 2) }] };
        }

        case 'save_workout_day': {
          const dayOrder = a.day_order as number;
          const exInput = (a.exercises as any[]) ?? [];
          if (!exInput.length) return { content: [{ type: 'text', text: 'Provide at least one exercise.' }], isError: true };

          // Resolve slugs → ids
          const slugs = exInput.map((e) => e.exercise_slug);
          const { data: exRows } = await supabase.from('exercises').select('id,slug,default_rest_seconds').in('slug', slugs);
          const bySlug = new Map((exRows ?? []).map((e: any) => [e.slug, e]));
          const missing = slugs.filter((s) => !bySlug.has(s));
          if (missing.length) return { content: [{ type: 'text', text: `Unknown exercise slug(s): ${missing.join(', ')}. Check get_exercise_catalog or create them with add_exercise.` }], isError: true };

          // Upsert the template by (user, day_order)
          const { data: existingTpl } = await supabase
            .from('workout_templates').select('id')
            .eq('user_id', userId).eq('day_order', dayOrder).maybeSingle();
          let templateId: string;
          const tplFields = {
            day_name: a.day_name, phase: (a.phase as string) ?? null, coach_note: (a.coach_note as string) ?? null,
            source: 'coach', is_active: true, auto_progress: (a.auto_progress as boolean) ?? true,
          };
          if (existingTpl) {
            templateId = (existingTpl as any).id;
            await supabase.from('workout_templates').update(tplFields).eq('id', templateId);
            await supabase.from('workout_template_exercises').delete().eq('template_id', templateId);
          } else {
            const { data: ins, error } = await supabase.from('workout_templates')
              .insert({ user_id: userId, day_order: dayOrder, ...tplFields }).select('id').single();
            if (error) throw error;
            templateId = (ins as any).id;
          }

          const rows = exInput.map((e, i) => {
            const ex = bySlug.get(e.exercise_slug) as any;
            return {
              template_id: templateId, exercise_id: ex.id, order_index: i,
              target_sets: e.target_sets ?? 3, target_reps_min: e.reps_min ?? 8,
              target_reps_max: e.reps_max ?? null,
              target_weight_kg: e.target_weight_kg ?? null,
              rest_seconds: e.rest_seconds ?? ex.default_rest_seconds ?? 60,
              progression_note: e.progression_note ?? null, warning_text: e.warning_text ?? null,
            };
          });
          const { error: insErr } = await supabase.from('workout_template_exercises').insert(rows);
          if (insErr) throw insErr;
          return { content: [{ type: 'text', text: JSON.stringify({ saved: true, day_order: dayOrder, day_name: a.day_name, exercises: rows.length }, null, 2) }] };
        }

        case 'update_exercise_target': {
          const { data: tpl } = await supabase.from('workout_templates').select('id')
            .eq('user_id', userId).eq('day_order', a.day_order as number).maybeSingle();
          if (!tpl) return { content: [{ type: 'text', text: `No personal plan day with day_order ${a.day_order}. Build it with save_workout_day first.` }], isError: true };
          const { data: ex } = await supabase.from('exercises').select('id').eq('slug', a.exercise_slug as string).maybeSingle();
          if (!ex) return { content: [{ type: 'text', text: `Unknown exercise slug: ${a.exercise_slug}.` }], isError: true };
          const upd: Record<string, unknown> = {};
          if (a.target_weight_kg != null) upd.target_weight_kg = a.target_weight_kg;
          if (a.reps_min != null) upd.target_reps_min = a.reps_min;
          if (a.reps_max != null) upd.target_reps_max = a.reps_max;
          if (a.target_sets != null) upd.target_sets = a.target_sets;
          if (a.progression_note != null) upd.progression_note = a.progression_note;
          if (Object.keys(upd).length === 0) return { content: [{ type: 'text', text: 'Nothing to update.' }] };
          const { error } = await supabase.from('workout_template_exercises')
            .update(upd).eq('template_id', (tpl as any).id).eq('exercise_id', (ex as any).id);
          if (error) throw error;
          return { content: [{ type: 'text', text: JSON.stringify({ updated: true, day_order: a.day_order, exercise_slug: a.exercise_slug, changes: upd }, null, 2) }] };
        }

        case 'delete_workout_day': {
          const { data: tpl } = await supabase.from('workout_templates').select('id')
            .eq('user_id', userId).eq('day_order', a.day_order as number).maybeSingle();
          if (!tpl) return { content: [{ type: 'text', text: `No personal plan day with day_order ${a.day_order}.` }] };
          const { error } = await supabase.from('workout_templates').delete().eq('id', (tpl as any).id);
          if (error) throw error;
          return { content: [{ type: 'text', text: `Deleted plan day ${a.day_order}.` }] };
        }

        case 'get_workout_adherence': {
          const weeks = (a.weeks as number) ?? 4;
          const since = new Date(Date.now() - weeks * 7 * 86400000).toISOString().slice(0, 10);
          const [{ data: sessRows }, { data: planRows }] = await Promise.all([
            supabase.from('workout_sessions')
              .select('id,date,template_id,completed_status,total_volume_kg')
              .eq('user_id', userId).eq('completed_status', 'completed').gte('date', since)
              .order('date', { ascending: false }),
            supabase.from('workout_templates').select('id,day_name,day_order').eq('user_id', userId).eq('is_active', true),
          ]);
          const sessions = (sessRows ?? []) as any[];
          const plannedDays = (planRows ?? []).length;

          // sessions per ISO week
          const weekBuckets = new Map<string, number>();
          for (const s of sessions) {
            const d = new Date(s.date + 'T00:00:00Z');
            const day = (d.getUTCDay() + 6) % 7;
            const monday = new Date(d); monday.setUTCDate(d.getUTCDate() - day);
            const key = monday.toISOString().slice(0, 10);
            weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1);
          }
          const weekly = Array.from(weekBuckets.entries())
            .map(([week_starting, done]) => ({ week_starting, sessions_done: done, planned_days: plannedDays || null }))
            .sort((x, y) => (x.week_starting < y.week_starting ? -1 : 1));

          // ready-to-progress: most recent completed session per exercise hit top of range on all sets
          const { data: planEx } = await supabase
            .from('workout_template_exercises')
            .select('target_reps_max,exercise:exercises(id,slug,name_en)')
            .in('template_id', (planRows ?? []).map((p: any) => p.id).length ? (planRows ?? []).map((p: any) => p.id) : ['00000000-0000-0000-0000-000000000000']);
          const readyChecks: any[] = [];
          for (const pe of (planEx ?? []) as any[]) {
            const top = pe.target_reps_max;
            if (!top || !pe.exercise?.id) continue;
            const { data: lastSet } = await supabase
              .from('workout_set_log')
              .select('session_id,reps,weight_kg,completed_at')
              .eq('user_id', userId).eq('exercise_id', pe.exercise.id)
              .order('completed_at', { ascending: false }).limit(1).maybeSingle();
            if (!lastSet) continue;
            const sid = (lastSet as any).session_id;
            const { data: setsInSession } = await supabase
              .from('workout_set_log').select('reps,weight_kg').eq('session_id', sid).eq('exercise_id', pe.exercise.id);
            const ss = (setsInSession ?? []) as any[];
            const hitTop = ss.length > 0 && ss.every((s) => s.reps >= top);
            readyChecks.push({
              exercise_slug: pe.exercise.slug, name: pe.exercise.name_en,
              last_top_set_reps: Math.max(...ss.map((s) => s.reps), 0),
              target_reps_max: top, current_weight_kg: Number((lastSet as any).weight_kg),
              ready_to_progress: hitTop, suggested_next_weight_kg: hitTop ? round1(Number((lastSet as any).weight_kg) + 2.5) : null,
            });
          }
          return { content: [{ type: 'text', text: JSON.stringify({ period_weeks: weeks, planned_days_per_cycle: plannedDays || null, total_completed: sessions.length, weekly, ready_to_progress: readyChecks }, null, 2) }] };
        }

        case 'get_calorie_history': {
          const days = Number(a.days ?? 30);
          const since = new Date();
          since.setDate(since.getDate() - days + 1);
          const sinceDate = since.toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('daily_calorie_status')
            .select('*')
            .eq('user_id', userId)
            .gte('date', sinceDate)
            .order('date', { ascending: false });
          if (error) throw new McpError(ErrorCode.InternalError, error.message);
          const rows = (data ?? []) as any[];
          const counts = { deficit: 0, maintenance: 0, surplus: 0 } as Record<string, number>;
          let totalDelta = 0;
          for (const r of rows) { counts[r.status] = (counts[r.status] ?? 0) + 1; totalDelta += r.delta_from_tdee; }
          return {
            content: [{
              type: 'text', text: JSON.stringify({
                days_with_data: rows.length,
                summary: counts,
                avg_daily_delta_from_tdee: rows.length ? Math.round(totalDelta / rows.length) : null,
                history: rows,
              }, null, 2),
            }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (err: unknown) {
      if (err instanceof McpError) throw err;
      throw new McpError(ErrorCode.InternalError, err instanceof Error ? err.message : String(err));
    }
  });

  return server;
}
