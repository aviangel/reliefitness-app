import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode, } from '@modelcontextprotocol/sdk/types.js';
function today() {
    return new Date().toISOString().split('T')[0];
}
function round1(n) {
    return Math.round(n * 10) / 10;
}
export function createMcpServer(supabase, userId) {
    const server = new Server({ name: 'reliefitness', version: '1.0.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'get_today',
                description: "Get today's full health summary: calories eaten vs goal, macros, water, weight, and workouts. Call this first when asked about today.",
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
                description: 'Update daily nutrition goals.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        calorie_goal: { type: 'number' },
                        protein_goal_g: { type: 'number' },
                        carbs_goal_g: { type: 'number' },
                        fat_goal_g: { type: 'number' },
                    },
                    required: [],
                },
            },
        ],
    }));
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: args } = req.params;
        const a = (args ?? {});
        try {
            switch (name) {
                case 'get_today': {
                    const d = today();
                    const [profileRes, mealsRes, weightRes, drinksRes, workoutsRes] = await Promise.all([
                        supabase.from('user_profile').select('*').eq('user_id', userId).single(),
                        supabase.from('meals_log').select('*').eq('user_id', userId).eq('date', d).order('logged_at'),
                        supabase.from('weight_log').select('weight_kg,date').eq('user_id', userId).order('date', { ascending: false }).limit(2),
                        supabase.from('drinks_log').select('type,amount_ml').eq('user_id', userId).eq('date', d),
                        supabase.from('workout_log').select('type,duration_minutes,notes').eq('user_id', userId).eq('date', d),
                    ]);
                    const p = profileRes.data;
                    const meals = (mealsRes.data ?? []);
                    const weights = (weightRes.data ?? []);
                    const drinks = (drinksRes.data ?? []);
                    const workouts = (workoutsRes.data ?? []);
                    const totalCal = Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0));
                    const totalWater = drinks.filter((x) => x.type === 'water').reduce((s, x) => s + x.amount_ml, 0);
                    return {
                        content: [{
                                type: 'text', text: JSON.stringify({
                                    date: d,
                                    calories: { eaten: totalCal, goal: p?.calorie_goal ?? 2000, remaining: (p?.calorie_goal ?? 2000) - totalCal },
                                    macros: {
                                        protein: { eaten: round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)), goal: p?.protein_goal_g ?? 150 },
                                        carbs: { eaten: round1(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)), goal: p?.carbs_goal_g ?? 200 },
                                        fat: { eaten: round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)), goal: p?.fat_goal_g ?? 65 },
                                    },
                                    meals_logged: meals.length,
                                    water_ml: totalWater, water_goal_ml: 2500, water_remaining_ml: Math.max(0, 2500 - totalWater),
                                    weight: { current_kg: weights[0] ? Number(weights[0].weight_kg) : null, logged_today: weights[0]?.date === d },
                                    workouts: workouts.map((w) => ({ type: w.type, duration_minutes: w.duration_minutes, notes: w.notes })),
                                    total_workout_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
                                }, null, 2),
                            }],
                    };
                }
                case 'get_meals': {
                    const d = a.date ?? today();
                    const { data } = await supabase.from('meals_log').select('id,meal_type,food_name,portion_g,calories,protein_g,carbs_g,fat_g,logged_at').eq('user_id', userId).eq('date', d).order('logged_at');
                    const meals = (data ?? []);
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
                    const { data } = await supabase.from('weight_log').select('id,date,weight_kg,notes').eq('user_id', userId).order('date', { ascending: false }).limit(a.limit ?? 14);
                    const entries = (data ?? []).map((e) => ({ ...e, weight_kg: Number(e.weight_kg) }));
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
                    const d = a.date ?? today();
                    const { data } = await supabase.from('drinks_log').select('id,type,amount_ml,logged_at').eq('user_id', userId).eq('date', d).order('logged_at');
                    const drinks = (data ?? []);
                    const byType = {};
                    for (const dr of drinks)
                        byType[dr.type] = (byType[dr.type] ?? 0) + dr.amount_ml;
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
                    const { data } = await supabase.from('workout_log').select('id,date,type,duration_minutes,calories_burned,notes,logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(a.limit ?? 10);
                    return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
                }
                case 'get_profile': {
                    const { data } = await supabase.from('user_profile').select('*').eq('user_id', userId).single();
                    const p = data;
                    return {
                        content: [{
                                type: 'text', text: JSON.stringify({
                                    name: p.name, height_cm: p.height_cm,
                                    current_weight_kg: Number(p.current_weight_kg), target_weight_kg: Number(p.target_weight_kg),
                                    to_lose_kg: round1(Number(p.current_weight_kg) - Number(p.target_weight_kg)),
                                    goals: { calorie_goal: p.calorie_goal, protein_goal_g: p.protein_goal_g, carbs_goal_g: p.carbs_goal_g, fat_goal_g: p.fat_goal_g },
                                }, null, 2),
                            }],
                    };
                }
                case 'get_slips': {
                    const { data } = await supabase.from('slip_log').select('id,date,what,why,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(a.limit ?? 10);
                    return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] };
                }
                case 'get_weekly_stats': {
                    const days = a.days ?? 7;
                    const from = new Date();
                    from.setDate(from.getDate() - days + 1);
                    const fromStr = from.toISOString().split('T')[0];
                    const to = today();
                    const [mealsRes, weightRes, workoutsRes, profileRes] = await Promise.all([
                        supabase.from('meals_log').select('date,calories,protein_g').eq('user_id', userId).gte('date', fromStr).lte('date', to),
                        supabase.from('weight_log').select('date,weight_kg').eq('user_id', userId).gte('date', fromStr).lte('date', to).order('date'),
                        supabase.from('workout_log').select('date,type,duration_minutes').eq('user_id', userId).gte('date', fromStr).lte('date', to),
                        supabase.from('user_profile').select('calorie_goal,protein_goal_g').eq('user_id', userId).single(),
                    ]);
                    const meals = (mealsRes.data ?? []);
                    const weights = (weightRes.data ?? []);
                    const workouts = (workoutsRes.data ?? []);
                    const p = profileRes.data;
                    const dayTotals = {};
                    for (const m of meals)
                        dayTotals[m.date] = (dayTotals[m.date] ?? 0) + (m.calories ?? 0);
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
                                    weight: { entries: weights.map((w) => ({ date: w.date, weight_kg: Number(w.weight_kg) })), change_kg: ws.length > 1 ? round1(ws[ws.length - 1] - ws[0]) : null },
                                    workouts: { sessions: workouts.length, total_minutes: workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0), types: [...new Set(workouts.map((w) => w.type))] },
                                }, null, 2),
                            }],
                    };
                }
                case 'list_foods': {
                    let query = supabase.from('foods').select('name,name_he,category,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,default_portion_g').eq('is_active', true).order('category').order('name');
                    if (a.search)
                        query = query.or(`name.ilike.%${a.search}%,name_he.ilike.%${a.search}%`);
                    const { data } = await query.limit(60);
                    const foods = (data ?? []).map((f) => ({
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
                    const { data: foods } = await supabase.from('foods').select('*').ilike('name', a.food_name).eq('is_active', true).limit(1);
                    if (!foods?.length)
                        return { content: [{ type: 'text', text: `Food not found: "${a.food_name}". Use list_foods to find the exact name.` }], isError: true };
                    const food = foods[0];
                    const mult = a.portion_multiplier ?? 1.0;
                    const portionG = Math.round(food.default_portion_g * mult);
                    const f = portionG / 100;
                    const { data: inserted, error } = await supabase.from('meals_log').insert({
                        user_id: userId, date: a.date ?? today(), meal_type: a.meal_type,
                        food_name: food.name, portion_g: portionG,
                        calories: Math.round(food.calories_per_100g * f),
                        protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f), fat_g: round1(food.fat_per_100g * f),
                        status: 'eaten',
                    }).select('id').single();
                    if (error)
                        throw error;
                    return {
                        content: [{
                                type: 'text', text: JSON.stringify({
                                    logged: true, id: inserted?.id, food: food.name, meal_type: a.meal_type,
                                    portion_g: portionG, calories: Math.round(food.calories_per_100g * f),
                                    protein_g: round1(food.protein_per_100g * f), carbs_g: round1(food.carbs_per_100g * f), fat_g: round1(food.fat_per_100g * f),
                                }, null, 2),
                            }],
                    };
                }
                case 'delete_meal': {
                    const { error } = await supabase.from('meals_log').delete().eq('id', a.id).eq('user_id', userId);
                    if (error)
                        throw error;
                    return { content: [{ type: 'text', text: `Deleted meal log entry ${a.id}` }] };
                }
                case 'log_weight': {
                    const weight = a.weight_kg;
                    if (weight < 30 || weight > 300)
                        return { content: [{ type: 'text', text: 'Invalid weight (must be 30–300 kg).' }], isError: true };
                    const { error } = await supabase.from('weight_log').upsert({ user_id: userId, date: a.date ?? today(), weight_kg: weight, notes: a.notes ?? null }, { onConflict: 'user_id,date' });
                    if (error)
                        throw error;
                    return { content: [{ type: 'text', text: `Logged ${weight} kg` }] };
                }
                case 'log_drink': {
                    const d = a.date ?? today();
                    const { error } = await supabase.from('drinks_log').insert({ user_id: userId, date: d, type: a.type, amount_ml: a.amount_ml });
                    if (error)
                        throw error;
                    const { data: todayDrinks } = await supabase.from('drinks_log').select('type,amount_ml').eq('user_id', userId).eq('date', d);
                    const totalWater = (todayDrinks ?? []).filter((x) => x.type === 'water').reduce((s, x) => s + x.amount_ml, 0);
                    return {
                        content: [{
                                type: 'text', text: JSON.stringify({ logged: true, type: a.type, amount_ml: a.amount_ml, total_water_today_ml: totalWater, water_remaining_ml: Math.max(0, 2500 - totalWater) }, null, 2),
                            }],
                    };
                }
                case 'log_workout': {
                    const { error } = await supabase.from('workout_log').insert({
                        user_id: userId, date: a.date ?? today(),
                        type: a.type, duration_minutes: a.duration_minutes,
                        calories_burned: a.calories_burned ?? null, notes: a.notes ?? null,
                    });
                    if (error)
                        throw error;
                    return { content: [{ type: 'text', text: `Logged ${a.type} workout: ${a.duration_minutes} min${a.notes ? ` — ${a.notes}` : ''}` }] };
                }
                case 'log_slip': {
                    const { error } = await supabase.from('slip_log').insert({ user_id: userId, date: a.date ?? today(), what: a.what, why: a.why ?? null });
                    if (error)
                        throw error;
                    return { content: [{ type: 'text', text: `Slip logged: "${a.what}"` }] };
                }
                case 'update_goals': {
                    const updates = { updated_at: new Date().toISOString() };
                    if (a.calorie_goal != null)
                        updates.calorie_goal = a.calorie_goal;
                    if (a.protein_goal_g != null)
                        updates.protein_goal_g = a.protein_goal_g;
                    if (a.carbs_goal_g != null)
                        updates.carbs_goal_g = a.carbs_goal_g;
                    if (a.fat_goal_g != null)
                        updates.fat_goal_g = a.fat_goal_g;
                    const { error } = await supabase.from('user_profile').update(updates).eq('user_id', userId);
                    if (error)
                        throw error;
                    return { content: [{ type: 'text', text: `Goals updated: ${JSON.stringify(updates)}` }] };
                }
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        }
        catch (err) {
            if (err instanceof McpError)
                throw err;
            throw new McpError(ErrorCode.InternalError, err instanceof Error ? err.message : String(err));
        }
    });
    return server;
}
