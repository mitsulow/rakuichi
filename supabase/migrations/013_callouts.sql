-- 013: この指とまれ — open callouts where someone announces "I want to do X"
-- and others raise their hand to join.

CREATE TABLE IF NOT EXISTS callouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  needed_skills TEXT[] DEFAULT '{}'::TEXT[],
  prefecture TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_callouts_user ON callouts(user_id);
CREATE INDEX IF NOT EXISTS idx_callouts_status ON callouts(status);
CREATE INDEX IF NOT EXISTS idx_callouts_skills ON callouts USING GIN (needed_skills);
CREATE INDEX IF NOT EXISTS idx_callouts_created ON callouts(created_at DESC);

CREATE TABLE IF NOT EXISTS callout_participants (
  callout_id UUID NOT NULL REFERENCES callouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (callout_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_callout_participants_user ON callout_participants(user_id);

ALTER TABLE callouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE callout_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "callouts read" ON callouts;
CREATE POLICY "callouts read" ON callouts FOR SELECT USING (true);

DROP POLICY IF EXISTS "callouts insert" ON callouts;
CREATE POLICY "callouts insert" ON callouts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "callouts update" ON callouts;
CREATE POLICY "callouts update" ON callouts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "callouts delete" ON callouts;
CREATE POLICY "callouts delete" ON callouts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "participants read" ON callout_participants;
CREATE POLICY "participants read" ON callout_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "participants insert" ON callout_participants;
CREATE POLICY "participants insert" ON callout_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "participants delete" ON callout_participants;
CREATE POLICY "participants delete" ON callout_participants
  FOR DELETE USING (auth.uid() = user_id);
