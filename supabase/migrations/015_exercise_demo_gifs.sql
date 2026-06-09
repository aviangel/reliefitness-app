-- Exercise demo images sourced from yuhonas/free-exercise-db (MIT licence)
-- Images are JPG stills hosted on GitHub raw CDN; ExerciseCard renders them via <img>.

UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg'                WHERE slug = 'lat-pulldown-wide';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Band_Assisted_Pull-Up/0.jpg'                  WHERE slug = 'assisted-pullup';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg'                       WHERE slug = 'seated-cable-row-wide';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg'                    WHERE slug = 'one-arm-db-row';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg'                               WHERE slug = 'face-pulls';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg'                     WHERE slug = 'db-bicep-curl';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg'                                 WHERE slug = 'chin-ups';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg'                  WHERE slug = 'incline-db-press';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg'                  WHERE slug = 'weighted-dips';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg'                         WHERE slug = 'cable-flyes';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Dumbbell_Press/0.jpg'                 WHERE slug = 'standing-db-shoulder-press';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg'                      WHERE slug = 'lateral-raises';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg'      WHERE slug = 'tricep-rope-pushdown';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg'   WHERE slug = 'overhead-tricep-extension';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg'                               WHERE slug = 'leg-press';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg'              WHERE slug = 'bulgarian-split-squat';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg'          WHERE slug = 'db-rdl-light';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/0.jpg'                WHERE slug = 'walking-lunges';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg'                            WHERE slug = 'cable-crunch';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg'                       WHERE slug = 'hanging-leg-raises';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Curl/0.jpg'                             WHERE slug = 'ez-bar-curl';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg'                            WHERE slug = 'hammer-curl';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/0.jpg'              WHERE slug = 'cable-lateral-raise';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg'      WHERE slug = 'rope-hammer-pushdown';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/0.jpg'                           WHERE slug = 'reverse-pec-deck';
UPDATE exercises SET demo_gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg'                                   WHERE slug = 'plank';
-- hollow-body-hold: no match found in exercise image database; ExerciseCard falls back to animated icon
UPDATE exercises SET demo_gif_url = NULL WHERE slug = 'hollow-body-hold';
