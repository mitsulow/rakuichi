-- 015: Notifications system. Triggers populate this from likes / comments /
-- messages / callout joins. RLS: read & update own; inserts come through
-- triggers (SECURITY DEFINER) so client-direct INSERT is blocked.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications read own" ON notifications;
CREATE POLICY "notifications read own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications update own" ON notifications;
CREATE POLICY "notifications update own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers fire as SECURITY DEFINER so they bypass the (absent) INSERT policy.
DROP POLICY IF EXISTS "notifications no client insert" ON notifications;
CREATE POLICY "notifications no client insert" ON notifications
  FOR INSERT WITH CHECK (false);

-- ---------- like → notification ----------
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, target_type, target_id)
  SELECT p.user_id, NEW.user_id, 'like', 'post', NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id IS DISTINCT FROM NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_like ON likes;
CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ---------- comment → notification ----------
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, payload)
  SELECT p.user_id, NEW.user_id, 'comment', 'post', NEW.post_id,
         jsonb_build_object('preview', LEFT(COALESCE(NEW.body, ''), 80))
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id IS DISTINCT FROM NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ---------- callout participant → notification ----------
CREATE OR REPLACE FUNCTION notify_on_callout_join()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, payload)
  SELECT c.user_id, NEW.user_id, 'callout_join', 'callout', NEW.callout_id,
         jsonb_build_object('comment', COALESCE(NEW.comment, ''))
  FROM callouts c
  WHERE c.id = NEW.callout_id AND c.user_id IS DISTINCT FROM NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_callout_join ON callout_participants;
CREATE TRIGGER trg_notify_on_callout_join
  AFTER INSERT ON callout_participants
  FOR EACH ROW EXECUTE FUNCTION notify_on_callout_join();
