-- ============================================================
-- 楽市楽座 - 拡張スキーマ（移行度・お試し出品・師弟・交換記録）
-- ============================================================

-- ------------------------------------------------------------
-- profiles: ライフワーク移行度（0-100）
-- ------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS migration_percent INTEGER DEFAULT 0
  CHECK (migration_percent >= 0 AND migration_percent <= 100);

-- ------------------------------------------------------------
-- shops: お試し出品モード・物々交換可否・投げ銭可否
-- ------------------------------------------------------------
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accepts_barter BOOLEAN DEFAULT TRUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accepts_tip BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS price_jpy INTEGER;

-- ------------------------------------------------------------
-- 取引提案（trade_proposals）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('cash', 'barter', 'tip')),
  amount_jpy INTEGER,
  barter_offer TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE trade_proposals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "trade_proposals_select" ON trade_proposals
    FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trade_proposals_insert" ON trade_proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trade_proposals_update" ON trade_proposals
    FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_trade_proposals_chat ON trade_proposals(chat_id);
CREATE INDEX IF NOT EXISTS idx_trade_proposals_recipient ON trade_proposals(recipient_id, status);

-- ------------------------------------------------------------
-- 交換日記（trade_records）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES trade_proposals(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  diary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trade_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "trade_records_select" ON trade_records FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trade_records_insert" ON trade_records
    FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_trade_records_author ON trade_records(author_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_partner ON trade_records(partner_id);

-- ------------------------------------------------------------
-- 師弟関係（mentorships）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  apprentice_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  craft TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'graduated', 'declined')),
  proposed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  UNIQUE(mentor_id, apprentice_id)
);

ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "mentorships_select" ON mentorships FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "mentorships_insert" ON mentorships
    FOR INSERT WITH CHECK (auth.uid() = proposed_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "mentorships_update" ON mentorships
    FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = apprentice_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_mentorships_mentor ON mentorships(mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_mentorships_apprentice ON mentorships(apprentice_id, status);

-- ------------------------------------------------------------
-- 週イチ楽座（weekly_pickups）
-- 毎週運営が選ぶピックアップユーザー
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, user_id)
);

ALTER TABLE weekly_pickups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "weekly_pickups_select" ON weekly_pickups FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
