-- Seed exercise catalog + the user's 4-day split templates.
-- Idempotent: exercises upsert on slug; templates seeded if absent;
-- template_exercises rebuilt for system (user_id IS NULL) templates.

-- ── Exercises ──
INSERT INTO exercises (slug, name_en, name_he, exercise_type, muscle_groups, default_rest_seconds, hernia_warning, is_timed, instructions_text) VALUES
  ('lat-pulldown-wide','Lat Pulldown (Wide Grip)','משיכת פולי רחבה','compound','{back,biceps}',90,false,false,'Pull the bar to your upper chest, squeeze the lats, control the way up.'),
  ('assisted-pullup','Assisted Pull-Up','מתח בסיוע','compound','{back,biceps}',90,false,false,'Use the assist pad. Full hang to chin over the bar, controlled descent.'),
  ('seated-cable-row-wide','Seated Cable Row (Wide)','חתירה בישיבה רחבה','compound','{back}',75,false,false,'Pull to your lower ribs, squeeze shoulder blades, avoid leaning back too far.'),
  ('one-arm-db-row','One-Arm Dumbbell Row','חתירה ביד אחת','compound','{back}',60,false,false,'Brace on the bench, row the dumbbell to your hip, control the negative.'),
  ('face-pulls','Face Pulls','משיכות פנים','isolation','{rear_delts}',45,false,false,'Pull the rope to your face with elbows high, externally rotate at the end.'),
  ('db-bicep-curl','Dumbbell Bicep Curl','כפיפת מרפק','isolation','{biceps}',60,false,false,'Curl without swinging the torso, full squeeze at the top.'),
  ('chin-ups','Chin-Ups','מתח אחיזה הפוכה','compound','{back,biceps}',60,false,false,'Underhand grip, pull your chin over the bar. Go for max clean reps.'),
  ('incline-db-press','Incline Dumbbell Press','לחיצת חזה בשיפוע','compound','{chest,shoulders}',90,false,false,'30° incline, press up and slightly in, control the descent.'),
  ('weighted-dips','Weighted Dips','מקבילים במשקל','compound','{chest,triceps}',90,false,false,'Lean forward for chest emphasis, lower to ~90°, press up strong.'),
  ('cable-flyes','Cable Flyes','פרפר בכבלים','isolation','{chest}',60,false,false,'Slight elbow bend, hug motion, squeeze hard at the center.'),
  ('standing-db-shoulder-press','Standing DB Shoulder Press','לחיצת כתפיים בעמידה','compound','{shoulders}',90,false,false,'Press overhead without arching the lower back, brace your core.'),
  ('lateral-raises','Lateral Raises','הרחקת כתפיים','isolation','{shoulders}',45,false,false,'Raise to shoulder height leading with the elbows, control down.'),
  ('tricep-rope-pushdown','Tricep Rope Pushdown','פשיטת מרפק בכבל','isolation','{triceps}',60,false,false,'Elbows pinned to your sides, push down and spread the rope.'),
  ('overhead-tricep-extension','Overhead Tricep Extension','פשיטת מרפק מעל הראש','isolation','{triceps}',60,false,false,'Keep elbows in, stretch behind the head, extend fully.'),
  ('leg-press','Leg Press','לחיצת רגליים','compound','{quads,glutes}',90,false,false,'Feet shoulder-width, lower to ~90°, do not lock the knees hard.'),
  ('bulgarian-split-squat','Bulgarian Split Squat','סקוואט בולגרי','compound','{quads,glutes}',75,false,false,'Rear foot elevated, drop straight down, drive through the front heel.'),
  ('db-rdl-light','Romanian Deadlift (DB, Light)','מתות רומני קל','compound','{hamstrings,glutes}',75,true,false,'Soft knees, hinge at the hips, light load only — keep the back neutral.'),
  ('walking-lunges','Walking Lunges','לאנג''ים בהליכה','compound','{quads,glutes}',60,false,false,'Long step, front knee tracks over the foot, alternate legs.'),
  ('cable-crunch','Cable Crunch','כפיפות בטן בכבל','isolation','{abs}',45,false,false,'Kneel, crunch ribs toward pelvis, round the spine.'),
  ('hanging-leg-raises','Hanging Leg Raises','הרמות רגליים בתלייה','isolation','{abs}',60,false,false,'Hang and raise legs to hip height or higher, no swinging.'),
  ('hollow-body-hold','Hollow Body Hold','אחיזת גוף חלול','isolation','{abs}',45,false,true,'Lower back pressed down, arms and legs extended, hold the position.'),
  ('ez-bar-curl','EZ-Bar Curl','כפיפת מרפק במוט','isolation','{biceps}',60,false,false,'Curl the EZ bar with control through a full range of motion.'),
  ('hammer-curl','Hammer Curl','כפיפת פטיש','isolation','{biceps,forearms}',45,false,false,'Neutral grip, curl without swinging.'),
  ('cable-lateral-raise','Cable Lateral Raise','הרחקת כתף בכבל','isolation','{shoulders}',45,false,false,'Single arm, raise to shoulder height, control the return.'),
  ('rope-hammer-pushdown','Rope Hammer Pushdown','פשיטת מרפק בחבל','isolation','{triceps}',45,false,false,'Neutral rope grip, push down and out at the bottom.'),
  ('reverse-pec-deck','Reverse Pec Deck','פרפר הפוך','isolation','{rear_delts}',45,false,false,'Squeeze the shoulder blades, control the return.'),
  ('plank','Plank','פלאנק','isolation','{abs,core}',45,false,true,'Straight line from head to heels, brace hard, do not let the hips sag.')
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en, name_he = EXCLUDED.name_he, exercise_type = EXCLUDED.exercise_type,
  muscle_groups = EXCLUDED.muscle_groups, default_rest_seconds = EXCLUDED.default_rest_seconds,
  hernia_warning = EXCLUDED.hernia_warning, is_timed = EXCLUDED.is_timed,
  instructions_text = EXCLUDED.instructions_text;

-- ── Templates (system defaults) ──
INSERT INTO workout_templates (user_id, day_order, day_name, phase)
SELECT NULL, v.day_order, v.day_name, v.phase
FROM (VALUES
  (1,'Day 1 - Pull','Toji Build - Phase 1'),
  (2,'Day 2 - Push','Toji Build - Phase 1'),
  (3,'Day 3 - Legs + Core','Toji Build - Phase 1'),
  (4,'Day 4 - Pump','Optional')
) AS v(day_order, day_name, phase)
WHERE NOT EXISTS (
  SELECT 1 FROM workout_templates t WHERE t.user_id IS NULL AND t.day_order = v.day_order
);

-- ── Rebuild template exercises for system templates ──
DELETE FROM workout_template_exercises wte
USING workout_templates t
WHERE wte.template_id = t.id AND t.user_id IS NULL;

INSERT INTO workout_template_exercises
  (template_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, warning_text)
SELECT t.id, e.id, v.order_index, v.sets, v.rmin, v.rmax, v.rest, v.warning
FROM (VALUES
  -- Day 1 - Pull
  (1,'lat-pulldown-wide',1,4,8,10::int,90,NULL::text),
  (1,'assisted-pullup',2,3,6,8,90,NULL),
  (1,'seated-cable-row-wide',3,4,10,12,75,NULL),
  (1,'one-arm-db-row',4,3,10,10,60,NULL),
  (1,'face-pulls',5,3,15,15,45,NULL),
  (1,'db-bicep-curl',6,3,10,10,60,NULL),
  (1,'chin-ups',7,3,0,NULL,60,NULL),
  -- Day 2 - Push
  (2,'incline-db-press',1,4,8,10,90,NULL),
  (2,'weighted-dips',2,3,8,10,90,NULL),
  (2,'cable-flyes',3,3,12,15,60,NULL),
  (2,'standing-db-shoulder-press',4,4,8,10,90,NULL),
  (2,'lateral-raises',5,4,12,15,45,NULL),
  (2,'tricep-rope-pushdown',6,3,12,12,60,NULL),
  (2,'overhead-tricep-extension',7,3,12,12,60,NULL),
  -- Day 3 - Legs + Core (hernia-safe)
  (3,'leg-press',1,4,12,12,90,'Controlled weight — no explosive reps.'),
  (3,'bulgarian-split-squat',2,3,10,10,75,NULL),
  (3,'db-rdl-light',3,3,12,12,75,'Light only — hernia history. Stop if you feel any strain.'),
  (3,'walking-lunges',4,3,12,12,60,NULL),
  (3,'cable-crunch',5,4,12,12,45,NULL),
  (3,'hanging-leg-raises',6,3,0,NULL,60,NULL),
  (3,'hollow-body-hold',7,3,30,45,45,NULL),
  -- Day 4 - Pump (optional)
  (4,'ez-bar-curl',1,4,10,12,60,NULL),
  (4,'hammer-curl',2,3,10,12,45,NULL),
  (4,'cable-lateral-raise',3,4,12,15,45,NULL),
  (4,'rope-hammer-pushdown',4,3,12,15,45,NULL),
  (4,'reverse-pec-deck',5,3,15,15,45,NULL),
  (4,'cable-crunch',6,3,15,15,45,NULL),
  (4,'plank',7,3,30,60,45,NULL)
) AS v(day_order, slug, order_index, sets, rmin, rmax, rest, warning)
JOIN workout_templates t ON t.user_id IS NULL AND t.day_order = v.day_order
JOIN exercises e ON e.slug = v.slug;
