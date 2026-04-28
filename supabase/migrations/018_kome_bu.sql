-- 018: 米部 (kome-bu). 田んぼを提供する農家 と、お米作りを手伝いたい
-- 都会のむらびと をつなぐマッチング機能。

CREATE TABLE IF NOT EXISTS kome_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prefecture TEXT NOT NULL,
  city TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_urls TEXT[] DEFAULT '{}'::TEXT[],
  season_info TEXT,
  max_helpers INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kome_fields_owner ON kome_fields(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_kome_fields_prefecture ON kome_fields(prefecture);
CREATE INDEX IF NOT EXISTS idx_kome_fields_status ON kome_fields(status);
CREATE INDEX IF NOT EXISTS idx_kome_fields_created ON kome_fields(created_at DESC);

CREATE TABLE IF NOT EXISTS kome_helpers (
  kome_field_id UUID NOT NULL REFERENCES kome_fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (kome_field_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kome_helpers_user ON kome_helpers(user_id);

ALTER TABLE kome_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE kome_helpers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kome_fields read" ON kome_fields;
CREATE POLICY "kome_fields read" ON kome_fields FOR SELECT USING (true);

DROP POLICY IF EXISTS "kome_fields insert" ON kome_fields;
CREATE POLICY "kome_fields insert" ON kome_fields
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "kome_fields update own" ON kome_fields;
CREATE POLICY "kome_fields update own" ON kome_fields
  FOR UPDATE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "kome_fields delete own" ON kome_fields;
CREATE POLICY "kome_fields delete own" ON kome_fields
  FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "kome_helpers read" ON kome_helpers;
CREATE POLICY "kome_helpers read" ON kome_helpers FOR SELECT USING (true);

DROP POLICY IF EXISTS "kome_helpers insert" ON kome_helpers;
CREATE POLICY "kome_helpers insert" ON kome_helpers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kome_helpers delete own" ON kome_helpers;
CREATE POLICY "kome_helpers delete own" ON kome_helpers
  FOR DELETE USING (auth.uid() = user_id);

-- 田んぼに参加する人が出たら、田んぼの主に通知
CREATE OR REPLACE FUNCTION notify_on_kome_join()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, payload)
  SELECT
    f.owner_user_id,
    NEW.user_id,
    'kome_join',
    'kome_field',
    NEW.kome_field_id,
    jsonb_build_object(
      'field_name', f.name,
      'comment', COALESCE(NEW.comment, '')
    )
  FROM kome_fields f
  WHERE f.id = NEW.kome_field_id
    AND f.owner_user_id IS DISTINCT FROM NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_kome_join ON kome_helpers;
CREATE TRIGGER trg_notify_on_kome_join
  AFTER INSERT ON kome_helpers
  FOR EACH ROW EXECUTE FUNCTION notify_on_kome_join();
