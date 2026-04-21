-- ============================================================
-- Fix: Infinite recursion in chat_members RLS policy
-- ============================================================
-- Original 001 schema had:
--   CREATE POLICY "chat_members_select" ON chat_members FOR SELECT USING (
--     EXISTS (SELECT 1 FROM chat_members cm WHERE ...)
--   );
-- This queries chat_members from within chat_members' own policy → recursion.

-- Drop ALL existing chat_members policies first
DROP POLICY IF EXISTS "chat_members_select" ON chat_members;
DROP POLICY IF EXISTS "chat_members_insert" ON chat_members;
DROP POLICY IF EXISTS "chat_members_update" ON chat_members;
DROP POLICY IF EXISTS "chat_members_delete" ON chat_members;

-- Simple non-recursive: users see their own rows (and those in same chats via
-- joins when another table's policy authorises the read).
CREATE POLICY "chat_members_select" ON chat_members
  FOR SELECT USING (auth.uid() = user_id);

-- Also allow seeing OTHER members of chats you're part of (needed to render
-- "who's in this conversation" without recursion — uses a SECURITY DEFINER
-- helper to bypass the policy during the check).
CREATE OR REPLACE FUNCTION is_chat_member(chat UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_members
    WHERE chat_id = chat AND user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION is_chat_member(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "chat_members_select_peers" ON chat_members;
CREATE POLICY "chat_members_select_peers" ON chat_members
  FOR SELECT USING (is_chat_member(chat_id, auth.uid()));

-- Now also fix the other policies to use the helper function instead of
-- an EXISTS subquery that might be slow / awkward with RLS.

DROP POLICY IF EXISTS "chats_select" ON chats;
CREATE POLICY "chats_select" ON chats
  FOR SELECT USING (is_chat_member(id, auth.uid()));

DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (is_chat_member(chat_id, auth.uid()));
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND is_chat_member(chat_id, auth.uid())
  );
