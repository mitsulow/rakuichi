-- ============================================================
-- 楽市楽座 - Bulletproof Fix v2 (run this instead of previous 006)
-- ============================================================
-- Safer, simpler version that just ensures everything needed is in place.
-- Drops ALL known-name policy variants before recreating, so it can be
-- run any number of times safely.

-- ------------------------------------------------------------
-- profiles columns
-- ------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS migration_percent INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_on_map BOOLEAN DEFAULT TRUE;

-- ------------------------------------------------------------
-- shops columns
-- ------------------------------------------------------------
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accepts_barter BOOLEAN DEFAULT TRUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accepts_tip BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS price_jpy INTEGER;

-- ------------------------------------------------------------
-- recommended_shops columns
-- ------------------------------------------------------------
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------
-- Storage buckets
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('rec-shops', 'rec-shops', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------
-- Storage policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete images" ON storage.objects;

CREATE POLICY "Anyone can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops'));

CREATE POLICY "Authenticated can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops'));

CREATE POLICY "Authenticated can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops'));

CREATE POLICY "Authenticated can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops'));

-- ------------------------------------------------------------
-- Table RLS: drop every known variant then recreate fresh
-- ------------------------------------------------------------

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shops_select" ON shops;
DROP POLICY IF EXISTS "shops_all_select" ON shops;
DROP POLICY IF EXISTS "shops_insert" ON shops;
DROP POLICY IF EXISTS "shops_insert_own" ON shops;
DROP POLICY IF EXISTS "shops_update" ON shops;
DROP POLICY IF EXISTS "shops_update_own" ON shops;
DROP POLICY IF EXISTS "shops_delete" ON shops;
DROP POLICY IF EXISTS "shops_delete_own" ON shops;
CREATE POLICY "shops_select" ON shops FOR SELECT USING (TRUE);
CREATE POLICY "shops_insert" ON shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "shops_update" ON shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "shops_delete" ON shops FOR DELETE USING (auth.uid() = owner_id);

-- likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT USING (TRUE);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

-- external_links (DROP all variants: original + my renamed)
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "external_links_select" ON external_links;
DROP POLICY IF EXISTS "external_links_all_select" ON external_links;
DROP POLICY IF EXISTS "external_links_insert" ON external_links;
DROP POLICY IF EXISTS "external_links_insert_own" ON external_links;
DROP POLICY IF EXISTS "external_links_update" ON external_links;
DROP POLICY IF EXISTS "external_links_update_own" ON external_links;
DROP POLICY IF EXISTS "external_links_delete" ON external_links;
DROP POLICY IF EXISTS "external_links_delete_own" ON external_links;
CREATE POLICY "external_links_select" ON external_links FOR SELECT USING (TRUE);
CREATE POLICY "external_links_insert" ON external_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "external_links_update" ON external_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "external_links_delete" ON external_links FOR DELETE USING (auth.uid() = user_id);

-- recommended_shops
ALTER TABLE recommended_shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recommended_shops_select" ON recommended_shops;
DROP POLICY IF EXISTS "recommended_shops_insert" ON recommended_shops;
DROP POLICY IF EXISTS "recommended_shops_update" ON recommended_shops;
DROP POLICY IF EXISTS "recommended_shops_update_own" ON recommended_shops;
CREATE POLICY "recommended_shops_select" ON recommended_shops FOR SELECT USING (TRUE);
CREATE POLICY "recommended_shops_insert" ON recommended_shops FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "recommended_shops_update_own" ON recommended_shops FOR UPDATE USING (auth.uid() = added_by);

-- recommendations
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recommendations_select" ON recommendations;
DROP POLICY IF EXISTS "recommendations_insert" ON recommendations;
DROP POLICY IF EXISTS "recommendations_delete" ON recommendations;
CREATE POLICY "recommendations_select" ON recommendations FOR SELECT USING (TRUE);
CREATE POLICY "recommendations_insert" ON recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommendations_delete" ON recommendations FOR DELETE USING (auth.uid() = user_id);

-- badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_select" ON badges;
CREATE POLICY "badges_select" ON badges FOR SELECT USING (TRUE);

-- wishes
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishes_select" ON wishes;
DROP POLICY IF EXISTS "wishes_all_select" ON wishes;
DROP POLICY IF EXISTS "wishes_insert" ON wishes;
DROP POLICY IF EXISTS "wishes_insert_own" ON wishes;
DROP POLICY IF EXISTS "wishes_update" ON wishes;
DROP POLICY IF EXISTS "wishes_update_own" ON wishes;
DROP POLICY IF EXISTS "wishes_delete" ON wishes;
DROP POLICY IF EXISTS "wishes_delete_own" ON wishes;
CREATE POLICY "wishes_select" ON wishes FOR SELECT USING (TRUE);
CREATE POLICY "wishes_insert" ON wishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishes_update" ON wishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishes_delete" ON wishes FOR DELETE USING (auth.uid() = user_id);

-- comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Trigger to auto-create profile row on signup (resilient)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := SPLIT_PART(NEW.email, '@', 1);

  INSERT INTO profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    uname,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', uname),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
