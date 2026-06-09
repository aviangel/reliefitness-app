-- Foundation for MCP-owned ("coach") workout plans:
--  • predetermined target weight + per-exercise progression guidance
--  • plan-level metadata so a user can have their own active plan (source='coach')
--    that overrides the static system split (source='system', user_id NULL)
--  • owner-write RLS so the app (user-scoped client) can also manage a user's plan.
--    The MCP server uses the service-role key and bypasses RLS regardless.

ALTER TABLE workout_template_exercises
  ADD COLUMN IF NOT EXISTS target_weight_kg numeric,        -- predetermined working weight (NULL = bodyweight/let app suggest)
  ADD COLUMN IF NOT EXISTS progression_note text;           -- coach guidance, e.g. "+2.5kg once you hit 12 on every set"

ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS coach_note text,                 -- plan/day level note from the coach
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system',  -- system | coach
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true, -- coach can retire an old plan
  ADD COLUMN IF NOT EXISTS auto_progress boolean NOT NULL DEFAULT true; -- app auto-bumps target weight on success

-- Owner-write policies (service role still bypasses RLS).
DROP POLICY IF EXISTS "templates_write" ON workout_templates;
CREATE POLICY "templates_write" ON workout_templates
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "template_ex_write" ON workout_template_exercises;
CREATE POLICY "template_ex_write" ON workout_template_exercises
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_id AND t.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_templates_user_active ON workout_templates(user_id, is_active, day_order);
