-- Add sugar tracking parallel to protein/carbs/fat
ALTER TABLE foods ADD COLUMN IF NOT EXISTS sugar_per_100g numeric(5,2) DEFAULT 0;
ALTER TABLE meals_log ADD COLUMN IF NOT EXISTS sugar_g numeric(6,2);
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS sugar_goal_g int NOT NULL DEFAULT 50;

-- Seed sugar values for existing foods (sugar is a subset of carbs)
UPDATE foods SET sugar_per_100g = CASE name
  WHEN 'Chicken Schnitzel' THEN 1
  WHEN 'Pasta with Tomato Sauce' THEN 4
  WHEN 'Ptitim (cooked)' THEN 1
  WHEN 'Eggs (2 eggs)' THEN 1.1
  WHEN 'Bread Slice' THEN 5
  WHEN 'Shake Shack Double SmashBurger' THEN 6
  WHEN 'Shake Shack Fries' THEN 0.5
  WHEN 'McDonald''s Hamburger' THEN 6
  WHEN 'BBB 220g Burger' THEN 4
  WHEN 'Domino''s Plain Pizza (slice)' THEN 3
  WHEN 'Domino''s Pepperoni Pizza (slice)' THEN 3
  WHEN 'Hotdog in Bun' THEN 4
  WHEN 'Klik Milk Chocolate' THEN 52
  WHEN 'Klik Dark Chocolate' THEN 48
  WHEN 'Klik White Chocolate' THEN 56
  WHEN 'Pesek Zman' THEN 45
  WHEN 'Shokolad Para (full tablet)' THEN 55
  WHEN 'Shokolad Para (row)' THEN 55
  WHEN 'Kif Kef' THEN 52
  WHEN 'Egozi' THEN 48
  WHEN 'Mekupelet' THEN 54
  WHEN 'Bamba' THEN 4
  WHEN 'Bisli' THEN 3
  ELSE 0
END;
