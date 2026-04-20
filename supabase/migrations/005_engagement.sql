-- ============================================================
-- 楽市楽座 - Engagement features
-- ============================================================

-- Aspirations: "I want to do your life_work too"
CREATE TABLE IF NOT EXISTS aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspirer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inspired_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  life_work TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspirer_id, inspired_id)
);

ALTER TABLE aspirations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "aspirations_select" ON aspirations FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aspirations_insert" ON aspirations
    FOR INSERT WITH CHECK (auth.uid() = inspired_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aspirations_delete" ON aspirations
    FOR DELETE USING (auth.uid() = inspired_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_aspirations_inspirer ON aspirations(inspirer_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_inspired ON aspirations(inspired_id);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "invites_select_own" ON invites FOR SELECT
    USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "invites_insert_own" ON invites FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
