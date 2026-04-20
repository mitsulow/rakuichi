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
-- ============================================================
-- 楽市楽座 - Engagement features
-- ============================================================

-- Aspirations: "I want to do your life_work too"
CREATE TABLE IF NOT EXISTS aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspirer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inspired_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  life_work TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspirer_id, inspired_id)
);

ALTER TABLE aspirations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "aspirations_select" ON aspirations FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aspirations_insert" ON aspirations
    FOR INSERT WITH CHECK (auth.uid() = inspired_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aspirations_delete" ON aspirations
    FOR DELETE USING (auth.uid() = inspired_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_aspirations_inspirer ON aspirations(inspirer_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_inspired ON aspirations(inspired_id);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "invites_select_own" ON invites FOR SELECT
    USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "invites_insert_own" ON invites FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
-- ============================================================
-- 楽市楽座 - Recommended Shops Seed Data
-- ============================================================
-- Run AFTER 004_storage_and_launch.sql.
-- is_seed = TRUE marks these as starter entries (users can edit/delete).
-- Coordinates are approximate; business status not verified.
-- Users are expected to refine and add their own recommendations.

INSERT INTO recommended_shops
  (name, address, latitude, longitude, category, description, prefecture, city, website, is_seed)
VALUES

-- ============================================================
-- 沖縄県 (厚めに収録)
-- ============================================================
('なかむらそば', '沖縄県本部町', 26.6601, 127.8789, 'natural_cafe', '本部そば街道の老舗、昔ながらの味', '沖縄県', '本部町', NULL, TRUE),
('浮島ガーデン', '沖縄県那覇市松尾', 26.2142, 127.6825, 'natural_food', '沖縄の自然栽培・オーガニック中心のカフェ', '沖縄県', '那覇市', NULL, TRUE),
('自然食とおやつ mana', '沖縄県那覇市', 26.2124, 127.6809, 'natural_cafe', 'マクロビ＆ヴィーガンの優しいごはん', '沖縄県', '那覇市', NULL, TRUE),
('LAND', '沖縄県那覇市国場', 26.1818, 127.7196, 'natural_cafe', 'オーガニックカフェ、体に優しい沖縄素材', '沖縄県', '那覇市', NULL, TRUE),
('ゆうなみ', '沖縄県今帰仁村', 26.6934, 127.9673, 'natural_food', '古民家食堂、自然栽培の島野菜中心', '沖縄県', '今帰仁村', NULL, TRUE),
('カフェ＆ブックス ビブリオマーニャ', '沖縄県うるま市', 26.3791, 127.8575, 'natural_cafe', '本とオーガニックコーヒー', '沖縄県', 'うるま市', NULL, TRUE),
('福木カフェ・商店', '沖縄県本部町伊豆味', 26.6380, 127.9085, 'natural_cafe', '山の中のオーガニックカフェ', '沖縄県', '本部町', NULL, TRUE),
('自然食みぐるめく', '沖縄県読谷村', 26.4041, 127.7456, 'natural_food', 'ヴィーガン・グルテンフリー対応', '沖縄県', '読谷村', NULL, TRUE),
('ふくぎや', '沖縄県那覇市', 26.2168, 127.6860, 'natural_goods', '沖縄の自然素材ショップ', '沖縄県', '那覇市', NULL, TRUE),
('MANU COFFEE', '沖縄県那覇市', 26.2145, 127.6830, 'natural_cafe', '自家焙煎オーガニックコーヒー', '沖縄県', '那覇市', NULL, TRUE),
('EM研究機構', '沖縄県うるま市石川', 26.4328, 127.8304, 'natural_therapy', 'EM自然農法の発祥、有用微生物', '沖縄県', 'うるま市', NULL, TRUE),
('大地の家', '沖縄県南城市', 26.1437, 127.7683, 'natural_food', '自然栽培野菜の直売所', '沖縄県', '南城市', NULL, TRUE),
('やんばるオーガニックファーム', '沖縄県国頭村', 26.7440, 128.1792, 'natural_food', '無農薬野菜、やんばるの森から', '沖縄県', '国頭村', NULL, TRUE),
('琉球養生料理 くらち', '沖縄県宮古島市', 24.8056, 125.2814, 'natural_food', '宮古島の薬草と島野菜', '沖縄県', '宮古島市', NULL, TRUE),
('石垣島マルシェ', '沖縄県石垣市', 24.3401, 124.1562, 'natural_food', '八重山の自然素材を集めたマルシェ', '沖縄県', '石垣市', NULL, TRUE),
('沖縄薬草園', '沖縄県名護市', 26.5911, 127.9770, 'alt_medicine', '沖縄の伝統薬草でからだを整える', '沖縄県', '名護市', NULL, TRUE),
('鍼灸院 和の輪', '沖縄県那覇市', 26.2124, 127.6809, 'alt_medicine', '経絡治療と東洋医学', '沖縄県', '那覇市', NULL, TRUE),
('やんばる自然療法センター', '沖縄県東村', 26.6457, 128.1281, 'natural_therapy', 'ハーブ・アロマ・レイキ', '沖縄県', '東村', NULL, TRUE),
('ホリスティックサロンMahalo', '沖縄県浦添市', 26.2456, 127.7143, 'natural_therapy', 'ロミロミ・レイキ・アロマテラピー', '沖縄県', '浦添市', NULL, TRUE),
('自然食堂てぃんがーら', '沖縄県名護市', 26.5911, 127.9770, 'natural_food', '海の見える自然食堂', '沖縄県', '名護市', NULL, TRUE),
('やちむんの里', '沖縄県読谷村', 26.3934, 127.7318, 'natural_goods', '陶器の里、ナチュラルなうつわ', '沖縄県', '読谷村', NULL, TRUE),
('ユインチホテル', '沖縄県南城市', 26.1500, 127.7700, 'natural_therapy', '天然温泉と自然療法', '沖縄県', '南城市', NULL, TRUE),
('ぬちまーす', '沖縄県うるま市宮城島', 26.3761, 127.9640, 'natural_food', '世界一のミネラル海塩', '沖縄県', 'うるま市', NULL, TRUE),
('田芋カフェ ターンムカフェ', '沖縄県宜野湾市', 26.2819, 127.7785, 'natural_cafe', '沖縄の在来田芋料理', '沖縄県', '宜野湾市', NULL, TRUE),
('くくる庵', '沖縄県恩納村', 26.5019, 127.8578, 'natural_food', '自然栽培野菜のワンプレート', '沖縄県', '恩納村', NULL, TRUE),

-- ============================================================
-- 東京都
-- ============================================================
('Natural House 青山店', '東京都港区北青山', 35.6720, 139.7179, 'natural_food', 'オーガニックスーパー、日本最大級', '東京都', '港区', NULL, TRUE),
('Bio c'' Bon 麻布十番', '東京都港区麻布十番', 35.6556, 139.7375, 'natural_food', 'フランス発オーガニックスーパー', '東京都', '港区', NULL, TRUE),
('2foods 渋谷ロフト店', '東京都渋谷区', 35.6606, 139.6983, 'natural_cafe', 'プラントベース（植物性）ファストフード', '東京都', '渋谷区', NULL, TRUE),
('T''s たんたん 東京駅', '東京都千代田区丸の内', 35.6812, 139.7671, 'natural_cafe', 'ヴィーガンラーメン、東京駅構内', '東京都', '千代田区', NULL, TRUE),
('AIN SOPH.', '東京都新宿区新宿', 35.6938, 139.7034, 'natural_cafe', 'ヴィーガンレストラン、パンケーキが有名', '東京都', '新宿区', NULL, TRUE),
('ブラウンライス', '東京都渋谷区神宮前', 35.6694, 139.7025, 'natural_food', '自然食レストラン、玄米菜食', '東京都', '渋谷区', NULL, TRUE),
('こどもの木', '東京都世田谷区', 35.6464, 139.6533, 'natural_goods', '無添加の木のおもちゃ', '東京都', '世田谷区', NULL, TRUE),
('クレヨンハウス 表参道', '東京都港区北青山', 35.6653, 139.7114, 'natural_goods', '有機野菜・無添加食品・絵本', '東京都', '港区', NULL, TRUE),
('ここはな', '東京都渋谷区恵比寿', 35.6464, 139.7102, 'natural_therapy', 'ホメオパシー・アロマ', '東京都', '渋谷区', NULL, TRUE),
('アメリカ屋 下北沢', '東京都世田谷区下北沢', 35.6638, 139.6672, 'natural_food', '自然食品とオーガニック', '東京都', '世田谷区', NULL, TRUE),
('ナチュラルハウス 下北沢店', '東京都世田谷区北沢', 35.6638, 139.6672, 'natural_food', 'オーガニック専門店', '東京都', '世田谷区', NULL, TRUE),
('Rainbow Bird Rendezvous', '東京都中野区', 35.7057, 139.6659, 'natural_cafe', 'マクロビ料理と天然酵母パン', '東京都', '中野区', NULL, TRUE),
('カフェ エイト', '東京都渋谷区千駄ヶ谷', 35.6779, 139.7100, 'natural_cafe', 'ヴィーガン・ベジタリアン', '東京都', '渋谷区', NULL, TRUE),
('たまな食堂', '東京都港区南青山', 35.6666, 139.7231, 'natural_food', 'マクロビオティック自然食', '東京都', '港区', NULL, TRUE),
('ファランドル', '東京都杉並区西荻窪', 35.7044, 139.5990, 'natural_food', '天然酵母パンと自然食品', '東京都', '杉並区', NULL, TRUE),
('鍼灸院 道', '東京都世田谷区', 35.6464, 139.6533, 'alt_medicine', '経絡鍼灸、女性専門', '東京都', '世田谷区', NULL, TRUE),
('漢方薬局 福祥', '東京都中央区日本橋', 35.6813, 139.7744, 'alt_medicine', '本格中医学に基づく漢方相談', '東京都', '中央区', NULL, TRUE),
('東京整体ほぐし堂', '東京都渋谷区', 35.6606, 139.6983, 'alt_medicine', '伝統整体療法', '東京都', '渋谷区', NULL, TRUE),
('日本アロマ環境協会', '東京都港区三田', 35.6489, 139.7369, 'natural_therapy', 'アロマテラピー普及', '東京都', '港区', NULL, TRUE),
('Spiral Market 表参道', '東京都港区南青山', 35.6666, 139.7231, 'natural_goods', 'エシカル＆ナチュラル雑貨', '東京都', '港区', NULL, TRUE),
('吉祥寺 ベジハーブサガル', '東京都武蔵野市吉祥寺', 35.7029, 139.5795, 'natural_cafe', 'スリランカ＆ベジタリアン料理', '東京都', '武蔵野市', NULL, TRUE),
('パンとエスプレッソと', '東京都渋谷区神宮前', 35.6694, 139.7025, 'natural_cafe', '天然酵母パンのカフェ', '東京都', '渋谷区', NULL, TRUE),
('Veganic to go', '東京都港区六本木', 35.6627, 139.7314, 'natural_cafe', 'ヴィーガンテイクアウト', '東京都', '港区', NULL, TRUE),
('菜食健美', '東京都新宿区新宿', 35.6938, 139.7034, 'natural_food', 'ベジ中華の老舗', '東京都', '新宿区', NULL, TRUE),
('ムー・マース', '東京都世田谷区自由が丘', 35.6069, 139.6683, 'natural_cafe', 'マクロビスイーツ', '東京都', '世田谷区', NULL, TRUE),
('ヘルシーマーケット ナチュラルタウン', '東京都千代田区神田', 35.6919, 139.7702, 'natural_food', '自然食品と健康食品', '東京都', '千代田区', NULL, TRUE),

-- ============================================================
-- 神奈川県
-- ============================================================
('鎌倉オーガニック', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_food', '鎌倉野菜のオーガニック専門店', '神奈川県', '鎌倉市', NULL, TRUE),
('麻心', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_cafe', '材木座の麻カフェ、オーガニック', '神奈川県', '鎌倉市', NULL, TRUE),
('ソラフネ', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_cafe', 'マクロビ玄米カフェ', '神奈川県', '鎌倉市', NULL, TRUE),
('T''s レストラン 自由が丘', '神奈川県横浜市', 35.4437, 139.6380, 'natural_cafe', 'ヴィーガンレストラン', '神奈川県', '横浜市', NULL, TRUE),
('ナチュラル・ハーモニー湘南', '神奈川県藤沢市', 35.3340, 139.4891, 'natural_food', '自然栽培農産物', '神奈川県', '藤沢市', NULL, TRUE),
('葉山 THE FIVE BEANS', '神奈川県葉山町', 35.2769, 139.5873, 'natural_cafe', 'オーガニックコーヒーロースター', '神奈川県', '葉山町', NULL, TRUE),
('ナチュラルベーカリー 鎌倉', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_cafe', '天然酵母と国産小麦', '神奈川県', '鎌倉市', NULL, TRUE),

-- ============================================================
-- 京都府
-- ============================================================
('モリカフェ', '京都府京都市', 35.0116, 135.7681, 'natural_cafe', '京町家オーガニックカフェ', '京都府', '京都市', NULL, TRUE),
('ベジサロン', '京都府京都市左京区', 35.0214, 135.7731, 'natural_cafe', 'ヴィーガン・京野菜', '京都府', '京都市', NULL, TRUE),
('嵐山 パンとエスプレッソと嵐山庭園', '京都府京都市右京区', 35.0088, 135.6761, 'natural_cafe', '天然酵母パン', '京都府', '京都市', NULL, TRUE),
('八百一本館', '京都府京都市中京区', 35.0099, 135.7633, 'natural_food', 'オーガニック青果の殿堂', '京都府', '京都市', NULL, TRUE),
('生活村 京都店', '京都府京都市', 35.0116, 135.7681, 'natural_food', '自然食品・健康食品', '京都府', '京都市', NULL, TRUE),
('cafe Matsuontoko', '京都府京都市中京区', 35.0058, 135.7586, 'natural_cafe', 'ヴィーガンバーガー', '京都府', '京都市', NULL, TRUE),
('京の田舎 洛彩', '京都府京都市', 35.0116, 135.7681, 'natural_food', '京都の自然栽培農家集', '京都府', '京都市', NULL, TRUE),
('くらま温泉', '京都府京都市左京区鞍馬', 35.1222, 135.7722, 'natural_therapy', '山の湯治', '京都府', '京都市', NULL, TRUE),
('京都鍼灸 kyoen', '京都府京都市', 35.0116, 135.7681, 'alt_medicine', '美容鍼と健康鍼', '京都府', '京都市', NULL, TRUE),

-- ============================================================
-- 大阪府
-- ============================================================
('パプリカ食堂 ヴィーガン', '大阪府大阪市', 34.6937, 135.5023, 'natural_cafe', 'ヴィーガン専門の食堂', '大阪府', '大阪市', NULL, TRUE),
('マクロビ食堂 和', '大阪府大阪市', 34.6937, 135.5023, 'natural_food', 'マクロビオティック定食', '大阪府', '大阪市', NULL, TRUE),
('ナチュラルハウス梅田', '大阪府大阪市北区', 34.7054, 135.4982, 'natural_food', '有機野菜と自然食品', '大阪府', '大阪市', NULL, TRUE),
('ORIBIO Cafe Dining', '大阪府大阪市', 34.6937, 135.5023, 'natural_cafe', 'プラントベースレストラン', '大阪府', '大阪市', NULL, TRUE),
('喜多方漢方薬局', '大阪府大阪市', 34.6937, 135.5023, 'alt_medicine', '中医学ベース漢方相談', '大阪府', '大阪市', NULL, TRUE),
('アロマスクール大阪', '大阪府大阪市', 34.6937, 135.5023, 'natural_therapy', 'アロマテラピスト養成', '大阪府', '大阪市', NULL, TRUE),
('箕面ビオスワール', '大阪府箕面市', 34.8268, 135.4700, 'natural_food', '自然派スーパーマーケット', '大阪府', '箕面市', NULL, TRUE),

-- ============================================================
-- 兵庫県
-- ============================================================
('Natural Kitchen 神戸', '兵庫県神戸市', 34.6901, 135.1955, 'natural_food', '自然食品オーガニック', '兵庫県', '神戸市', NULL, TRUE),
('Modernark pharm cafe', '兵庫県神戸市中央区', 34.6934, 135.1932, 'natural_cafe', 'マクロビオーガニックカフェ', '兵庫県', '神戸市', NULL, TRUE),
('オーガニックハウス芦屋', '兵庫県芦屋市', 34.7284, 135.3029, 'natural_food', '自然食品専門店', '兵庫県', '芦屋市', NULL, TRUE),
('淡路島 オーベルジュ', '兵庫県洲本市', 34.3432, 134.8951, 'natural_food', '淡路島の自然食', '兵庫県', '洲本市', NULL, TRUE),

-- ============================================================
-- 北海道
-- ============================================================
('北海道ナチュラル', '北海道札幌市', 43.0618, 141.3545, 'natural_food', '北海道産オーガニック食材', '北海道', '札幌市', NULL, TRUE),
('Cafeゆいま～る', '北海道札幌市中央区', 43.0618, 141.3545, 'natural_cafe', '自然食カフェ', '北海道', '札幌市', NULL, TRUE),
('Biodynamic Farm', '北海道ニセコ町', 42.8048, 140.6875, 'natural_food', 'バイオダイナミック農法', '北海道', 'ニセコ町', NULL, TRUE),
('十勝ハーブ', '北海道帯広市', 42.9237, 143.1961, 'natural_therapy', '十勝のハーブ専門店', '北海道', '帯広市', NULL, TRUE),
('シャンブル・ドット洞爺', '北海道洞爺湖町', 42.6089, 140.8613, 'natural_cafe', 'オーガニックB&B', '北海道', '洞爺湖町', NULL, TRUE),

-- ============================================================
-- 福岡県
-- ============================================================
('オーガニックレストラン ソラマド', '福岡県福岡市', 33.5902, 130.4017, 'natural_cafe', '九州産オーガニック', '福岡県', '福岡市', NULL, TRUE),
('無農薬八百屋 ニューファーマーズ', '福岡県福岡市', 33.5902, 130.4017, 'natural_food', '九州の無農薬野菜', '福岡県', '福岡市', NULL, TRUE),
('糸島 ITOSHIMA FARMERS MARKET', '福岡県糸島市', 33.5583, 130.1929, 'natural_food', '糸島の自然栽培', '福岡県', '糸島市', NULL, TRUE),
('大地の菜園', '福岡県筑後市', 33.2059, 130.5044, 'natural_food', 'マクロビ自然食', '福岡県', '筑後市', NULL, TRUE),

-- ============================================================
-- 長野県
-- ============================================================
('ルヴァン信州上田店', '長野県上田市', 36.4017, 138.2443, 'natural_cafe', '天然酵母の老舗ベーカリー', '長野県', '上田市', NULL, TRUE),
('八ヶ岳オーガニックマーケット', '長野県原村', 35.9836, 138.2744, 'natural_food', '八ヶ岳の自然栽培', '長野県', '原村', NULL, TRUE),
('軽井沢オーガニック', '長野県軽井沢町', 36.3452, 138.6368, 'natural_food', '高原の自然食品店', '長野県', '軽井沢町', NULL, TRUE),
('まあるいたまご', '長野県安曇野市', 36.3031, 137.9088, 'natural_food', '平飼い有精卵の自然食店', '長野県', '安曇野市', NULL, TRUE),
('穂高養生園', '長野県安曇野市穂高', 36.3361, 137.8828, 'natural_therapy', '山里の食養生リトリート', '長野県', '安曇野市', NULL, TRUE),

-- ============================================================
-- 静岡県
-- ============================================================
('杜のテラス 伊豆', '静岡県伊豆市', 34.9719, 138.9453, 'natural_cafe', 'オーガニックカフェと雑貨', '静岡県', '伊豆市', NULL, TRUE),
('河内晩柑農園', '静岡県浜松市', 34.7108, 137.7261, 'natural_food', '自然栽培かんきつ', '静岡県', '浜松市', NULL, TRUE),

-- ============================================================
-- 石川県
-- ============================================================
('金沢 ひらみぱん', '石川県金沢市', 36.5613, 136.6562, 'natural_cafe', '天然酵母パンとスープ', '石川県', '金沢市', NULL, TRUE),
('八百屋松田久直商店', '石川県金沢市', 36.5613, 136.6562, 'natural_food', '自然栽培野菜専門', '石川県', '金沢市', NULL, TRUE),

-- ============================================================
-- 奈良県
-- ============================================================
('くるみの木', '奈良県奈良市', 34.6851, 135.8050, 'natural_cafe', '雑貨とオーガニックカフェ', '奈良県', '奈良市', NULL, TRUE),
('ならまち遊歩', '奈良県奈良市', 34.6809, 135.8293, 'natural_cafe', 'ならまちの自然派カフェ', '奈良県', '奈良市', NULL, TRUE),

-- ============================================================
-- 高知県・四国
-- ============================================================
('土佐山アカデミー', '高知県高知市土佐山', 33.6694, 133.6242, 'natural_food', '中山間地の自然食文化', '高知県', '高知市', NULL, TRUE),
('直七', '高知県高知市', 33.5597, 133.5311, 'natural_food', '高知のオーガニック', '高知県', '高知市', NULL, TRUE),
('松山 ジュニパーツリー', '愛媛県松山市', 33.8416, 132.7657, 'natural_cafe', 'ハーブとオーガニック', '愛媛県', '松山市', NULL, TRUE),
('カフェキキ', '徳島県神山町', 33.9489, 134.3569, 'natural_cafe', '神山の自然食カフェ', '徳島県', '神山町', NULL, TRUE),

-- ============================================================
-- 鹿児島県（屋久島）
-- ============================================================
('屋久島オーガニック', '鹿児島県屋久島町', 30.3841, 130.5178, 'natural_food', '屋久島の自然栽培農家直売', '鹿児島県', '屋久島町', NULL, TRUE),
('潘流', '鹿児島県屋久島町', 30.3841, 130.5178, 'natural_cafe', '屋久島の薬膳・自然食', '鹿児島県', '屋久島町', NULL, TRUE),

-- ============================================================
-- 岡山県・広島県
-- ============================================================
('倉敷美観地区 カフェBISTRO', '岡山県倉敷市', 34.5941, 133.7714, 'natural_cafe', '岡山の有機野菜カフェ', '岡山県', '倉敷市', NULL, TRUE),
('広島自然食', '広島県広島市', 34.3853, 132.4553, 'natural_food', '広島の自然食品店', '広島県', '広島市', NULL, TRUE),
('尾道空口ママのみかん山', '広島県尾道市', 34.4089, 133.2032, 'natural_food', '無農薬みかん', '広島県', '尾道市', NULL, TRUE),

-- ============================================================
-- 宮城県・東北
-- ============================================================
('仙台 ポラン広場', '宮城県仙台市', 38.2688, 140.8721, 'natural_food', '有機農産物と自然食品', '宮城県', '仙台市', NULL, TRUE),
('山形 マルタ農園', '山形県山形市', 38.2404, 140.3636, 'natural_food', 'オーガニック米と野菜', '山形県', '山形市', NULL, TRUE),
('盛岡 ピタパン', '岩手県盛岡市', 39.7036, 141.1527, 'natural_cafe', 'ベジタリアン・ヴィーガン', '岩手県', '盛岡市', NULL, TRUE),
('会津若松オーガニック', '福島県会津若松市', 37.4946, 139.9297, 'natural_food', '会津の自然食', '福島県', '会津若松市', NULL, TRUE),

-- ============================================================
-- 新潟県
-- ============================================================
('新潟ナチュラルマーケット', '新潟県新潟市', 37.9161, 139.0364, 'natural_food', '新潟産自然食品', '新潟県', '新潟市', NULL, TRUE),

-- ============================================================
-- 愛知県
-- ============================================================
('Before 9', '愛知県名古屋市', 35.1815, 136.9066, 'natural_cafe', 'ヴィーガンランチ', '愛知県', '名古屋市', NULL, TRUE),
('自然食通販ホワイトフーズ', '愛知県名古屋市', 35.1815, 136.9066, 'natural_food', '自然食品セレクト', '愛知県', '名古屋市', NULL, TRUE),

-- ============================================================
-- 熊本県
-- ============================================================
('阿蘇 オーガニックファーム', '熊本県阿蘇市', 32.9479, 137.0050, 'natural_food', '阿蘇の自然栽培', '熊本県', '阿蘇市', NULL, TRUE),
('熊本自然療法センター', '熊本県熊本市', 32.8032, 130.7079, 'natural_therapy', 'ホメオパシー・アロマ', '熊本県', '熊本市', NULL, TRUE),

-- ============================================================
-- 大分県
-- ============================================================
('湯布院 オーガニックビレッジ', '大分県由布市湯布院', 33.2709, 131.3570, 'natural_cafe', '湯布院の自然派カフェ', '大分県', '由布市', NULL, TRUE);
