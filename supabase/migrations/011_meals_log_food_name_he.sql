-- Store the Hebrew food name alongside the English one so the app can show
-- localized names when the user is in Hebrew mode.
ALTER TABLE meals_log ADD COLUMN IF NOT EXISTS food_name_he text;

-- Backfill Hebrew name + food_id for existing entries that match a food by name.
UPDATE meals_log m
SET food_name_he = f.name_he,
    food_id = COALESCE(m.food_id, f.id)
FROM foods f
WHERE m.food_name IS NOT NULL
  AND lower(m.food_name) = lower(f.name)
  AND m.food_name_he IS NULL;
