-- Guided Workout Mode: exercises catalog, templates, sessions, set logs
-- Keeps the legacy workout_log table intact (dashboard/streak/MCP depend on it);
-- the guided summary also writes a workout_log row for back-compat.

-- ── Exercise catalog (global, read-only to users) ──
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_he text,
  exercise_type text NOT NULL DEFAULT 'isolation', -- compound | isolation
  muscle_groups text[] NOT NULL DEFAULT '{}',
  default_rest_seconds int NOT NULL DEFAULT 60,
  demo_gif_url text,
  instructions_text text,
  hernia_warning boolean NOT NULL DEFAULT false,
  is_timed boolean NOT NULL DEFAULT false, -- reps field represents seconds held
  created_at timestamptz DEFAULT now()
);

-- ── Workout day templates (user_id NULL = system default split) ──
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_order int NOT NULL DEFAULT 0,
  day_name text NOT NULL,
  phase text,
  created_at timestamptz DEFAULT now()
);

-- ── Exercises within a template ──
CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  target_sets int NOT NULL DEFAULT 3,
  target_reps_min int NOT NULL DEFAULT 8,
  target_reps_max int,
  rest_seconds int NOT NULL DEFAULT 60,
  warning_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wte_template ON workout_template_exercises(template_id, order_index);

-- ── A live/completed workout session ──
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES workout_templates(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  completed_status text NOT NULL DEFAULT 'in_progress', -- in_progress | completed | abandoned
  total_volume_kg numeric NOT NULL DEFAULT 0,
  estimated_calories int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, date DESC);

-- ── Individual set logs ──
CREATE TABLE IF NOT EXISTS workout_set_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number int NOT NULL DEFAULT 1,
  weight_kg numeric NOT NULL DEFAULT 0,
  reps int NOT NULL DEFAULT 0,
  was_failure boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_setlog_user_ex ON workout_set_log(user_id, exercise_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_setlog_session ON workout_set_log(session_id);

-- ── RLS ──
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_set_log ENABLE ROW LEVEL SECURITY;

-- Catalog + templates: readable by any authenticated user
DROP POLICY IF EXISTS "exercises_read" ON exercises;
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "templates_read" ON workout_templates;
CREATE POLICY "templates_read" ON workout_templates
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "template_ex_read" ON workout_template_exercises;
CREATE POLICY "template_ex_read" ON workout_template_exercises
  FOR SELECT TO authenticated USING (true);

-- Sessions + sets: owner-only full access
DROP POLICY IF EXISTS "sessions_own" ON workout_sessions;
CREATE POLICY "sessions_own" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "setlog_own" ON workout_set_log;
CREATE POLICY "setlog_own" ON workout_set_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
