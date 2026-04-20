import type { Profile, Shop, Badge, Post, Wish, ExternalLink, RecommendedShop, Recommendation, Chat, Message } from "./types";

// ============================================================
// Mock Profiles
// ============================================================

export const mockProfiles: Profile[] = [
  {
    id: "u1",
    username: "mitsuro",
    email: "mitsuro@example.com",
    display_name: "さとうみつろう",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=mitsuro",
    cover_url: null,
    bio: "作家／ミュージシャン／YouTuber。楽市楽座の発起人。",
    story: "「行きたくない職場に行く人を減らしたい」その思いから楽市楽座を始めました。AIの時代、自分の腕一本で生きていく人を応援します。",
    status_line: "楽市楽座、ついにスタート！🎉",
    prefecture: "沖縄県",
    city: "今帰仁村",
    latitude: 26.6934,
    longitude: 127.9673,
    is_paid: true,
    paid_since: "2024-01-01",
    rice_work: null,
    life_work: "作家・YouTuber",
    life_work_years: 12,
    life_work_level: "一人前",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-04-20T00:00:00Z",
  },
  {
    id: "u2",
    username: "hanako_komechan",
    email: "hanako@example.com",
    display_name: "花子のお米ちゃん",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=hanako",
    cover_url: null,
    bio: "自然栽培米を育てています。農薬・化学肥料不使用。",
    story: "おばあちゃんの田んぼを引き継いで10年。『本当に美味しいお米って何だろう』を追い続けています。土の声を聴くことから始まる農業。",
    status_line: "田植えの季節です🌾 見学大歓迎！",
    prefecture: "新潟県",
    city: "南魚沼市",
    latitude: 37.0653,
    longitude: 138.8766,
    is_paid: true,
    paid_since: "2024-03-01",
    rice_work: null,
    life_work: "自然栽培農家",
    life_work_years: 10,
    life_work_level: "一人前",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2026-04-18T00:00:00Z",
  },
  {
    id: "u3",
    username: "kenji_seitai",
    email: "kenji@example.com",
    display_name: "健治の手",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=kenji",
    cover_url: null,
    bio: "整体師18年。体の声を聴きます。",
    story: "母が整体で救われた姿を見て、この道へ。20年やってきて、技術より『聴く力』が大事だと分かりました。",
    status_line: "5月の予約あと3枠",
    prefecture: "東京都",
    city: "世田谷区",
    latitude: 35.6462,
    longitude: 139.6532,
    is_paid: true,
    paid_since: "2024-02-15",
    rice_work: null,
    life_work: "整体師",
    life_work_years: 18,
    life_work_level: "一人前",
    created_at: "2024-02-15T00:00:00Z",
    updated_at: "2026-04-19T00:00:00Z",
  },
  {
    id: "u4",
    username: "yuki_art",
    email: "yuki@example.com",
    display_name: "ゆき",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=yuki",
    cover_url: null,
    bio: "美術家を目指しています。水彩画と陶芸。",
    story: "会社員をしながら、週末に絵を描いています。いつか作品だけで生活できるように。",
    status_line: "個展準備中 🎨 6月に渋谷で開催",
    prefecture: "東京都",
    city: "渋谷区",
    latitude: 35.6619,
    longitude: 139.7038,
    is_paid: true,
    paid_since: "2025-01-01",
    rice_work: "OL 6年目",
    life_work: "美術家",
    life_work_years: 3,
    life_work_level: "歩み中",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-04-17T00:00:00Z",
  },
  {
    id: "u5",
    username: "akari_yoga",
    email: "akari@example.com",
    display_name: "あかり",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=akari",
    cover_url: null,
    bio: "ツキヨガ®インストラクター。月の満ち欠けに合わせたヨガを教えています。",
    story: "月の周期に合わせた呼吸法に出会って人生が変わりました。今はその体験を多くの人に届けたい。",
    status_line: "次の満月ヨガは4/28🌕",
    prefecture: "京都府",
    city: "京都市",
    latitude: 35.0116,
    longitude: 135.7681,
    is_paid: true,
    paid_since: "2024-06-01",
    rice_work: null,
    life_work: "ヨガインストラクター",
    life_work_years: 7,
    life_work_level: "歩み中",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2026-04-20T00:00:00Z",
  },
  {
    id: "u6",
    username: "taro_miso",
    email: "taro@example.com",
    display_name: "太郎味噌",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=taro",
    cover_url: null,
    bio: "手作り味噌と発酵食品を作っています。",
    story: "発酵食品の世界は奥が深い。味噌づくりを始めて5年、ようやく『美味しい』と言ってもらえるようになりました。",
    status_line: "今年の味噌、仕込み完了！",
    prefecture: "長野県",
    city: "松本市",
    latitude: 36.2380,
    longitude: 137.9720,
    is_paid: true,
    paid_since: "2025-06-01",
    rice_work: "会社員",
    life_work: "味噌職人",
    life_work_years: 5,
    life_work_level: "歩み中",
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-04-15T00:00:00Z",
  },
  {
    id: "u7",
    username: "sakura_free",
    email: "sakura@example.com",
    display_name: "さくら",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=sakura",
    cover_url: null,
    bio: "自然と暮らす人。",
    story: null,
    status_line: "初めまして！楽市楽座デビューしました🌸",
    prefecture: "福岡県",
    city: "福岡市",
    latitude: 33.5904,
    longitude: 130.4017,
    is_paid: false,
    paid_since: null,
    rice_work: "カフェ店員",
    life_work: null,
    life_work_years: null,
    life_work_level: null,
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
  },
  {
    id: "u8",
    username: "ryo_music",
    email: "ryo@example.com",
    display_name: "リョウ",
    avatar_url: "https://api.dicebear.com/9.x/adventurer/svg?seed=ryo",
    cover_url: null,
    bio: "ギタリスト＆作曲家。自然の音をテーマに。",
    story: "東京のスタジオミュージシャンを辞めて沖縄へ。波の音と風の音をサンプリングして曲を作っています。",
    status_line: "新アルバム制作中🎸",
    prefecture: "沖縄県",
    city: "読谷村",
    latitude: 26.3956,
    longitude: 127.7441,
    is_paid: true,
    paid_since: "2024-09-01",
    rice_work: null,
    life_work: "ミュージシャン",
    life_work_years: 15,
    life_work_level: "一人前",
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2026-04-19T00:00:00Z",
  },
];

// ============================================================
// Mock Shops
// ============================================================

export const mockShops: Shop[] = [
  {
    id: "s1",
    owner_id: "u2",
    category: "food",
    name: "自然栽培コシヒカリ",
    description: "農薬・化学肥料不使用。天日干し。南魚沼の清らかな水で育てました。",
    price_text: "5kg 4,500円",
    image_urls: [],
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "s2",
    owner_id: "u2",
    category: "food",
    name: "玄米もち",
    description: "自家栽培のもち米で作った玄米もち。お雑煮にも焼き餅にも。",
    price_text: "1kg 1,800円",
    image_urls: [],
    created_at: "2024-11-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
  },
  {
    id: "s3",
    owner_id: "u3",
    category: "body",
    name: "整体セッション",
    description: "体の歪みを根本から整えます。初回はじっくりカウンセリング。",
    price_text: "60分 8,000円",
    image_urls: [],
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "s4",
    owner_id: "u3",
    category: "body",
    name: "オンライン姿勢チェック",
    description: "ZOOMで姿勢をチェック、日々の改善ポイントをお伝えします。",
    price_text: "30分 3,000円",
    image_urls: [],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "s5",
    owner_id: "u4",
    category: "craft",
    name: "水彩画オーダー",
    description: "あなたの大切な風景を水彩画に。写真から制作します。",
    price_text: "A4サイズ 15,000円〜",
    image_urls: [],
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "s6",
    owner_id: "u5",
    category: "moon",
    name: "ツキヨガ®オンラインクラス",
    description: "月の満ち欠けに合わせたヨガ。新月は内観、満月は解放のプログラム。",
    price_text: "月額 3,000円 / 単発 1,500円",
    image_urls: [],
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2026-04-15T00:00:00Z",
  },
  {
    id: "s7",
    owner_id: "u6",
    category: "food",
    name: "手作り味噌（天然醸造）",
    description: "国産大豆と天日塩、自家製麹で仕込んだ味噌。1年熟成。",
    price_text: "1kg 1,200円",
    image_urls: [],
    created_at: "2025-08-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "s8",
    owner_id: "u8",
    category: "expression",
    name: "自然音アルバム制作",
    description: "あなたの大切な場所の自然音を録音し、オリジナルBGMを制作します。",
    price_text: "応相談",
    image_urls: [],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "s9",
    owner_id: "u8",
    category: "expression",
    name: "ギターレッスン",
    description: "初心者歓迎。沖縄の海を見ながらのんびりレッスン。オンラインも可。",
    price_text: "60分 5,000円",
    image_urls: [],
    created_at: "2024-10-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
];

// ============================================================
// Mock Badges
// ============================================================

export const mockBadges: Badge[] = [
  { id: "b1", user_id: "u1", badge_type: "verified", granted_at: "2024-01-01T00:00:00Z", granted_by: null },
  { id: "b2", user_id: "u1", badge_type: "mmm", granted_at: "2024-01-01T00:00:00Z", granted_by: null },
  { id: "b3", user_id: "u1", badge_type: "mitsuro_certified", granted_at: "2024-01-01T00:00:00Z", granted_by: "u1" },
  { id: "b4", user_id: "u1", badge_type: "sekaimura", granted_at: "2024-01-01T00:00:00Z", granted_by: null },
  { id: "b5", user_id: "u2", badge_type: "verified", granted_at: "2024-03-01T00:00:00Z", granted_by: null },
  { id: "b6", user_id: "u2", badge_type: "mmm", granted_at: "2024-03-01T00:00:00Z", granted_by: null },
  { id: "b7", user_id: "u2", badge_type: "mitsuro_certified", granted_at: "2024-04-01T00:00:00Z", granted_by: "u1" },
  { id: "b8", user_id: "u2", badge_type: "ichininmae", granted_at: "2025-06-01T00:00:00Z", granted_by: "u1" },
  { id: "b9", user_id: "u3", badge_type: "verified", granted_at: "2024-02-15T00:00:00Z", granted_by: null },
  { id: "b10", user_id: "u3", badge_type: "mmm", granted_at: "2024-02-15T00:00:00Z", granted_by: null },
  { id: "b11", user_id: "u3", badge_type: "ichininmae", granted_at: "2025-01-01T00:00:00Z", granted_by: "u1" },
  { id: "b12", user_id: "u4", badge_type: "mmm", granted_at: "2025-01-01T00:00:00Z", granted_by: null },
  { id: "b13", user_id: "u5", badge_type: "mmm", granted_at: "2024-06-01T00:00:00Z", granted_by: null },
  { id: "b14", user_id: "u5", badge_type: "verified", granted_at: "2024-06-01T00:00:00Z", granted_by: null },
  { id: "b15", user_id: "u6", badge_type: "mmm", granted_at: "2025-06-01T00:00:00Z", granted_by: null },
  { id: "b16", user_id: "u7", badge_type: "newcomer", granted_at: "2026-04-10T00:00:00Z", granted_by: null },
  { id: "b17", user_id: "u8", badge_type: "mmm", granted_at: "2024-09-01T00:00:00Z", granted_by: null },
  { id: "b18", user_id: "u8", badge_type: "verified", granted_at: "2024-09-01T00:00:00Z", granted_by: null },
  { id: "b19", user_id: "u8", badge_type: "specialist", granted_at: "2025-03-01T00:00:00Z", granted_by: "u1" },
];

// ============================================================
// Mock Posts
// ============================================================

export const mockPosts: Post[] = [
  {
    id: "p1",
    user_id: "u1",
    body: "楽市楽座、ついにスタートしました！🎉\n\nAIの時代、自分の腕一本で生きていく人を応援するプラットフォーム。\n\nみんなのホームページ代わりに、ぜひマイページを充実させてね。",
    image_urls: [],
    embed: null,
    shop_id: null,
    latitude: null,
    longitude: null,
    likes_count: 234,
    comments_count: 45,
    created_at: "2026-04-20T09:00:00Z",
  },
  {
    id: "p2",
    user_id: "u2",
    body: "今年の田植え、始まりました🌾\n新潟の空気が美味しい季節。見学に来てくれる人、大歓迎です！",
    image_urls: [],
    embed: null,
    shop_id: "s1",
    latitude: 37.0653,
    longitude: 138.8766,
    likes_count: 89,
    comments_count: 12,
    created_at: "2026-04-19T14:30:00Z",
  },
  {
    id: "p3",
    user_id: "u3",
    body: "長年お越しいただいているお客様から嬉しいお言葉。\n「先生に出会ってから、病院に行く回数が減りました」\n\n技術じゃなく、聴く力。これからも大切にします。",
    image_urls: [],
    embed: null,
    shop_id: "s3",
    latitude: null,
    longitude: null,
    likes_count: 67,
    comments_count: 8,
    created_at: "2026-04-18T10:00:00Z",
  },
  {
    id: "p4",
    user_id: "u4",
    body: "6月の個展に向けて、新作の水彩画を描いています🎨\n\nテーマは「光と水」。\n朝の湖面に映る光を追いかけています。",
    image_urls: [],
    embed: null,
    shop_id: "s5",
    latitude: null,
    longitude: null,
    likes_count: 45,
    comments_count: 6,
    created_at: "2026-04-17T16:00:00Z",
  },
  {
    id: "p5",
    user_id: "u5",
    body: "今夜は満月🌕\n\n満月の夜は「手放し」のヨガ。\n握りしめているものを、そっと開く時間。\n\nオンラインクラス、まだ空きあります。",
    image_urls: [],
    embed: null,
    shop_id: "s6",
    latitude: null,
    longitude: null,
    likes_count: 56,
    comments_count: 9,
    created_at: "2026-04-16T18:00:00Z",
  },
  {
    id: "p6",
    user_id: "u6",
    body: "今年仕込んだ味噌、3ヶ月経過。いい感じに熟成中🫘\n\n味噌づくりは「待つ」ことも仕事。\n完成は秋頃の予定です。予約受付中！",
    image_urls: [],
    embed: null,
    shop_id: "s7",
    latitude: null,
    longitude: null,
    likes_count: 38,
    comments_count: 5,
    created_at: "2026-04-15T11:00:00Z",
  },
  {
    id: "p7",
    user_id: "u8",
    body: "沖縄の海で録音してきました🎸🌊\n\n波の音をサンプリングして新曲制作中。\n自然の音って、本当にいい周波数してる。",
    image_urls: [],
    embed: null,
    shop_id: null,
    latitude: 26.3956,
    longitude: 127.7441,
    likes_count: 72,
    comments_count: 11,
    created_at: "2026-04-14T15:00:00Z",
  },
  {
    id: "p8",
    user_id: "u7",
    body: "楽市楽座デビューしました🌸\nまだ何もわからないけど、素敵な場所！\nよろしくお願いします。",
    image_urls: [],
    embed: null,
    shop_id: null,
    latitude: null,
    longitude: null,
    likes_count: 24,
    comments_count: 7,
    created_at: "2026-04-10T12:00:00Z",
  },
];

// ============================================================
// Mock Wishes
// ============================================================

export const mockWishes: Wish[] = [
  { id: "w1", user_id: "u3", item_name: "自然栽培のお米", note: "玄米希望", created_at: "2024-05-01T00:00:00Z" },
  { id: "w2", user_id: "u3", item_name: "手作り味噌", note: null, created_at: "2024-05-01T00:00:00Z" },
  { id: "w3", user_id: "u4", item_name: "陶芸の釉薬", note: "自然素材のもの", created_at: "2025-02-01T00:00:00Z" },
  { id: "w4", user_id: "u4", item_name: "子ども服（100cm）", note: null, created_at: "2025-06-01T00:00:00Z" },
  { id: "w5", user_id: "u7", item_name: "自然栽培のお米", note: null, created_at: "2026-04-10T00:00:00Z" },
  { id: "w6", user_id: "u7", item_name: "手作りアクセサリー", note: "木のもの", created_at: "2026-04-10T00:00:00Z" },
  { id: "w7", user_id: "u5", item_name: "天然塩", note: "沖縄産希望", created_at: "2025-01-01T00:00:00Z" },
];

// ============================================================
// Mock External Links
// ============================================================

export const mockExternalLinks: ExternalLink[] = [
  { id: "el1", user_id: "u1", platform: "youtube", url: "https://youtube.com/@mitsuro", sort_order: 0 },
  { id: "el2", user_id: "u1", platform: "ameblo", url: "https://ameblo.jp/mitsulow", sort_order: 1 },
  { id: "el3", user_id: "u1", platform: "instagram", url: "https://instagram.com/mitsuro", sort_order: 2 },
  { id: "el4", user_id: "u2", platform: "instagram", url: "https://instagram.com/hanako_kome", sort_order: 0 },
  { id: "el5", user_id: "u3", platform: "website", url: "https://kenji-seitai.example.com", sort_order: 0 },
  { id: "el6", user_id: "u5", platform: "instagram", url: "https://instagram.com/akari_yoga", sort_order: 0 },
  { id: "el7", user_id: "u8", platform: "youtube", url: "https://youtube.com/@ryo_music", sort_order: 0 },
  { id: "el8", user_id: "u8", platform: "x", url: "https://x.com/ryo_music", sort_order: 1 },
];

// ============================================================
// Mock Recommended Shops (external)
// ============================================================

export const mockRecommendedShops: RecommendedShop[] = [
  {
    id: "rs1",
    name: "自然食レストラン 大地",
    address: "東京都世田谷区北沢2-1-1",
    latitude: 35.6617,
    longitude: 139.6687,
    category: "food",
    description: "完全無農薬の野菜を使ったレストラン",
    created_at: "2026-01-01T00:00:00Z",
    recommendation_count: 12,
  },
  {
    id: "rs2",
    name: "ナチュラル整体 ほのか",
    address: "大阪府大阪市中央区1-2-3",
    latitude: 34.6937,
    longitude: 135.5023,
    category: "body",
    description: "自然治癒力を高める施術が評判",
    created_at: "2026-02-01T00:00:00Z",
    recommendation_count: 8,
  },
  {
    id: "rs3",
    name: "天然酵母パン工房 まるぱん",
    address: "北海道札幌市中央区南1条",
    latitude: 43.0621,
    longitude: 141.3544,
    category: "food",
    description: "国産小麦と天然酵母だけで作るパン",
    created_at: "2026-03-01T00:00:00Z",
    recommendation_count: 15,
  },
  {
    id: "rs4",
    name: "瞑想サロン 空",
    address: "京都府京都市左京区",
    latitude: 35.0393,
    longitude: 135.7899,
    category: "mind",
    description: "寺院の中にある瞑想スペース",
    created_at: "2026-03-15T00:00:00Z",
    recommendation_count: 6,
  },
];

export const mockRecommendations: Recommendation[] = [
  { id: "rec1", user_id: "u1", recommended_shop_id: "rs1", comment: "何度も通ってます。野菜が本物。", created_at: "2026-01-05T00:00:00Z" },
  { id: "rec2", user_id: "u3", recommended_shop_id: "rs1", comment: "患者さんにもおすすめしています", created_at: "2026-01-10T00:00:00Z" },
  { id: "rec3", user_id: "u5", recommended_shop_id: "rs4", comment: "月のリトリートで利用しました", created_at: "2026-03-20T00:00:00Z" },
];

// ============================================================
// Mock Chat
// ============================================================

export const mockChats: Chat[] = [
  {
    id: "c1",
    created_at: "2026-04-18T00:00:00Z",
    members: [mockProfiles[0], mockProfiles[1]],
    last_message: {
      id: "m3",
      chat_id: "c1",
      sender_id: "u2",
      body: "ありがとうございます！お米送りますね🌾",
      image_url: null,
      created_at: "2026-04-18T15:30:00Z",
      read_at: "2026-04-18T16:00:00Z",
    },
  },
  {
    id: "c2",
    created_at: "2026-04-15T00:00:00Z",
    members: [mockProfiles[0], mockProfiles[2]],
    last_message: {
      id: "m5",
      chat_id: "c2",
      sender_id: "u3",
      body: "来週の予約、確認しました。お待ちしています。",
      image_url: null,
      created_at: "2026-04-15T10:00:00Z",
      read_at: null,
    },
  },
];

export const mockMessages: Message[] = [
  {
    id: "m1",
    chat_id: "c1",
    sender_id: "u1",
    body: "花子さん、今年のコシヒカリはいつ頃から注文できますか？",
    image_url: null,
    created_at: "2026-04-18T14:00:00Z",
    read_at: "2026-04-18T14:05:00Z",
  },
  {
    id: "m2",
    chat_id: "c1",
    sender_id: "u2",
    body: "みつろうさん！9月頃の収穫を予定しています。予約入れておきましょうか？",
    image_url: null,
    created_at: "2026-04-18T14:30:00Z",
    read_at: "2026-04-18T15:00:00Z",
  },
  {
    id: "m3",
    chat_id: "c1",
    sender_id: "u1",
    body: "ぜひお願いします！10kg分。",
    image_url: null,
    created_at: "2026-04-18T15:00:00Z",
    read_at: "2026-04-18T15:30:00Z",
  },
  {
    id: "m4",
    chat_id: "c1",
    sender_id: "u2",
    body: "ありがとうございます！お米送りますね🌾",
    image_url: null,
    created_at: "2026-04-18T15:30:00Z",
    read_at: "2026-04-18T16:00:00Z",
  },
];

// ============================================================
// Helper functions
// ============================================================

export function getProfileByUsername(username: string): Profile | undefined {
  return mockProfiles.find((p) => p.username === username);
}

export function getShopsByOwnerId(ownerId: string): Shop[] {
  return mockShops.filter((s) => s.owner_id === ownerId);
}

export function getBadgesByUserId(userId: string): Badge[] {
  return mockBadges.filter((b) => b.user_id === userId);
}

export function getPostsByUserId(userId: string): Post[] {
  return mockPosts.filter((p) => p.user_id === userId);
}

export function getWishesByUserId(userId: string): Wish[] {
  return mockWishes.filter((w) => w.user_id === userId);
}

export function getExternalLinksByUserId(userId: string): ExternalLink[] {
  return mockExternalLinks.filter((l) => l.user_id === userId).sort((a, b) => a.sort_order - b.sort_order);
}

export function getPostsWithProfiles(): Post[] {
  return mockPosts
    .map((post) => ({
      ...post,
      profile: mockProfiles.find((p) => p.id === post.user_id),
      badges: mockBadges.filter((b) => b.user_id === post.user_id),
      shop: post.shop_id ? mockShops.find((s) => s.id === post.shop_id) : undefined,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
