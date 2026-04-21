-- ============================================================
-- 楽市楽座 FINAL - これを実行すれば全部揃う
-- ============================================================
-- 006_bulletproof_fix.sql の後に実行。
-- 何回走らせても安全。

-- ------------------------------------------------------------
-- aspirations（「私もやってみたい」）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspirer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inspired_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  life_work TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspirer_id, inspired_id)
);

ALTER TABLE aspirations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aspirations_select" ON aspirations;
DROP POLICY IF EXISTS "aspirations_insert" ON aspirations;
DROP POLICY IF EXISTS "aspirations_delete" ON aspirations;
CREATE POLICY "aspirations_select" ON aspirations FOR SELECT USING (TRUE);
CREATE POLICY "aspirations_insert" ON aspirations FOR INSERT WITH CHECK (auth.uid() = inspired_id);
CREATE POLICY "aspirations_delete" ON aspirations FOR DELETE USING (auth.uid() = inspired_id);

CREATE INDEX IF NOT EXISTS idx_aspirations_inspirer ON aspirations(inspirer_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_inspired ON aspirations(inspired_id);

-- ------------------------------------------------------------
-- invites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites_select_own" ON invites;
DROP POLICY IF EXISTS "invites_insert_own" ON invites;
CREATE POLICY "invites_select_own" ON invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "invites_insert_own" ON invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- ------------------------------------------------------------
-- 推薦店シードデータ（自然派の店・全国）
-- ------------------------------------------------------------
-- 既存のシード（is_seed=TRUE）は一度削除してから再投入（重複防止）
DELETE FROM recommended_shops WHERE is_seed = TRUE;

INSERT INTO recommended_shops
  (name, address, latitude, longitude, category, description, prefecture, city, is_seed)
VALUES
-- 沖縄
('なかむらそば', '沖縄県本部町', 26.6601, 127.8789, 'natural_cafe', '本部そば街道の老舗', '沖縄県', '本部町', TRUE),
('浮島ガーデン', '沖縄県那覇市松尾', 26.2142, 127.6825, 'natural_food', '沖縄の自然栽培・オーガニックカフェ', '沖縄県', '那覇市', TRUE),
('自然食とおやつ mana', '沖縄県那覇市', 26.2124, 127.6809, 'natural_cafe', 'マクロビ＆ヴィーガン', '沖縄県', '那覇市', TRUE),
('LAND', '沖縄県那覇市国場', 26.1818, 127.7196, 'natural_cafe', '沖縄素材のオーガニックカフェ', '沖縄県', '那覇市', TRUE),
('ゆうなみ', '沖縄県今帰仁村', 26.6934, 127.9673, 'natural_food', '古民家食堂、自然栽培の島野菜', '沖縄県', '今帰仁村', TRUE),
('福木カフェ・商店', '沖縄県本部町伊豆味', 26.6380, 127.9085, 'natural_cafe', '山の中のオーガニックカフェ', '沖縄県', '本部町', TRUE),
('自然食みぐるめく', '沖縄県読谷村', 26.4041, 127.7456, 'natural_food', 'ヴィーガン・グルテンフリー', '沖縄県', '読谷村', TRUE),
('MANU COFFEE', '沖縄県那覇市', 26.2145, 127.6830, 'natural_cafe', '自家焙煎オーガニックコーヒー', '沖縄県', '那覇市', TRUE),
('EM研究機構', '沖縄県うるま市石川', 26.4328, 127.8304, 'natural_therapy', 'EM自然農法の発祥', '沖縄県', 'うるま市', TRUE),
('大地の家', '沖縄県南城市', 26.1437, 127.7683, 'natural_food', '自然栽培野菜の直売所', '沖縄県', '南城市', TRUE),
('やんばるオーガニックファーム', '沖縄県国頭村', 26.7440, 128.1792, 'natural_food', '無農薬野菜、やんばるの森から', '沖縄県', '国頭村', TRUE),
('琉球養生料理 くらち', '沖縄県宮古島市', 24.8056, 125.2814, 'natural_food', '宮古島の薬草と島野菜', '沖縄県', '宮古島市', TRUE),
('石垣島マルシェ', '沖縄県石垣市', 24.3401, 124.1562, 'natural_food', '八重山の自然素材', '沖縄県', '石垣市', TRUE),
('沖縄薬草園', '沖縄県名護市', 26.5911, 127.9770, 'alt_medicine', '沖縄の伝統薬草', '沖縄県', '名護市', TRUE),
('やんばる自然療法センター', '沖縄県東村', 26.6457, 128.1281, 'natural_therapy', 'ハーブ・アロマ・レイキ', '沖縄県', '東村', TRUE),
('ホリスティックサロンMahalo', '沖縄県浦添市', 26.2456, 127.7143, 'natural_therapy', 'ロミロミ・アロマテラピー', '沖縄県', '浦添市', TRUE),
('自然食堂てぃんがーら', '沖縄県名護市', 26.5911, 127.9770, 'natural_food', '海の見える自然食堂', '沖縄県', '名護市', TRUE),
('やちむんの里', '沖縄県読谷村', 26.3934, 127.7318, 'natural_goods', 'ナチュラルなうつわ', '沖縄県', '読谷村', TRUE),
('ぬちまーす', '沖縄県うるま市宮城島', 26.3761, 127.9640, 'natural_food', '世界一ミネラル豊富な海塩', '沖縄県', 'うるま市', TRUE),
('田芋カフェ ターンムカフェ', '沖縄県宜野湾市', 26.2819, 127.7785, 'natural_cafe', '沖縄の在来田芋料理', '沖縄県', '宜野湾市', TRUE),
('くくる庵', '沖縄県恩納村', 26.5019, 127.8578, 'natural_food', '自然栽培野菜のワンプレート', '沖縄県', '恩納村', TRUE),

-- 東京
('Natural House 青山店', '東京都港区北青山', 35.6720, 139.7179, 'natural_food', 'オーガニックスーパー', '東京都', '港区', TRUE),
('2foods 渋谷ロフト店', '東京都渋谷区', 35.6606, 139.6983, 'natural_cafe', 'プラントベースファストフード', '東京都', '渋谷区', TRUE),
('T''s たんたん 東京駅', '東京都千代田区丸の内', 35.6812, 139.7671, 'natural_cafe', 'ヴィーガンラーメン', '東京都', '千代田区', TRUE),
('AIN SOPH.', '東京都新宿区新宿', 35.6938, 139.7034, 'natural_cafe', 'ヴィーガンレストラン', '東京都', '新宿区', TRUE),
('ブラウンライス', '東京都渋谷区神宮前', 35.6694, 139.7025, 'natural_food', '玄米菜食の自然食', '東京都', '渋谷区', TRUE),
('クレヨンハウス 表参道', '東京都港区北青山', 35.6653, 139.7114, 'natural_goods', '有機野菜・無添加・絵本', '東京都', '港区', TRUE),
('アメリカ屋 下北沢', '東京都世田谷区下北沢', 35.6638, 139.6672, 'natural_food', '自然食品とオーガニック', '東京都', '世田谷区', TRUE),
('Rainbow Bird Rendezvous', '東京都中野区', 35.7057, 139.6659, 'natural_cafe', 'マクロビと天然酵母パン', '東京都', '中野区', TRUE),
('たまな食堂', '東京都港区南青山', 35.6666, 139.7231, 'natural_food', 'マクロビオティック自然食', '東京都', '港区', TRUE),
('ファランドル', '東京都杉並区西荻窪', 35.7044, 139.5990, 'natural_food', '天然酵母パンと自然食品', '東京都', '杉並区', TRUE),
('吉祥寺 ベジハーブサガル', '東京都武蔵野市吉祥寺', 35.7029, 139.5795, 'natural_cafe', 'スリランカ・ベジタリアン', '東京都', '武蔵野市', TRUE),
('Spiral Market 表参道', '東京都港区南青山', 35.6666, 139.7231, 'natural_goods', 'エシカル＆ナチュラル雑貨', '東京都', '港区', TRUE),

-- 神奈川
('鎌倉オーガニック', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_food', '鎌倉野菜のオーガニック', '神奈川県', '鎌倉市', TRUE),
('麻心', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_cafe', '材木座の麻カフェ', '神奈川県', '鎌倉市', TRUE),
('ソラフネ', '神奈川県鎌倉市', 35.3189, 139.5466, 'natural_cafe', 'マクロビ玄米カフェ', '神奈川県', '鎌倉市', TRUE),
('葉山 THE FIVE BEANS', '神奈川県葉山町', 35.2769, 139.5873, 'natural_cafe', 'オーガニックコーヒーロースター', '神奈川県', '葉山町', TRUE),
('T''s レストラン 横浜', '神奈川県横浜市', 35.4437, 139.6380, 'natural_cafe', 'ヴィーガンレストラン', '神奈川県', '横浜市', TRUE),

-- 京都
('モリカフェ', '京都府京都市', 35.0116, 135.7681, 'natural_cafe', '京町家オーガニックカフェ', '京都府', '京都市', TRUE),
('八百一本館', '京都府京都市中京区', 35.0099, 135.7633, 'natural_food', 'オーガニック青果の殿堂', '京都府', '京都市', TRUE),
('cafe Matsuontoko', '京都府京都市中京区', 35.0058, 135.7586, 'natural_cafe', 'ヴィーガンバーガー', '京都府', '京都市', TRUE),
('くらま温泉', '京都府京都市左京区鞍馬', 35.1222, 135.7722, 'natural_therapy', '山の湯治', '京都府', '京都市', TRUE),

-- 大阪
('パプリカ食堂 ヴィーガン', '大阪府大阪市', 34.6937, 135.5023, 'natural_cafe', 'ヴィーガン食堂', '大阪府', '大阪市', TRUE),
('ORIBIO Cafe Dining', '大阪府大阪市', 34.6937, 135.5023, 'natural_cafe', 'プラントベース', '大阪府', '大阪市', TRUE),
('ナチュラルハウス梅田', '大阪府大阪市北区', 34.7054, 135.4982, 'natural_food', '有機野菜と自然食品', '大阪府', '大阪市', TRUE),
('箕面ビオスワール', '大阪府箕面市', 34.8268, 135.4700, 'natural_food', '自然派スーパー', '大阪府', '箕面市', TRUE),

-- 兵庫
('Modernark pharm cafe', '兵庫県神戸市中央区', 34.6934, 135.1932, 'natural_cafe', 'マクロビオーガニックカフェ', '兵庫県', '神戸市', TRUE),
('オーガニックハウス芦屋', '兵庫県芦屋市', 34.7284, 135.3029, 'natural_food', '自然食品専門店', '兵庫県', '芦屋市', TRUE),

-- 北海道
('Biodynamic Farm', '北海道ニセコ町', 42.8048, 140.6875, 'natural_food', 'バイオダイナミック農法', '北海道', 'ニセコ町', TRUE),
('Cafeゆいま～る', '北海道札幌市中央区', 43.0618, 141.3545, 'natural_cafe', '自然食カフェ', '北海道', '札幌市', TRUE),
('十勝ハーブ', '北海道帯広市', 42.9237, 143.1961, 'natural_therapy', '十勝のハーブ専門店', '北海道', '帯広市', TRUE),

-- 福岡
('糸島 ITOSHIMA FARMERS MARKET', '福岡県糸島市', 33.5583, 130.1929, 'natural_food', '糸島の自然栽培', '福岡県', '糸島市', TRUE),
('無農薬八百屋 ニューファーマーズ', '福岡県福岡市', 33.5902, 130.4017, 'natural_food', '九州の無農薬野菜', '福岡県', '福岡市', TRUE),

-- 長野
('八ヶ岳オーガニックマーケット', '長野県原村', 35.9836, 138.2744, 'natural_food', '八ヶ岳の自然栽培', '長野県', '原村', TRUE),
('軽井沢オーガニック', '長野県軽井沢町', 36.3452, 138.6368, 'natural_food', '高原の自然食品店', '長野県', '軽井沢町', TRUE),
('穂高養生園', '長野県安曇野市穂高', 36.3361, 137.8828, 'natural_therapy', '山里の食養生リトリート', '長野県', '安曇野市', TRUE),
('まあるいたまご', '長野県安曇野市', 36.3031, 137.9088, 'natural_food', '平飼い有精卵の自然食店', '長野県', '安曇野市', TRUE),

-- 石川
('金沢 ひらみぱん', '石川県金沢市', 36.5613, 136.6562, 'natural_cafe', '天然酵母パンとスープ', '石川県', '金沢市', TRUE),

-- 奈良
('くるみの木', '奈良県奈良市', 34.6851, 135.8050, 'natural_cafe', '雑貨とオーガニックカフェ', '奈良県', '奈良市', TRUE),
('ならまち遊歩', '奈良県奈良市', 34.6809, 135.8293, 'natural_cafe', 'ならまちの自然派', '奈良県', '奈良市', TRUE),

-- 四国
('松山 ジュニパーツリー', '愛媛県松山市', 33.8416, 132.7657, 'natural_cafe', 'ハーブとオーガニック', '愛媛県', '松山市', TRUE),
('カフェキキ', '徳島県神山町', 33.9489, 134.3569, 'natural_cafe', '神山の自然食カフェ', '徳島県', '神山町', TRUE),

-- 鹿児島（屋久島）
('屋久島オーガニック', '鹿児島県屋久島町', 30.3841, 130.5178, 'natural_food', '屋久島の自然栽培', '鹿児島県', '屋久島町', TRUE),

-- 岡山・広島
('倉敷 カフェBISTRO', '岡山県倉敷市', 34.5941, 133.7714, 'natural_cafe', '岡山の有機野菜カフェ', '岡山県', '倉敷市', TRUE),
('尾道空口ママのみかん山', '広島県尾道市', 34.4089, 133.2032, 'natural_food', '無農薬みかん', '広島県', '尾道市', TRUE),

-- 東北
('仙台 ポラン広場', '宮城県仙台市', 38.2688, 140.8721, 'natural_food', '有機農産物', '宮城県', '仙台市', TRUE),
('山形 マルタ農園', '山形県山形市', 38.2404, 140.3636, 'natural_food', 'オーガニック米と野菜', '山形県', '山形市', TRUE),
('盛岡 ピタパン', '岩手県盛岡市', 39.7036, 141.1527, 'natural_cafe', 'ベジタリアン・ヴィーガン', '岩手県', '盛岡市', TRUE),

-- その他
('新潟ナチュラルマーケット', '新潟県新潟市', 37.9161, 139.0364, 'natural_food', '新潟産自然食品', '新潟県', '新潟市', TRUE),
('Before 9', '愛知県名古屋市', 35.1815, 136.9066, 'natural_cafe', 'ヴィーガンランチ', '愛知県', '名古屋市', TRUE),
('阿蘇 オーガニックファーム', '熊本県阿蘇市', 32.9479, 137.0050, 'natural_food', '阿蘇の自然栽培', '熊本県', '阿蘇市', TRUE),
('湯布院 オーガニックビレッジ', '大分県由布市湯布院', 33.2709, 131.3570, 'natural_cafe', '湯布院の自然派', '大分県', '由布市', TRUE);
