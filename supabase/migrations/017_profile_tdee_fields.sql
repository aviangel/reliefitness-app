-- Add sex and activity_level to user_profile for TDEE calculation
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS sex text NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS activity_level text NOT NULL DEFAULT 'lightly_active'
    CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'));
