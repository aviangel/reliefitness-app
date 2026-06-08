-- Phase 4: configurable water goal + sleep, body measurements, and steps tracking.

-- 1. Configurable daily water goal (was hardcoded at 2500ml)
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS water_goal_ml int NOT NULL DEFAULT 2500;

-- 2. Sleep tracking
CREATE TABLE IF NOT EXISTS sleep_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric(3,1) NOT NULL,
  quality int CHECK (quality BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 3. Body measurements
CREATE TABLE IF NOT EXISTS measurements_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  hips_cm numeric(5,1),
  arm_cm numeric(5,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 4. Daily steps
CREATE TABLE IF NOT EXISTS steps_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  steps int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_log_user_date ON sleep_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_log_user_date ON measurements_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_steps_log_user_date ON steps_log(user_id, date DESC);

ALTER TABLE sleep_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_log_own" ON sleep_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "measurements_log_own" ON measurements_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "steps_log_own" ON steps_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
