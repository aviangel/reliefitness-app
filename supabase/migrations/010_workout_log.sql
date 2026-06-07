-- Workout logging (Phase 2)

CREATE TABLE IF NOT EXISTS workout_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL,
  duration_minutes int,
  calories_burned int,
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_log_user_date ON workout_log(user_id, date DESC);

ALTER TABLE workout_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_log_own" ON workout_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
