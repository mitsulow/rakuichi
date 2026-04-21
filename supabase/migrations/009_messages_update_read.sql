-- ============================================================
-- Fix: Allow chat members to mark messages as read
-- ============================================================
-- The 008 migration created SELECT/INSERT policies on messages but no
-- UPDATE policy. markChatRead was silently blocked by RLS, so the
-- unread counter never went down.

DROP POLICY IF EXISTS "messages_update_read" ON messages;

CREATE POLICY "messages_update_read" ON messages
  FOR UPDATE
  USING (is_chat_member(chat_id, auth.uid()))
  WITH CHECK (is_chat_member(chat_id, auth.uid()));
