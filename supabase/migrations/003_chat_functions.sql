-- ============================================================
-- Chat helper functions & policies
-- ============================================================

-- SECURITY DEFINER RPC: find or create a 1-on-1 chat between current user and another user
-- Returns the chat ID. Bypasses RLS for the INSERTs.
CREATE OR REPLACE FUNCTION find_or_create_chat(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  caller_id UUID := auth.uid();
  existing_chat_id UUID;
  new_chat_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF caller_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot chat with yourself';
  END IF;

  -- Try to find an existing 1-on-1 chat
  SELECT c.id INTO existing_chat_id
  FROM chats c
  WHERE EXISTS (SELECT 1 FROM chat_members WHERE chat_id = c.id AND user_id = caller_id)
    AND EXISTS (SELECT 1 FROM chat_members WHERE chat_id = c.id AND user_id = other_user_id)
    AND (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) = 2
  LIMIT 1;

  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;

  -- Create a new chat
  INSERT INTO chats DEFAULT VALUES RETURNING id INTO new_chat_id;
  INSERT INTO chat_members (chat_id, user_id) VALUES
    (new_chat_id, caller_id),
    (new_chat_id, other_user_id);
  RETURN new_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION find_or_create_chat(UUID) TO authenticated;
