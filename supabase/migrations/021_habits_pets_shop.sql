-- Habits, points, virtual pet, and reward shop

-- ── Habit catalog (global) ────────────────────────────────────────────────────
CREATE TABLE habit_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_he text,
  category text NOT NULL,            -- personal_care | cleanliness | health
  emoji text NOT NULL DEFAULT '✅',
  sort int NOT NULL DEFAULT 0
);

-- ── Per-user habit subscriptions ──────────────────────────────────────────────
CREATE TABLE user_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_slug text NOT NULL REFERENCES habit_definitions(slug) ON DELETE CASCADE,
  schedule_days int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',  -- 0=Sunday … 6=Saturday
  times_per_week int,                -- if set, goal is count-based instead of fixed days
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, habit_slug)
);

-- ── Habit completions ─────────────────────────────────────────────────────────
CREATE TABLE habit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_slug text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, habit_slug, date)
);

-- ── Points ────────────────────────────────────────────────────────────────────
CREATE TABLE user_points (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0,
  lifetime int NOT NULL DEFAULT 0,
  deficit_week_streak int NOT NULL DEFAULT 0,
  last_deficit_week date,            -- week-start (Sunday) of last awarded week
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,              -- weekly_deficit | habit | purchase
  ref_date date NOT NULL DEFAULT CURRENT_DATE,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX points_ledger_user_date ON points_ledger(user_id, ref_date);

-- ── Shop catalog (global) ─────────────────────────────────────────────────────
CREATE TABLE shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  item_type text NOT NULL,           -- pet | accessory | palette | icons | font | animation
  pet_slug text,                     -- accessories belong to one specific pet
  name_en text NOT NULL,
  name_he text,
  category text,                     -- pets: animal | human | fantasy
  cost int NOT NULL DEFAULT 0,
  is_starter boolean NOT NULL DEFAULT false,
  image_path text,
  emoji text,
  sort int NOT NULL DEFAULT 0
);

-- ── Per-user inventory + active pet ──────────────────────────────────────────
CREATE TABLE user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_slug text NOT NULL REFERENCES shop_items(slug) ON DELETE CASCADE,
  acquired_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_slug)
);

CREATE TABLE user_pet_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_pet_slug text NOT NULL,
  pet_name text NOT NULL,
  variant text NOT NULL DEFAULT 'classic',  -- color palette key
  equipped_items text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pet_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read habit defs" ON habit_definitions FOR SELECT USING (true);
CREATE POLICY "read shop" ON shop_items FOR SELECT USING (true);
CREATE POLICY "own user_habits" ON user_habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own habit_log" ON habit_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own user_points" ON user_points FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own points_ledger" ON points_ledger FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own user_inventory" ON user_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own user_pet_state" ON user_pet_state FOR ALL USING (auth.uid() = user_id);

-- ── Seed: habit catalog ───────────────────────────────────────────────────────
INSERT INTO habit_definitions (slug, name_en, name_he, category, emoji, sort) VALUES
  ('brush_teeth',   'Brush teeth',          'צחצוח שיניים',      'personal_care', '🦷', 1),
  ('skincare',      'Facial skincare',      'טיפוח פנים',        'personal_care', '🧴', 2),
  ('shower',        'Shower',               'מקלחת',             'personal_care', '🚿', 3),
  ('comb_hair',     'Comb hair',            'סירוק שיער',        'personal_care', '💇', 4),
  ('tidy_room',     'Tidy the room',        'סידור החדר',        'cleanliness',   '🛏️', 5),
  ('organize_desk', 'Organize the desk',    'סידור שולחן העבודה','cleanliness',   '🗂️', 6),
  ('vitamins',      'Take vitamins',        'נטילת ויטמינים',    'health',        '💊', 7),
  ('medication',    'Take medication',      'נטילת תרופות',      'health',        '🩺', 8),
  ('stretches',     'Morning stretches',    'מתיחות בוקר',       'health',        '🧘', 9);

-- ── Seed: shop — starter pets (claimed at onboarding, not sold in shop) ───────
INSERT INTO shop_items (slug, item_type, name_en, name_he, category, cost, is_starter, image_path, emoji, sort) VALUES
  ('pet-boy',      'pet', 'Boy',      'ילד',      'human',   0,    true,  '/pets/boy.png',      '🧑', 1),
  ('pet-girl',     'pet', 'Girl',     'ילדה',     'human',   0,    true,  '/pets/girl.png',     '👧', 2),
  ('pet-dog',      'pet', 'Puppy',    'גור כלבים','animal',  0,    true,  '/pets/dog.png',      '🐶', 3),
  ('pet-dragon',   'pet', 'Dragon',   'דרקון',    'fantasy', 2000, false, '/pets/dragon.png',   '🐉', 4),
  ('pet-mushroom', 'pet', 'Mushroom Buddy', 'פטריון', 'fantasy', 1500, false, '/pets/mushroom.png', '🍄', 5);

-- ── Seed: shop — pet-specific accessories ─────────────────────────────────────
INSERT INTO shop_items (slug, item_type, pet_slug, name_en, name_he, cost, emoji, sort) VALUES
  ('boy-cap',            'accessory', 'pet-boy',      'Baseball Cap',    'כובע מצחייה',   200, '🧢', 10),
  ('boy-hoodie',         'accessory', 'pet-boy',      'Cozy Hoodie',     'קפוצ''ון',      250, '👕', 11),
  ('girl-hoodie',        'accessory', 'pet-girl',     'Cozy Hoodie',     'קפוצ''ון',      250, '👚', 12),
  ('girl-sneakers',      'accessory', 'pet-girl',     'Fresh Sneakers',  'סניקרס',        200, '👟', 13),
  ('dog-bandana',        'accessory', 'pet-dog',      'Red Bandana',     'בנדנה אדומה',   200, '🟥', 14),
  ('dog-sunglasses',     'accessory', 'pet-dog',      'Cool Sunglasses', 'משקפי שמש',     300, '🕶️', 15),
  ('dragon-gold-horns',  'accessory', 'pet-dragon',   'Golden Horns',    'קרניים מוזהבות', 400, '✨', 16),
  ('dragon-armor',       'accessory', 'pet-dragon',   'Knight Armor',    'שריון אביר',     600, '🛡️', 17),
  ('mushroom-satchel',   'accessory', 'pet-mushroom', 'Explorer Satchel','תיק מגלה ארצות', 350, '🎒', 18),
  ('mushroom-leaf-cape', 'accessory', 'pet-mushroom', 'Leaf Cape',       'גלימת עלה',      300, '🍃', 19);

-- ── Seed: shop — app design rewards ───────────────────────────────────────────
INSERT INTO shop_items (slug, item_type, name_en, name_he, cost, emoji, sort) VALUES
  ('palette-ocean',  'palette',   'Ocean Palette',        'פלטת אוקיינוס',   800, '🌊', 20),
  ('palette-sunset', 'palette',   'Sunset Palette',       'פלטת שקיעה',      800, '🌅', 21),
  ('icons-minimal',  'icons',     'Minimal Icon Set',     'אייקונים מינימליים', 600, '◽', 22),
  ('font-rounded',   'font',      'Rounded Font',         'גופן מעוגל',      500, '🔤', 23),
  ('anim-confetti',  'animation', 'Confetti Celebrations','אנימציית קונפטי', 700, '🎉', 24);
