-- Health tracking tables (Phase 1)

CREATE TABLE IF NOT EXISTS user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Avi',
  height_cm int NOT NULL DEFAULT 181,
  current_weight_kg numeric(5,2) DEFAULT 102,
  target_weight_kg numeric(5,2) DEFAULT 88,
  birth_year int DEFAULT 2002,
  calorie_goal int NOT NULL DEFAULT 2000,
  protein_goal_g int NOT NULL DEFAULT 150,
  carbs_goal_g int NOT NULL DEFAULT 200,
  fat_goal_g int NOT NULL DEFAULT 65,
  hernia_flag boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_he text,
  category text NOT NULL CHECK (category IN ('home_meals', 'junk_food', 'israeli_sweets', 'drinks')),
  calories_per_100g numeric(6,2) NOT NULL DEFAULT 0,
  protein_per_100g numeric(5,2) DEFAULT 0,
  carbs_per_100g numeric(5,2) DEFAULT 0,
  fat_per_100g numeric(5,2) DEFAULT 0,
  default_portion_g int DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'commute_am', 'lunch', 'commute_pm', 'dinner', 'snack')),
  food_id uuid REFERENCES foods(id),
  food_name text,
  portion_g int NOT NULL DEFAULT 100,
  calories numeric(7,2),
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fat_g numeric(6,2),
  status text DEFAULT 'eaten' CHECK (status IN ('eaten', 'skipped')),
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weight_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2) NOT NULL,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS drinks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('water', 'zero', 'diet_coke')),
  amount_ml int NOT NULL DEFAULT 250,
  logged_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slip_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  what text NOT NULL,
  why text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_log_user_date ON meals_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_log_user_date ON weight_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_drinks_log_user_date ON drinks_log(user_id, date);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE slip_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profile_own" ON user_profile FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "foods_read_all" ON foods FOR SELECT USING (is_active = true);
CREATE POLICY "meals_log_own" ON meals_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_log_own" ON weight_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "drinks_log_own" ON drinks_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "slip_log_own" ON slip_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
