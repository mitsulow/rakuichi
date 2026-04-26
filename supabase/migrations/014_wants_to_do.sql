-- 014: wants_to_do — what each villager WANTS to do (separate from skills,
-- which is what they CAN already do). Pre-skill aspiration tags.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wants_to_do TEXT[] DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_profiles_wants_to_do_gin
  ON profiles USING GIN (wants_to_do);
