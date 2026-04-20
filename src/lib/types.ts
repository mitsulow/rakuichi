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
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  category: CategoryId;
  name: string;
  description: string | null;
  price_text: string | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
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
  category: CategoryId;
  description: string | null;
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
