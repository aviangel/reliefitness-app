export type Lang = 'en' | 'he';

// Flat key dictionary. Use {var} placeholders for interpolation.
export const translations = {
  en: {
    // ── Common / units ──
    'unit.kcal': 'kcal',
    'unit.kg': 'kg',
    'unit.g': 'g',
    'unit.ml': 'ml',
    'unit.l': 'L',
    'unit.min': 'min',
    'unit.minutes': 'minutes',
    'unit.sessions': 'sessions',
    'common.today': 'Today',
    'common.optional': 'optional',
    'common.saving': 'Saving...',
    'common.logging': 'Logging...',
    'common.failed': 'Something went wrong.',

    // ── Nav ──
    'nav.home': 'Home',
    'nav.meals': 'Meals',
    'nav.workout': 'Workout',
    'nav.drinks': 'Drinks',
    'nav.weight': 'Weight',

    // ── Meal types ──
    'meal.breakfast': 'Breakfast',
    'meal.commute_am': 'Morning Commute',
    'meal.lunch': 'Lunch',
    'meal.commute_pm': 'Evening Commute',
    'meal.dinner': 'Dinner',
    'meal.snack': 'Snack / Extra',
    'mealtime.anytime': 'Anytime',

    // ── Food categories ──
    'cat.home': 'Home',
    'cat.junk': 'Junk',
    'cat.sweets': 'Sweets',
    'cat.drinks': 'Drinks',

    // ── Workout types ──
    'workout.gym': 'Gym',
    'workout.walk': 'Walk',
    'workout.run': 'Run',
    'workout.swim': 'Swim',
    'workout.cycling': 'Cycling',
    'workout.other': 'Other',

    // ── Drink types ──
    'drink.water': 'Water',
    'drink.zero': 'Zero',
    'drink.diet_coke': 'Diet Coke',

    // ── Login ──
    'login.title': 'Health Tracker',
    'login.subtitle': 'Your personal fitness companion',
    'login.email': 'Email',
    'login.emailPlaceholder': 'you@example.com',
    'login.password': 'Password',
    'login.error': 'Incorrect email or password.',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',

    // ── Dashboard ──
    'dash.greeting': 'Hey, {name} 👋',
    'dash.weightGoal': 'Weight Goal',
    'dash.toGo': '{n} kg to go',
    'dash.water': 'Water',
    'dash.waterGoal': 'Goal: {n}L',
    'dash.workoutDone': 'Workout done today! 🔥',
    'dash.workoutSummary': '{type} · {min} min total',
    'dash.noWorkout': 'No workout logged today',
    'dash.todaysMeals': "Today's Meals",
    'dash.addMeal': 'Add meal',
    'dash.updateWeight': 'Update Weight',
    'dash.logWeight': 'Log Weight',
    'dash.dailyCheckin': 'Daily check-in',
    'dash.logMeal': 'Log Meal',
    'dash.quickAdd': 'Quick add',

    // ── Meals ──
    'meals.title': "Today's Meals",
    'meals.proteinTotal': '{n}g protein',
    'meals.empty': 'Nothing logged yet today',
    'meals.emptyHint': 'Tap + to log your first meal',
    'meals.unknownFood': 'Unknown food',
    'meals.proteinShort': '{n}g P',
    'meals.logAnother': 'Log another meal',
    'meals.logTitle': 'Log a Meal',

    // ── Meal log form ──
    'form.mealType': 'Meal Type',
    'form.food': 'Food',
    'form.searchFoods': 'Search foods...',
    'form.tapToChange': 'Tap to change',
    'form.noFoods': 'No foods found',
    'form.portion': 'Portion — {n}g',
    'form.protein': 'Protein',
    'form.carbs': 'Carbs',
    'form.fat': 'Fat',
    'form.logFood': 'Log {name}',
    'form.selectFood': 'Select a food to log',
    'form.logged': 'Logged!',
    'form.headingBack': 'Heading back...',
    'form.pleaseSelectFood': 'Please select a food.',
    'form.failedLogMeal': 'Failed to log meal.',

    // ── Drinks ──
    'drinks.title': 'Drinks',
    'drinks.ofGoal': 'of {n}L goal',
    'drinks.remaining': '{n} remaining',
    'drinks.done': '🎉 Done!',
    'drinks.allToday': 'All drinks today: {n}',
    'drinks.quickLog': 'Quick Log',
    'drinks.logAction': 'Log {n}ml {type}',
    'drinks.selectAmount': 'Select an amount',
    'drinks.todaysLog': "Today's Log",
    'drinks.empty': 'No drinks logged yet today',
    'drinks.emptyHint': 'Select a drink type and amount above',

    // ── Weight ──
    'weight.title': 'Weight Log',
    'weight.down': '−{n} kg',
    'weight.up': '+{n} kg',
    'weight.noChange': 'No change',
    'weight.downMsg': 'Down from last entry — great progress!',
    'weight.upMsg': 'Up from last entry',
    'weight.sameMsg': 'Same as last entry',
    'weight.updateToday': "Update Today's Weight",
    'weight.logToday': "Log Today's Weight",
    'weight.history': 'History',
    'weight.label': 'Weight (kg)',
    'weight.placeholder': 'e.g. 101.5',
    'weight.notes': 'Notes',
    'weight.notesPlaceholder': 'How are you feeling today?',
    'weight.invalid': 'Enter a valid weight (30–300 kg)',
    'weight.save': 'Save Weight',
    'weight.saved': 'Weight logged!',
    'weight.savedDetail': '{n} kg saved',
    'weight.failed': 'Failed to save.',

    // ── Workout ──
    'wk.title': 'Workout',
    'wk.today': 'Today',
    'wk.thisWeek': 'This week',
    'wk.logAnother': 'Log Another Workout',
    'wk.logToday': "Log Today's Workout",
    'wk.recent': 'Recent Workouts',
    'wk.caloriesBurned': '~{n} kcal burned',
    'wk.type': 'Workout Type',
    'wk.duration': 'Duration',
    'wk.customDuration': 'Custom duration (minutes)',
    'wk.notes': 'Notes',
    'wk.notesPlaceholder': 'e.g. Chest & back, 5km run, felt strong...',
    'wk.logAction': 'Log Workout',
    'wk.logged': 'Workout logged!',
    'wk.failed': 'Failed to log workout',
    'wk.invalidDuration': 'Enter a valid duration',
    'wk.successDetail': '{emoji} {type} · {min} min',

    // ── Stats ──
    'stats.title': 'Stats',
    'stats.subtitle': "This week's summary",
    'stats.avgKcal': 'Avg kcal/day',
    'stats.daysLogged': 'Days logged',
    'stats.underGoal': 'Under goal',
    'stats.last7': 'Last 7 Days',
    'stats.goal': 'Goal: {n}',
    'stats.recentWeight': 'Recent Weight',
    'stats.phase3': 'Full charts, weekly reports, and trend analysis coming soon.',

    // ── Settings ──
    'settings.title': 'Settings',
    'settings.subtitle': 'Goals & preferences',
    'settings.profile': 'Profile',
    'settings.currentWeight': 'Current weight',
    'settings.targetWeight': 'Target weight',
    'settings.toLose': 'To lose',
    'settings.dailyGoals': 'Daily Goals',
    'settings.dailyCalories': 'Daily Calories',
    'settings.proteinGoal': 'Protein Goal',
    'settings.carbsGoal': 'Carbs Goal',
    'settings.fatGoal': 'Fat Goal',
    'settings.saveGoals': 'Save Goals',
    'settings.saved': 'Saved!',
    'settings.signOut': 'Sign Out',
    'settings.language': 'Language',
    'settings.langEnglish': 'English',
    'settings.langHebrew': 'עברית',

    // ── Meal checklist ──
    'checklist.notLogged': 'Not logged yet',

    // ── Slip dialog ──
    'slip.trigger': 'Log Slip',
    'slip.title': 'Log a Slip',
    'slip.desc': 'No judgment — just honest tracking.',
    'slip.what': 'What happened?',
    'slip.whatPlaceholder': 'e.g. Ate 3 Klik bars after dinner',
    'slip.why': 'Why?',
    'slip.whyPlaceholder': 'e.g. Stressed, bored, craving',
    'slip.logIt': 'Log It',
    'slip.logged': 'Logged. No biggie.',

    // ── Calorie ring ──
    'ring.eaten': 'kcal eaten',
    'ring.over': '+{n} over goal',
    'ring.remaining': '{n} kcal remaining',
    'ring.dailyGoal': 'Daily goal: {n} kcal',
  },

  he: {
    // ── Common / units ──
    'unit.kcal': 'קל׳',
    'unit.kg': 'ק״ג',
    'unit.g': 'ג׳',
    'unit.ml': 'מ״ל',
    'unit.l': 'ליטר',
    'unit.min': 'דק׳',
    'unit.minutes': 'דקות',
    'unit.sessions': 'אימונים',
    'common.today': 'היום',
    'common.optional': 'אופציונלי',
    'common.saving': 'שומר...',
    'common.logging': 'מתעד...',
    'common.failed': 'משהו השתבש.',

    // ── Nav ──
    'nav.home': 'בית',
    'nav.meals': 'ארוחות',
    'nav.workout': 'אימון',
    'nav.drinks': 'שתייה',
    'nav.weight': 'משקל',

    // ── Meal types ──
    'meal.breakfast': 'ארוחת בוקר',
    'meal.commute_am': 'נסיעה בבוקר',
    'meal.lunch': 'ארוחת צהריים',
    'meal.commute_pm': 'נסיעה בערב',
    'meal.dinner': 'ארוחת ערב',
    'meal.snack': 'חטיף / תוספת',
    'mealtime.anytime': 'בכל זמן',

    // ── Food categories ──
    'cat.home': 'ביתי',
    'cat.junk': 'ג׳אנק',
    'cat.sweets': 'מתוקים',
    'cat.drinks': 'שתייה',

    // ── Workout types ──
    'workout.gym': 'חדר כושר',
    'workout.walk': 'הליכה',
    'workout.run': 'ריצה',
    'workout.swim': 'שחייה',
    'workout.cycling': 'אופניים',
    'workout.other': 'אחר',

    // ── Drink types ──
    'drink.water': 'מים',
    'drink.zero': 'זירו',
    'drink.diet_coke': 'דיאט קולה',

    // ── Login ──
    'login.title': 'מעקב בריאות',
    'login.subtitle': 'המאמן האישי שלך',
    'login.email': 'אימייל',
    'login.emailPlaceholder': 'you@example.com',
    'login.password': 'סיסמה',
    'login.error': 'אימייל או סיסמה שגויים.',
    'login.signIn': 'התחברות',
    'login.signingIn': 'מתחבר...',

    // ── Dashboard ──
    'dash.greeting': 'היי, {name} 👋',
    'dash.weightGoal': 'יעד משקל',
    'dash.toGo': 'עוד {n} ק״ג',
    'dash.water': 'מים',
    'dash.waterGoal': 'יעד: {n} ליטר',
    'dash.workoutDone': 'אימון הושלם היום! 🔥',
    'dash.workoutSummary': '{type} · {min} דק׳ סה״כ',
    'dash.noWorkout': 'לא תועד אימון היום',
    'dash.todaysMeals': 'הארוחות של היום',
    'dash.addMeal': 'הוסף ארוחה',
    'dash.updateWeight': 'עדכן משקל',
    'dash.logWeight': 'תעד משקל',
    'dash.dailyCheckin': 'צ׳ק-אין יומי',
    'dash.logMeal': 'תעד ארוחה',
    'dash.quickAdd': 'הוספה מהירה',

    // ── Meals ──
    'meals.title': 'הארוחות של היום',
    'meals.proteinTotal': '{n}ג׳ חלבון',
    'meals.empty': 'עדיין לא תועד כלום היום',
    'meals.emptyHint': 'הקש + כדי לתעד את הארוחה הראשונה',
    'meals.unknownFood': 'מאכל לא ידוע',
    'meals.proteinShort': '{n}ג׳ ח',
    'meals.logAnother': 'תעד ארוחה נוספת',
    'meals.logTitle': 'תיעוד ארוחה',

    // ── Meal log form ──
    'form.mealType': 'סוג ארוחה',
    'form.food': 'מאכל',
    'form.searchFoods': 'חיפוש מאכלים...',
    'form.tapToChange': 'הקש להחלפה',
    'form.noFoods': 'לא נמצאו מאכלים',
    'form.portion': 'מנה — {n}ג׳',
    'form.protein': 'חלבון',
    'form.carbs': 'פחמימות',
    'form.fat': 'שומן',
    'form.logFood': 'תעד {name}',
    'form.selectFood': 'בחר מאכל לתיעוד',
    'form.logged': 'תועד!',
    'form.headingBack': 'חוזר אחורה...',
    'form.pleaseSelectFood': 'אנא בחר מאכל.',
    'form.failedLogMeal': 'תיעוד הארוחה נכשל.',

    // ── Drinks ──
    'drinks.title': 'שתייה',
    'drinks.ofGoal': 'מתוך יעד {n} ליטר',
    'drinks.remaining': 'נותרו {n}',
    'drinks.done': '🎉 הושלם!',
    'drinks.allToday': 'כל השתייה היום: {n}',
    'drinks.quickLog': 'תיעוד מהיר',
    'drinks.logAction': 'תעד {n} מ״ל {type}',
    'drinks.selectAmount': 'בחר כמות',
    'drinks.todaysLog': 'היומן של היום',
    'drinks.empty': 'עדיין לא תועדה שתייה היום',
    'drinks.emptyHint': 'בחר סוג וכמות למעלה',

    // ── Weight ──
    'weight.title': 'יומן משקל',
    'weight.down': '−{n} ק״ג',
    'weight.up': '+{n} ק״ג',
    'weight.noChange': 'אין שינוי',
    'weight.downMsg': 'ירידה מהפעם הקודמת — התקדמות מעולה!',
    'weight.upMsg': 'עלייה מהפעם הקודמת',
    'weight.sameMsg': 'זהה לפעם הקודמת',
    'weight.updateToday': 'עדכן את משקל היום',
    'weight.logToday': 'תעד את משקל היום',
    'weight.history': 'היסטוריה',
    'weight.label': 'משקל (ק״ג)',
    'weight.placeholder': 'לדוגמה 101.5',
    'weight.notes': 'הערות',
    'weight.notesPlaceholder': 'איך אתה מרגיש היום?',
    'weight.invalid': 'הזן משקל תקין (30–300 ק״ג)',
    'weight.save': 'שמור משקל',
    'weight.saved': 'המשקל תועד!',
    'weight.savedDetail': '{n} ק״ג נשמר',
    'weight.failed': 'השמירה נכשלה.',

    // ── Workout ──
    'wk.title': 'אימון',
    'wk.today': 'היום',
    'wk.thisWeek': 'השבוע',
    'wk.logAnother': 'תעד אימון נוסף',
    'wk.logToday': 'תעד את אימון היום',
    'wk.recent': 'אימונים אחרונים',
    'wk.caloriesBurned': '~{n} קל׳ נשרפו',
    'wk.type': 'סוג אימון',
    'wk.duration': 'משך',
    'wk.customDuration': 'משך מותאם (דקות)',
    'wk.notes': 'הערות',
    'wk.notesPlaceholder': 'לדוגמה: חזה וגב, ריצה 5 ק״מ, הרגשתי חזק...',
    'wk.logAction': 'תעד אימון',
    'wk.logged': 'האימון תועד!',
    'wk.failed': 'תיעוד האימון נכשל',
    'wk.invalidDuration': 'הזן משך תקין',
    'wk.successDetail': '{emoji} {type} · {min} דק׳',

    // ── Stats ──
    'stats.title': 'סטטיסטיקה',
    'stats.subtitle': 'סיכום השבוע',
    'stats.avgKcal': 'ממוצע קל׳/יום',
    'stats.daysLogged': 'ימים שתועדו',
    'stats.underGoal': 'מתחת ליעד',
    'stats.last7': '7 ימים אחרונים',
    'stats.goal': 'יעד: {n}',
    'stats.recentWeight': 'משקל אחרון',
    'stats.phase3': 'גרפים מלאים, דוחות שבועיים וניתוח מגמות בקרוב.',

    // ── Settings ──
    'settings.title': 'הגדרות',
    'settings.subtitle': 'יעדים והעדפות',
    'settings.profile': 'פרופיל',
    'settings.currentWeight': 'משקל נוכחי',
    'settings.targetWeight': 'משקל יעד',
    'settings.toLose': 'להוריד',
    'settings.dailyGoals': 'יעדים יומיים',
    'settings.dailyCalories': 'קלוריות יומיות',
    'settings.proteinGoal': 'יעד חלבון',
    'settings.carbsGoal': 'יעד פחמימות',
    'settings.fatGoal': 'יעד שומן',
    'settings.saveGoals': 'שמור יעדים',
    'settings.saved': 'נשמר!',
    'settings.signOut': 'התנתקות',
    'settings.language': 'שפה',
    'settings.langEnglish': 'English',
    'settings.langHebrew': 'עברית',

    // ── Meal checklist ──
    'checklist.notLogged': 'עדיין לא תועד',

    // ── Slip dialog ──
    'slip.trigger': 'תעד החלקה',
    'slip.title': 'תיעוד החלקה',
    'slip.desc': 'בלי שיפוטיות — רק מעקב כן.',
    'slip.what': 'מה קרה?',
    'slip.whatPlaceholder': 'לדוגמה: אכלתי 3 קליק אחרי הארוחה',
    'slip.why': 'למה?',
    'slip.whyPlaceholder': 'לדוגמה: לחוץ, משועמם, חשק',
    'slip.logIt': 'תעד',
    'slip.logged': 'תועד. לא נורא.',

    // ── Calorie ring ──
    'ring.eaten': 'קל׳ נאכלו',
    'ring.over': '+{n} מעל היעד',
    'ring.remaining': 'נותרו {n} קל׳',
    'ring.dailyGoal': 'יעד יומי: {n} קל׳',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

// Shared interpolation helper used by both server and client.
export function interpolate(
  str: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return str;
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}
