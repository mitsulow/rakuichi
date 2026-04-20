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
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "x", label: "X", icon: "𝕏" },
  { id: "note", label: "note", icon: "📝" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "ameblo", label: "アメブロ", icon: "🅰️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "website", label: "サイト", icon: "🌐" },
] as const;

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;
