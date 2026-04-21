export const CATEGORIES = [
  { id: "food", emoji: "🌾", label: "食", description: "自然栽培米、発酵食品、天然塩、無農薬野菜、手作り味噌、パン、お菓子" },
  { id: "craft", emoji: "🎨", label: "手仕事", description: "絵画、陶器、アクセサリー、木工、染物、手編み、革製品、映像・デザイン・プログラミング" },
  { id: "body", emoji: "💆", label: "からだ", description: "整体、マッサージ、鍼灸、ヨガ、気功、呼吸法" },
  { id: "mind", emoji: "🌿", label: "こころ", description: "占い、カウンセリング、スピリチュアル、瞑想指導、エネルギーワーク" },
  { id: "expression", emoji: "🎵", label: "表現", description: "音楽、歌、ダンス、演劇、DJ、詩" },
  { id: "learning", emoji: "📚", label: "学び", description: "講座、ワークショップ、コーチング、オンライン講座" },
  { id: "living", emoji: "🏡", label: "暮らし", description: "家、土地、DIY、農業指導、暮らしの相談" },
  { id: "moon", emoji: "🌙", label: "月と自然", description: "ツキヨガ、シューマン音©、月相に関わる活動、純正律、自然観察" },
  { id: "kids", emoji: "🍼", label: "こどもと", description: "助産、保育、子育て支援、子ども服" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const BADGE_TYPES = [
  { id: "verified", emoji: "✅", label: "本人確認済み", description: "身分証確認で付与" },
  { id: "sekaimura", emoji: "🏡", label: "セカイムラ住民", description: "セカイムラ／レイビレッジ現地に住んでいる" },
  { id: "mmm", emoji: "🌙", label: "MMMメンバー", description: "有料会員に自動付与" },
  { id: "mitsuro_certified", emoji: "🎓", label: "みつろう認定", description: "みつろうさんが直接認めた村人" },
  { id: "ichininmae", emoji: "🏆", label: "一人前", description: "運営認定、実績ベース" },
  { id: "newcomer", emoji: "🌱", label: "新人さん歓迎", description: "登録1ヶ月以内の村人" },
  { id: "specialist", emoji: "💎", label: "特技保持者", description: "希少な技術持ち、運営認定" },
] as const;

export type BadgeTypeId = (typeof BADGE_TYPES)[number]["id"];

export const LEVELS = [
  { id: "shugyochu", label: "修行中", description: "始めたばかり、これから伸びる人" },
  { id: "ayumichu", label: "歩み中", description: "中堅、着実に育っている人" },
  { id: "ichininmae", label: "一人前", description: "熟練、認定バッジあり" },
] as const;

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "note", label: "note" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "ameblo", label: "アメブロ" },
  { id: "line", label: "LINE" },
  { id: "threads", label: "Threads" },
  { id: "website", label: "ウェブサイト" },
] as const;

// ============================================================
// おすすめ店（自然派・本格派・ナチュラル）
// ============================================================
export const NATURAL_CATEGORIES = [
  {
    id: "natural_food",
    emoji: "🌾",
    label: "自然食",
    description: "自然栽培・オーガニック・マクロビ・発酵食品",
  },
  {
    id: "alt_medicine",
    emoji: "🪷",
    label: "代替医療",
    description: "整体・鍼灸・カイロプラクティック・漢方",
  },
  {
    id: "natural_therapy",
    emoji: "🌿",
    label: "自然療法",
    description: "アロマ・ホメオパシー・ハーブ・レイキ",
  },
  {
    id: "natural_goods",
    emoji: "🧺",
    label: "ナチュラル雑貨",
    description: "オーガニック衣料・木の玩具・自然素材",
  },
  {
    id: "natural_cafe",
    emoji: "☕",
    label: "自然派カフェ",
    description: "有機コーヒー・ヴィーガン・グルテンフリー",
  },
] as const;

export type NaturalCategoryId = (typeof NATURAL_CATEGORIES)[number]["id"];

export function getNaturalCategory(id: string) {
  return NATURAL_CATEGORIES.find((c) => c.id === id);
}

// ============================================================
// 楽市楽座の世界観 ── 用語辞書
// 一般的な言葉を楽市楽座らしい言葉に置き換える
// ============================================================
export const WORDS = {
  // アクション
  like: { label: "種をまく", past: "種をまいた", emoji: "🌱" },
  follow: { label: "のれんをくぐる", past: "のれんをくぐった", emoji: "🏮" },
  post: { label: "情緒を投げる", item: "情緒", emoji: "💭" },
  message: { label: "文を送る", item: "文（ふみ）", emoji: "📜" },
  trade: { label: "交換する", item: "交換", emoji: "🔄" },
  // モノ
  user: "座の民",
  profile: "MY座",
  shop: "屋台",
  chat: "文（ふみ）",
  review: "交換日記",
} as const;

// 🌱 種の成長ステージ（もらった種の数に応じて変化）
export const SEED_STAGES = [
  { min: 0, emoji: "🌱", label: "芽吹き", description: "種が芽を出したばかり" },
  { min: 10, emoji: "🌿", label: "若葉", description: "葉が広がってきた" },
  { min: 50, emoji: "🌷", label: "つぼみ", description: "花が咲く準備" },
  { min: 200, emoji: "🌸", label: "開花", description: "みんなに愛されている" },
  { min: 1000, emoji: "🌾", label: "実り", description: "豊かな実をつけた" },
] as const;

export function getSeedStage(count: number) {
  return [...SEED_STAGES].reverse().find((s) => count >= s.min) ?? SEED_STAGES[0];
}

// 移行度の段階ラベル
export function getMigrationLabel(percent: number): string {
  if (percent === 0) return "ライスワーク100%";
  if (percent < 25) return "一歩踏み出した";
  if (percent < 50) return "移行中";
  if (percent < 75) return "半分以上ライフワーク";
  if (percent < 100) return "もうすぐ完全移行";
  return "完全ライフワーク化！";
}

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;
