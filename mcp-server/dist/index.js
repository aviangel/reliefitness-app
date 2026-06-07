import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode, } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.HEALTH_USER_ID;
if (!SUPABASE_URL || !SERVICE_KEY || !USER_ID) {
    console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID');
    process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
});
function today() {
    return new Date().toISOString().split('T')[0];
}
function round1(n) {
    return Math.round(n * 10) / 10;
}
// ── MCP Server ────────────────────────────────────────────────────────────────
const server = new Server({ name: 'reliefitness', version: '1.0.0' }, { capabilities: { tools: {} } });
// ── Tool definitions ──────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_today',
            description: "Get today's complete health summary: calories eaten vs goal, macros, water intake, weight, and workouts. Use this first when asked about today's status.",
            inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
            name: 'get_meals',
            description: 'Get the meal log for a specific date (defaults to today). Returns each meal with food name, portion, and macros.',
            inputSchema: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format. Omit for today.' },
                },
                required: [],
            },
        },
        {
            name: 'get_weight_history',
            description: 'Get the weight log history, most recent first.',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Number of entries to return (default 14).' },
                },
                required: [],
            },
        },
        {
            name: 'get_drinks',
            description: 'Get drink log for a specific date (defaults to today).',
            inputSchema: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format. Omit for today.' },
                },
                required: [],
            },
        },
        {
            name: 'get_workouts',
            description: 'Get recent workout sessions.',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Number of entries to return (default 10).' },
                },
                required: [],
            },
        },
        {
            name: 'get_profile',
            description: 'Get user profile: name, weight, target weight, height, calorie and macro goals.',
            inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
            name: 'get_slips',
            description: 'Get recent dietary slip log entries.',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Number of entries (default 10).' },
                },
                required: [],
            },
        },
        {
            name: 'list_foods',
            description: 'Search the food database. Use before log_meal to find the exact food name.',
            inputSchema: {
                type: 'object',
                properties: {
                    search: { type: 'string', description: 'Search term (English or Hebrew). Omit to list all.' },
                },
                required: [],
            },
        },
        {
            name: 'log_meal',
            description: 'Log a meal. First call list_foods to find the exact food name, then call this. The food name must match exactly.',
            inputSchema: {
                type: 'object',
                properties: {
                    food_name: { type: 'string', description: 'Exact food name from list_foods.' },
                    meal_type: {
                        type: 'string',
                        enum: ['breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack'],
                        description: 'Which meal slot.',
                    },
                    portion_multiplier: {
                        type: 'number',
                        description: 'Portion size relative to default (0.5 = half, 1.0 = default, 1.5 = 1.5x). Default: 1.0',
                    },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit for today.' },
                },
                required: ['food_name', 'meal_type'],
            },
        },
        {
            name: 'delete_meal',
            description: 'Delete a meal log entry by its ID. Get IDs from get_meals.',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'The meal log entry UUID.' },
                },
                required: ['id'],
            },
        },
        {
            name: 'log_weight',
            description: 'Log body weight. Only one entry per day (will overwrite if already logged today).',
            inputSchema: {
                type: 'object',
                properties: {
                    weight_kg: { type: 'number', description: 'Body weight in kg (e.g. 101.5).' },
                    notes: { type: 'string', description: 'Optional note (e.g. "after gym").' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit for today.' },
                },
                required: ['weight_kg'],
            },
        },
        {
            name: 'log_drink',
            description: 'Log a drink. Water counts toward the 2.5L daily water goal.',
            inputSchema: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['water', 'zero', 'diet_coke'],
                        description: '"water" for any water, "zero" for sugar-free drinks, "diet_coke" for Diet Coke.',
                    },
                    amount_ml: { type: 'number', description: 'Amount in milliliters (e.g. 250, 500).' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit for today.' },
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
                    type: {
                        type: 'string',
                        enum: ['gym', 'walk', 'run', 'swim', 'cycling', 'other'],
                        description: 'Type of workout.',
                    },
                    duration_minutes: { type: 'number', description: 'Duration in minutes.' },
                    notes: { type: 'string', description: 'Optional notes (e.g. "chest & back", "5km at 9:30 pace").' },
                    calories_burned: { type: 'number', description: 'Estimated calories burned (optional).' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit for today.' },
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
                    what: { type: 'string', description: 'What happened (e.g. "Ate 3 Klik bars after dinner").' },
                    why: { type: 'string', description: 'Why it happened (optional).' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit for today.' },
                },
                required: ['what'],
            },
        },
        {
            name: 'update_goals',
            description: 'Update daily nutrition goals.',
            inputSchema: {
                type: 'object',
                properties: {
                    calorie_goal: { type: 'number', description: 'Daily calorie target.' },
                    protein_goal_g: { type: 'number', description: 'Daily protein goal in grams.' },
                    carbs_goal_g: { type: 'number', description: 'Daily carbs goal in grams.' },
                    fat_goal_g: { type: 'number', description: 'Daily fat goal in grams.' },
                },
                required: [],
            },
        },
        {
            name: 'get_weekly_stats',
            description: 'Get stats for the past N days: average calories, days under goal, weight trend, workout frequency.',
            inputSchema: {
                type: 'object',
                properties: {
                    days: { type: 'number', description: 'Number of days to look back (default 7).' },
                },
                required: [],
            },
        },
    ],
}));
// ── Tool handlers ─────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {});
    try {
        switch (name) {
            // ── get_today ───────────────────────────────────────────────────────────
            case 'get_today': {
                const d = today();
                const [profileRes, mealsRes, weightRes, drinksRes, workoutsRes] = await Promise.all([
                    supabase.from('user_profile').select('*').eq('user_id', USER_ID).single(),
                    supabase.from('meals_log').select('*').eq('user_id', USER_ID).eq('date', d).order('logged_at'),
                    supabase.from('weight_log').select('weight_kg,date').eq('user_id', USER_ID).order('date', { ascending: false }).limit(2),
                    supabase.from('drinks_log').select('type,amount_ml').eq('user_id', USER_ID).eq('date', d),
                    supabase.from('workout_log').select('type,duration_minutes,notes').eq('user_id', USER_ID).eq('date', d),
                ]);
                const profile = profileRes.data;
                const meals = mealsRes.data ?? [];
                const weights = weightRes.data ?? [];
                const drinks = drinksRes.data ?? [];
                const workouts = workoutsRes.data ?? [];
                const totalCal = Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0));
                const totalProtein = round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0));
                const totalCarbs = round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0));
                const totalFat = round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0));
                const totalWater = drinks.filter((x) => x.type === 'water').reduce((s, x) => s + x.amount_ml, 0);
                const totalDrinks = drinks.reduce((s, x) => s + x.amount_ml, 0);
                const currentWeight = weights[0]?.weight_kg ?? profile?.current_weight_kg;
                const todayWeightLogged = weights[0]?.date === d;
                const result = {
                    date: d,
                    calories: { eaten: totalCal, goal: profile?.calorie_goal ?? 2000, remaining: (profile?.calorie_goal ?? 2000) - totalCal },
                    macros: {
                        protein: { eaten: totalProtein, goal: profile?.protein_goal_g ?? 150 },
                        carbs: { eaten: totalCarbs, goal: profile?.carbs_goal_g ?? 200 },
                        fat: { eaten: totalFat, goal: profile?.fat_goal_g ?? 65 },
                    },
                    meals_logged: meals.length,
                    water_ml: totalWater,
                    water_goal_ml: 2500,
                    water_remaining_ml: Math.max(0, 2500 - totalWater),
                    total_drinks_ml: totalDrinks,
                    weight: { current_kg: currentWeight ? Number(currentWeight) : null, logged_today: todayWeightLogged },
                    workouts: workouts.map((w) => ({ type: w.type, duration_minutes: w.duration_minutes, notes: w.notes })),
                    total_workout_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
                };
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            // ── get_meals ───────────────────────────────────────────────────────────
            case 'get_meals': {
                const d = a.date ?? today();
                const { data, error } = await supabase
                    .from('meals_log')
                    .select('id,meal_type,food_name,portion_g,calories,protein_g,carbs_g,fat_g,status,logged_at')
                    .eq('user_id', USER_ID)
                    .eq('date', d)
                    .order('logged_at');
                if (error)
                    throw error;
                const meals = data ?? [];
                const totals = {
                    calories: Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0)),
                    protein_g: round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)),
                    carbs_g: round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)),
                    fat_g: round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)),
                };
                return { content: [{ type: 'text', text: JSON.stringify({ date: d, totals, meals }, null, 2) }] };
            }
            // ── get_weight_history ──────────────────────────────────────────────────
            case 'get_weight_history': {
                const limit = a.limit ?? 14;
                const { data, error } = await supabase
                    .from('weight_log')
                    .select('id,date,weight_kg,notes')
                    .eq('user_id', USER_ID)
                    .order('date', { ascending: false })
                    .limit(limit);
                if (error)
                    throw error;
                const entries = (data ?? []).map((e) => ({ ...e, weight_kg: Number(e.weight_kg) }));
                const weights = entries.map((e) => e.weight_kg);
                const stats = weights.length > 1 ? {
                    current: weights[0],
                    oldest_in_range: weights[weights.length - 1],
                    change: round1(weights[0] - weights[weights.length - 1]),
                    min: Math.min(...weights),
                    max: Math.max(...weights),
                } : null;
                return { content: [{ type: 'text', text: JSON.stringify({ entries, stats }, null, 2) }] };
            }
            // ── get_drinks ──────────────────────────────────────────────────────────
            case 'get_drinks': {
                const d = a.date ?? today();
                const { data, error } = await supabase
                    .from('drinks_log')
                    .select('id,type,amount_ml,logged_at')
                    .eq('user_id', USER_ID)
                    .eq('date', d)
                    .order('logged_at');
                if (error)
                    throw error;
                const drinks = data ?? [];
                const byType = {};
                for (const dr of drinks) {
                    byType[dr.type] = (byType[dr.type] ?? 0) + dr.amount_ml;
                }
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                date: d,
                                entries: drinks,
                                totals: { ...byType, all: Object.values(byType).reduce((s, v) => s + v, 0) },
                                water_goal_ml: 2500,
                                water_remaining_ml: Math.max(0, 2500 - (byType.water ?? 0)),
                            }, null, 2),
                        }],
                };
            }
            // ── get_workouts ────────────────────────────────────────────────────────
            case 'get_workouts': {
                const limit = a.limit ?? 10;
                const { data, error } = await supabase
                    .from('workout_log')
                    .select('id,date,type,duration_minutes,calories_burned,notes,logged_at')
                    .eq('user_id', USER_ID)
                    .order('logged_at', { ascending: false })
                    .limit(limit);
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
            }
            // ── get_profile ─────────────────────────────────────────────────────────
            case 'get_profile': {
                const { data, error } = await supabase
                    .from('user_profile')
                    .select('*')
                    .eq('user_id', USER_ID)
                    .single();
                if (error)
                    throw error;
                const p = data;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                name: p.name,
                                height_cm: p.height_cm,
                                current_weight_kg: Number(p.current_weight_kg),
                                target_weight_kg: Number(p.target_weight_kg),
                                to_lose_kg: round1(Number(p.current_weight_kg) - Number(p.target_weight_kg)),
                                birth_year: p.birth_year,
                                hernia_flag: p.hernia_flag,
                                goals: {
                                    calorie_goal: p.calorie_goal,
                                    protein_goal_g: p.protein_goal_g,
                                    carbs_goal_g: p.carbs_goal_g,
                                    fat_goal_g: p.fat_goal_g,
                                },
                            }, null, 2),
                        }],
                };
            }
            // ── get_slips ───────────────────────────────────────────────────────────
            case 'get_slips': {
                const limit = a.limit ?? 10;
                const { data, error } = await supabase
                    .from('slip_log')
                    .select('id,date,what,why,created_at')
                    .eq('user_id', USER_ID)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
            }
            // ── list_foods ──────────────────────────────────────────────────────────
            case 'list_foods': {
                const search = a.search;
                let query = supabase
                    .from('foods')
                    .select('name,name_he,category,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,default_portion_g')
                    .eq('is_active', true)
                    .order('category')
                    .order('name');
                if (search) {
                    query = query.or(`name.ilike.%${search}%,name_he.ilike.%${search}%`);
                }
                const { data, error } = await query.limit(50);
                if (error)
                    throw error;
                const foods = (data ?? []).map((f) => ({
                    name: f.name,
                    name_he: f.name_he,
                    category: f.category,
                    default_portion_g: f.default_portion_g,
                    per_default_portion: {
                        calories: Math.round(f.calories_per_100g * f.default_portion_g / 100),
                        protein_g: round1(f.protein_per_100g * f.default_portion_g / 100),
                        carbs_g: round1(f.carbs_per_100g * f.default_portion_g / 100),
                        fat_g: round1(f.fat_per_100g * f.default_portion_g / 100),
                    },
                }));
                return { content: [{ type: 'text', text: JSON.stringify(foods, null, 2) }] };
            }
            // ── log_meal ────────────────────────────────────────────────────────────
            case 'log_meal': {
                const foodName = a.food_name;
                const mealType = a.meal_type;
                const mult = a.portion_multiplier ?? 1.0;
                const d = a.date ?? today();
                const { data: foods, error: foodErr } = await supabase
                    .from('foods')
                    .select('*')
                    .ilike('name', foodName)
                    .eq('is_active', true)
                    .limit(1);
                if (foodErr)
                    throw foodErr;
                if (!foods || foods.length === 0) {
                    return {
                        content: [{ type: 'text', text: `Food not found: "${foodName}". Use list_foods to find the exact name.` }],
                        isError: true,
                    };
                }
                const food = foods[0];
                const portionG = Math.round(food.default_portion_g * mult);
                const factor = portionG / 100;
                const { data: inserted, error } = await supabase.from('meals_log').insert({
                    user_id: USER_ID,
                    date: d,
                    meal_type: mealType,
                    food_name: food.name,
                    portion_g: portionG,
                    calories: Math.round(food.calories_per_100g * factor),
                    protein_g: round1(food.protein_per_100g * factor),
                    carbs_g: round1(food.carbs_per_100g * factor),
                    fat_g: round1(food.fat_per_100g * factor),
                    status: 'eaten',
                }).select('id').single();
                if (error)
                    throw error;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                logged: true,
                                id: inserted?.id,
                                food: food.name,
                                meal_type: mealType,
                                date: d,
                                portion_g: portionG,
                                calories: Math.round(food.calories_per_100g * factor),
                                protein_g: round1(food.protein_per_100g * factor),
                                carbs_g: round1(food.carbs_per_100g * factor),
                                fat_g: round1(food.fat_per_100g * factor),
                            }, null, 2),
                        }],
                };
            }
            // ── delete_meal ─────────────────────────────────────────────────────────
            case 'delete_meal': {
                const { error } = await supabase
                    .from('meals_log')
                    .delete()
                    .eq('id', a.id)
                    .eq('user_id', USER_ID);
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: `Deleted meal log entry ${a.id}` }] };
            }
            // ── log_weight ──────────────────────────────────────────────────────────
            case 'log_weight': {
                const weight = a.weight_kg;
                const d = a.date ?? today();
                if (weight < 30 || weight > 300) {
                    return { content: [{ type: 'text', text: 'Invalid weight. Must be between 30 and 300 kg.' }], isError: true };
                }
                const { error } = await supabase.from('weight_log').upsert({ user_id: USER_ID, date: d, weight_kg: weight, notes: a.notes ?? null }, { onConflict: 'user_id,date' });
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: `Logged weight: ${weight} kg on ${d}` }] };
            }
            // ── log_drink ───────────────────────────────────────────────────────────
            case 'log_drink': {
                const type = a.type;
                const amount = a.amount_ml;
                const d = a.date ?? today();
                const { error } = await supabase.from('drinks_log').insert({
                    user_id: USER_ID,
                    date: d,
                    type,
                    amount_ml: amount,
                });
                if (error)
                    throw error;
                const { data: todayDrinks } = await supabase
                    .from('drinks_log')
                    .select('type,amount_ml')
                    .eq('user_id', USER_ID)
                    .eq('date', d);
                const totalWater = (todayDrinks ?? []).filter((x) => x.type === 'water').reduce((s, x) => s + x.amount_ml, 0);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                logged: true,
                                type,
                                amount_ml: amount,
                                date: d,
                                total_water_today_ml: totalWater,
                                water_goal_ml: 2500,
                                water_remaining_ml: Math.max(0, 2500 - totalWater),
                            }, null, 2),
                        }],
                };
            }
            // ── log_workout ─────────────────────────────────────────────────────────
            case 'log_workout': {
                const d = a.date ?? today();
                const { data: inserted, error } = await supabase.from('workout_log').insert({
                    user_id: USER_ID,
                    date: d,
                    type: a.type,
                    duration_minutes: a.duration_minutes,
                    calories_burned: a.calories_burned ?? null,
                    notes: a.notes ?? null,
                }).select('id').single();
                if (error)
                    throw error;
                return {
                    content: [{
                            type: 'text',
                            text: `Logged workout: ${a.type} for ${a.duration_minutes} min on ${d}${a.notes ? ` (${a.notes})` : ''}`,
                        }],
                };
            }
            // ── log_slip ────────────────────────────────────────────────────────────
            case 'log_slip': {
                const d = a.date ?? today();
                const { error } = await supabase.from('slip_log').insert({
                    user_id: USER_ID,
                    date: d,
                    what: a.what,
                    why: a.why ?? null,
                });
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: `Slip logged on ${d}: "${a.what}"${a.why ? ` — ${a.why}` : ''}` }] };
            }
            // ── update_goals ────────────────────────────────────────────────────────
            case 'update_goals': {
                const updates = { user_id: USER_ID, updated_at: new Date().toISOString() };
                if (a.calorie_goal != null)
                    updates.calorie_goal = a.calorie_goal;
                if (a.protein_goal_g != null)
                    updates.protein_goal_g = a.protein_goal_g;
                if (a.carbs_goal_g != null)
                    updates.carbs_goal_g = a.carbs_goal_g;
                if (a.fat_goal_g != null)
                    updates.fat_goal_g = a.fat_goal_g;
                const { error } = await supabase
                    .from('user_profile')
                    .update(updates)
                    .eq('user_id', USER_ID);
                if (error)
                    throw error;
                return { content: [{ type: 'text', text: `Goals updated: ${JSON.stringify(updates)}` }] };
            }
            // ── get_weekly_stats ────────────────────────────────────────────────────
            case 'get_weekly_stats': {
                const days = a.days ?? 7;
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - days + 1);
                const from = fromDate.toISOString().split('T')[0];
                const to = today();
                const [mealsRes, weightRes, workoutsRes, profileRes] = await Promise.all([
                    supabase.from('meals_log').select('date,calories,protein_g').eq('user_id', USER_ID).gte('date', from).lte('date', to),
                    supabase.from('weight_log').select('date,weight_kg').eq('user_id', USER_ID).gte('date', from).lte('date', to).order('date'),
                    supabase.from('workout_log').select('date,type,duration_minutes').eq('user_id', USER_ID).gte('date', from).lte('date', to),
                    supabase.from('user_profile').select('calorie_goal,protein_goal_g').eq('user_id', USER_ID).single(),
                ]);
                const meals = mealsRes.data ?? [];
                const weights = weightRes.data ?? [];
                const workouts = workoutsRes.data ?? [];
                const profile = profileRes.data;
                const dayTotals = {};
                for (const m of meals) {
                    if (!dayTotals[m.date])
                        dayTotals[m.date] = { cal: 0, protein: 0 };
                    dayTotals[m.date].cal += m.calories ?? 0;
                    dayTotals[m.date].protein += m.protein_g ?? 0;
                }
                const loggedDays = Object.keys(dayTotals).length;
                const avgCal = loggedDays > 0
                    ? Math.round(Object.values(dayTotals).reduce((s, v) => s + v.cal, 0) / loggedDays)
                    : 0;
                const avgProtein = loggedDays > 0
                    ? round1(Object.values(dayTotals).reduce((s, v) => s + v.protein, 0) / loggedDays)
                    : 0;
                const daysUnderGoal = Object.values(dayTotals).filter((d) => d.cal <= (profile?.calorie_goal ?? 2000)).length;
                const weightValues = weights.map((w) => Number(w.weight_kg));
                const weightChange = weightValues.length > 1 ? round1(weightValues[weightValues.length - 1] - weightValues[0]) : null;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                period: { from, to, days },
                                calories: { average: avgCal, goal: profile?.calorie_goal ?? 2000, days_logged: loggedDays, days_under_goal: daysUnderGoal },
                                protein: { average_g: avgProtein, goal_g: profile?.protein_goal_g ?? 150 },
                                weight: {
                                    entries: weights.map((w) => ({ date: w.date, weight_kg: Number(w.weight_kg) })),
                                    change_kg: weightChange,
                                },
                                workouts: {
                                    total_sessions: workouts.length,
                                    total_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
                                    types: [...new Set(workouts.map((w) => w.type))],
                                },
                            }, null, 2),
                        }],
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (err) {
        if (err instanceof McpError)
            throw err;
        const msg = err instanceof Error ? err.message : String(err);
        throw new McpError(ErrorCode.InternalError, msg);
    }
});
// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('RelieFitness MCP server running');
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
