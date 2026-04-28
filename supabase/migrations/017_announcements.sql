-- 017: 運営からの一斉通知。announcements に1行 INSERT すると、
-- トリガーで全 profiles に notifications が自動配布される（fan-out）。

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements read" ON announcements;
CREATE POLICY "announcements read" ON announcements
  FOR SELECT USING (true);

-- 直接の client INSERT は禁止。SQL コンソール（service role）からのみ。
DROP POLICY IF EXISTS "announcements no client insert" ON announcements;
CREATE POLICY "announcements no client insert" ON announcements
  FOR INSERT WITH CHECK (false);

-- Fan-out trigger
CREATE OR REPLACE FUNCTION notify_on_announcement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id, actor_id, type, target_type, target_id, payload
  )
  SELECT
    p.id,
    NEW.created_by,
    'announcement',
    'announcement',
    NEW.id,
    jsonb_build_object(
      'title', NEW.title,
      'body', NEW.body,
      'link_url', NEW.link_url,
      'link_label', NEW.link_label
    )
  FROM profiles p;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_announcement ON announcements;
CREATE TRIGGER trg_notify_on_announcement
  AFTER INSERT ON announcements
  FOR EACH ROW EXECUTE FUNCTION notify_on_announcement();
