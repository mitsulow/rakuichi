-- ============================================================
-- 楽市楽座 (Rakuichi Rakuza) - Initial Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  story TEXT,
  status_line TEXT,
  prefecture TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_since TIMESTAMPTZ,
  rice_work TEXT,
  life_work TEXT,
  life_work_years INTEGER,
  life_work_level TEXT CHECK (life_work_level IN ('修行中', '歩み中', '一人前')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), NEW.id::TEXT),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Shops (products/services)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_text TEXT,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishes (欲しいものリスト)
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges (認定バッジ)
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('verified', 'sekaimura', 'mmm', 'mitsuro_certified', 'ichininmae', 'newcomer', 'specialist')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id)
);

-- Posts (フィード投稿)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  embed JSONB,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Saves (保存)
CREATE TABLE saves (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Follows
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Recommended shops (外部推薦店)
CREATE TABLE recommended_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendations (誰が推薦したか)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_shop_id UUID NOT NULL REFERENCES recommended_shops(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recommended_shop_id)
);

-- External links (外部SNSリンク)
CREATE TABLE external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat members
CREATE TABLE chat_members (
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner update
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Shops: public read, owner manage (must be paid)
CREATE POLICY "shops_select" ON shops FOR SELECT USING (TRUE);
CREATE POLICY "shops_insert" ON shops FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_paid = TRUE)
);
CREATE POLICY "shops_update" ON shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "shops_delete" ON shops FOR DELETE USING (auth.uid() = owner_id);

-- Posts: public read, owner manage
CREATE POLICY "posts_select" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, auth insert, owner delete
CREATE POLICY "comments_select" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes/Saves: auth manage own
CREATE POLICY "likes_select" ON likes FOR SELECT USING (TRUE);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "saves_select" ON saves FOR SELECT USING (TRUE);
CREATE POLICY "saves_insert" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete" ON saves FOR DELETE USING (auth.uid() = user_id);

-- Follows: auth manage own
CREATE POLICY "follows_select" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Wishes: public read, owner manage
CREATE POLICY "wishes_select" ON wishes FOR SELECT USING (TRUE);
CREATE POLICY "wishes_insert" ON wishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishes_update" ON wishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishes_delete" ON wishes FOR DELETE USING (auth.uid() = user_id);

-- Badges: public read (admin manages via service role)
CREATE POLICY "badges_select" ON badges FOR SELECT USING (TRUE);

-- External links: public read, owner manage
CREATE POLICY "external_links_select" ON external_links FOR SELECT USING (TRUE);
CREATE POLICY "external_links_insert" ON external_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "external_links_update" ON external_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "external_links_delete" ON external_links FOR DELETE USING (auth.uid() = user_id);

-- Recommended shops: public read, auth insert
CREATE POLICY "recommended_shops_select" ON recommended_shops FOR SELECT USING (TRUE);
CREATE POLICY "recommended_shops_insert" ON recommended_shops FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "recommendations_select" ON recommendations FOR SELECT USING (TRUE);
CREATE POLICY "recommendations_insert" ON recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommendations_delete" ON recommendations FOR DELETE USING (auth.uid() = user_id);

-- Chat: members only
CREATE POLICY "chats_select" ON chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_members WHERE chat_id = chats.id AND user_id = auth.uid())
);
CREATE POLICY "chat_members_select" ON chat_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
);

-- Messages: chat members only
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_members WHERE chat_id = messages.chat_id AND user_id = auth.uid())
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM chat_members WHERE chat_id = messages.chat_id AND user_id = auth.uid())
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_category ON shops(category);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_badges_user ON badges(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX idx_recommendations_shop ON recommendations(recommended_shop_id);
CREATE INDEX idx_profiles_prefecture ON profiles(prefecture);

-- Full text search (Japanese - using simple config, upgrade to pgroonga later)
CREATE INDEX idx_profiles_search ON profiles USING GIN (
  to_tsvector('simple', COALESCE(display_name, '') || ' ' || COALESCE(bio, '') || ' ' || COALESCE(life_work, '') || ' ' || COALESCE(prefecture, ''))
);
CREATE INDEX idx_shops_search ON shops USING GIN (
  to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- ============================================================
-- Trigger: update likes_count on posts
-- ============================================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger: update comments_count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
