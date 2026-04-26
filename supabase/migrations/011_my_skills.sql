-- ============================================================
-- My SKILL ── プロフィールに「できること」を複数登録
-- ============================================================

-- Add skills column (PostgreSQL TEXT array)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- GIN index for fast array containment / search queries
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin
  ON profiles USING GIN (skills);
