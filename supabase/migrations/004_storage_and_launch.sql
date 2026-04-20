-- ============================================================
-- 楽市楽座 - Storage & Launch Ready
-- ============================================================
-- Run this in Supabase SQL Editor to:
-- 1. Create storage buckets for images
-- 2. Add show_on_map toggle
-- 3. Extend recommended_shops
-- 4. Seed data follows in supabase/seeds/recommended_shops.sql

-- ------------------------------------------------------------
-- Storage buckets
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('rec-shops', 'rec-shops', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------
-- Storage policies: public read, authenticated write to own folder
-- Path convention: {bucket}/{user_id}/{filename}
-- ------------------------------------------------------------

-- Helper: drop + recreate storage policies to keep things idempotent
DO $$ BEGIN
  -- Public SELECT on all our buckets
  CREATE POLICY "Public read images"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users upload own images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops')
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own images"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops')
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id IN ('avatars', 'shop-images', 'post-images', 'covers', 'rec-shops')
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- profiles: show_on_map toggle
-- ------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_on_map BOOLEAN DEFAULT TRUE;

-- ------------------------------------------------------------
-- recommended_shops: extend for user-contributed content
-- ------------------------------------------------------------
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE recommended_shops ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;

ALTER TABLE recommended_shops ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "recommended_shops_select"
    ON recommended_shops FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recommended_shops_insert"
    ON recommended_shops FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recommended_shops_update_own"
    ON recommended_shops FOR UPDATE
    USING (auth.uid() = added_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "recommendations_select" ON recommendations FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recommendations_insert" ON recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recommendations_delete" ON recommendations
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_rec_shops_prefecture ON recommended_shops(prefecture);
CREATE INDEX IF NOT EXISTS idx_rec_shops_category ON recommended_shops(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_shop ON recommendations(recommended_shop_id);

-- ------------------------------------------------------------
-- external_links & wishes policies (were missing)
-- ------------------------------------------------------------
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "external_links_all_select" ON external_links FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "external_links_insert_own" ON external_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "external_links_update_own" ON external_links
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "external_links_delete_own" ON external_links
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "wishes_all_select" ON wishes FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "wishes_insert_own" ON wishes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "wishes_update_own" ON wishes FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "wishes_delete_own" ON wishes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- shops: allow public read
-- ------------------------------------------------------------
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "shops_all_select" ON shops FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "shops_insert_own" ON shops FOR INSERT
    WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "shops_update_own" ON shops FOR UPDATE USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "shops_delete_own" ON shops FOR DELETE USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
