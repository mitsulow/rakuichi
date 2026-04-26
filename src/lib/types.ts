import type { CategoryId, BadgeTypeId } from "./constants";

export interface Profile {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  story: string | null;
  status_line: string | null;
  prefecture: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_paid: boolean;
  paid_since: string | null;
  rice_work: string | null;
  life_work: string | null;
  life_work_years: number | null;
  life_work_level: "修行中" | "歩み中" | "一人前" | null;
  migration_percent: number;
  show_on_map: boolean;
  skills: string[];
  wants_to_do: string[];
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  category: CategoryId;
  subcategory: string | null;
  name: string;
  description: string | null;
  price_text: string | null;
  price_jpy: number | null;
  is_trial: boolean;
  accepts_barter: boolean;
  accepts_tip: boolean;
  delivery_methods: string[];
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface TradeProposal {
  id: string;
  chat_id: string;
  proposer_id: string;
  recipient_id: string;
  shop_id: string | null;
  trade_type: "cash" | "barter" | "tip";
  amount_jpy: number | null;
  barter_offer: string | null;
  note: string | null;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
}

export interface TradeRecord {
  id: string;
  proposal_id: string | null;
  author_id: string;
  partner_id: string;
  title: string;
  diary: string;
  created_at: string;
  author?: Profile;
  partner?: Profile;
}

export interface Callout {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  needed_skills: string[];
  prefecture: string | null;
  status: "open" | "closed" | "completed";
  closes_at: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  author?: Profile | null;
  participant_count?: number;
  user_has_joined?: boolean;
}

export interface CalloutParticipant {
  callout_id: string;
  user_id: string;
  comment: string | null;
  joined_at: string;
  profile?: Profile | null;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  apprentice_id: string;
  craft: string | null;
  status: "pending" | "active" | "graduated" | "declined";
  proposed_by: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  mentor?: Profile;
  apprentice?: Profile;
}

export interface WeeklyPickup {
  id: string;
  week_start: string;
  user_id: string;
  reason: string | null;
  sort_order: number;
  user?: Profile;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeTypeId;
  granted_at: string;
  granted_by: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  body: string;
  image_urls: string[];
  embed: OGPEmbed | null;
  shop_id: string | null;
  latitude: number | null;
  longitude: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // joined fields
  profile?: Profile;
  badges?: Badge[];
  shop?: Shop;
}

export interface OGPEmbed {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platform?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface Wish {
  id: string;
  user_id: string;
  item_name: string;
  note: string | null;
  created_at: string;
}

export interface ExternalLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  sort_order: number;
}

export interface RecommendedShop {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string; // natural_food, alt_medicine, natural_therapy, natural_goods, natural_cafe
  description: string | null;
  image_url: string | null;
  phone: string | null;
  website: string | null;
  prefecture: string | null;
  city: string | null;
  added_by: string | null;
  is_seed: boolean;
  created_at: string;
  recommendation_count?: number;
}

export interface Recommendation {
  id: string;
  user_id: string;
  recommended_shop_id: string;
  comment: string | null;
  created_at: string;
}

export interface Chat {
  id: string;
  created_at: string;
  members?: Profile[];
  last_message?: Message;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
  sender?: Profile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
