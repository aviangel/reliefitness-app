-- Daily calorie status view — computes TDEE from profile + historical weight,
-- then classifies each day as deficit / maintenance / surplus.
CREATE OR REPLACE VIEW daily_calorie_status AS
WITH base AS (
  SELECT
    dt.user_id,
    dt.date,
    dt.total_calories,
    pt.calorie_goal,
    ROUND(
      (
        10.0 * COALESCE(
          (SELECT wl.weight_kg::float FROM weight_log wl
           WHERE wl.user_id = dt.user_id AND wl.date <= dt.date
           ORDER BY wl.date DESC LIMIT 1),
          pt.current_weight_kg::float
        )
        + 6.25 * pt.height_cm::float
        - 5.0 * (EXTRACT(YEAR FROM dt.date) - pt.birth_year)
        + CASE WHEN pt.sex = 'female' THEN -161.0 ELSE 5.0 END
      )
      * CASE pt.activity_level
          WHEN 'sedentary'         THEN 1.2
          WHEN 'moderately_active' THEN 1.55
          WHEN 'very_active'       THEN 1.725
          WHEN 'extra_active'      THEN 1.9
          ELSE 1.375
        END
    )::int AS tdee
  FROM (
    SELECT user_id, date, ROUND(COALESCE(SUM(calories), 0))::int AS total_calories
    FROM meals_log
    GROUP BY user_id, date
  ) dt
  JOIN user_profile pt ON pt.user_id = dt.user_id
)
SELECT
  user_id,
  date,
  total_calories,
  calorie_goal,
  tdee,
  total_calories - tdee AS delta_from_tdee,
  CASE
    WHEN total_calories > tdee + 50  THEN 'surplus'
    WHEN total_calories < tdee - 50  THEN 'deficit'
    ELSE                                   'maintenance'
  END AS status
FROM base;
