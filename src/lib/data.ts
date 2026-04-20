import { createClient } from "@/lib/supabase/client";
import { getPostsWithProfiles as getMockPostsWithProfiles } from "@/lib/mock-data";
import type { Post, OGPEmbed } from "@/lib/types";

/**
 * Fetch posts with joined profile and badge data from Supabase.
 * Falls back to mock data if Supabase is not configured or returns no posts.
 */
export async function fetchPosts(): Promise<Post[]> {
  try {
    const supabase = createClient();

    // Fetch posts with profile join
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profile:profiles(*)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetchPosts error:", error.message);
      return getMockPostsWithProfiles();
    }

    if (!data || data.length === 0) {
      return getMockPostsWithProfiles();
    }

    // Collect unique user_ids to fetch badges
    const userIds = [...new Set(data.map((row: any) => row.user_id))];

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .in("user_id", userIds);

    const badgesByUser = new Map<string, any[]>();
    for (const badge of badgesData ?? []) {
      const existing = badgesByUser.get(badge.user_id) ?? [];
      existing.push(badge);
      badgesByUser.set(badge.user_id, existing);
    }

    // Map to our Post type shape
    return data.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      body: row.body,
      image_urls: row.image_urls ?? [],
      embed: row.embed ?? null,
      shop_id: row.shop_id ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      likes_count: row.likes_count ?? 0,
      comments_count: row.comments_count ?? 0,
      created_at: row.created_at,
      profile: row.profile ?? undefined,
      badges: badgesByUser.get(row.user_id) ?? [],
      shop: undefined, // TODO: join shops if needed
    }));
  } catch (e) {
    console.error("fetchPosts unexpected error:", e);
    return getMockPostsWithProfiles();
  }
}

/**
 * Insert a new post. Returns the inserted post or null on failure.
 */
export async function createPost(body: string, userId: string, embed?: OGPEmbed | null): Promise<Post | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      body,
      image_urls: [],
      embed: embed ?? null,
      likes_count: 0,
      comments_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("createPost error:", error.message);
    return null;
  }

  return data as Post;
}

/**
 * Toggle a like on a post. Returns the new liked state.
 */
export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<{ liked: boolean; error?: string }> {
  const supabase = createClient();

  if (currentlyLiked) {
    // Remove like
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) {
      console.error("toggleLike delete error:", error.message);
      return { liked: true, error: error.message };
    }

    // likes_count is updated automatically by DB trigger
    return { liked: false };
  } else {
    // Insert like
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: userId, post_id: postId });

    if (error) {
      console.error("toggleLike insert error:", error.message);
      return { liked: false, error: error.message };
    }

    // likes_count is updated automatically by DB trigger
    return { liked: true };
  }
}

/**
 * Check which posts the current user has liked.
 */
export async function getUserLikes(userId: string, postIds: string[]): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();

  const supabase = createClient();

  const { data, error } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) {
    console.error("getUserLikes error:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row: any) => row.post_id));
}

/**
 * Fetch a profile by user ID from Supabase.
 */
export async function fetchProfile(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("fetchProfile error:", error.message);
    return null;
  }
  return data;
}

/**
 * Update a profile in Supabase.
 */
export async function updateProfile(userId: string, fields: {
  display_name?: string;
  bio?: string;
  story?: string;
  status_line?: string;
  prefecture?: string;
  city?: string;
  rice_work?: string;
  life_work?: string;
  life_work_years?: number | null;
  life_work_level?: string;
  migration_percent?: number;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("updateProfile error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Fetch a profile by username from Supabase.
 */
export async function fetchProfileByUsername(username: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("fetchProfileByUsername error:", error.message);
    return null;
  }
  return data;
}

/**
 * Fetch badges for a user.
 */
export async function fetchBadges(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("badges").select("*").eq("user_id", userId);
  return data ?? [];
}

/**
 * Fetch posts by a specific user.
 */
export async function fetchPostsByUser(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

/**
 * Fetch external links for a user.
 */
export async function fetchExternalLinks(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("external_links")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/**
 * Sum up the total seeds (likes) received across all posts by a user.
 */
export async function fetchTotalSeeds(userId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("likes_count")
    .eq("user_id", userId);
  if (!data) return 0;
  return data.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
}

/**
 * Fetch shops owned by a user.
 */
export async function fetchShopsByOwner(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("shops").select("*").eq("owner_id", userId);
  return data ?? [];
}

/**
 * Fetch wishes for a user.
 */
export async function fetchWishes(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("wishes").select("*").eq("user_id", userId);
  return data ?? [];
}

// ============================================================
// Shops CRUD
// ============================================================

export interface ShopInput {
  category: string;
  name: string;
  description?: string | null;
  price_text?: string | null;
  price_jpy?: number | null;
  is_trial?: boolean;
  accepts_barter?: boolean;
  accepts_tip?: boolean;
  image_urls?: string[];
}

export async function createShop(ownerId: string, input: ShopInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .insert({
      owner_id: ownerId,
      category: input.category,
      name: input.name,
      description: input.description ?? null,
      price_text: input.price_text ?? null,
      price_jpy: input.price_jpy ?? null,
      is_trial: input.is_trial ?? false,
      accepts_barter: input.accepts_barter ?? true,
      accepts_tip: input.accepts_tip ?? false,
      image_urls: input.image_urls ?? [],
    })
    .select()
    .single();
  if (error) {
    console.error("createShop error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function updateShop(shopId: string, input: Partial<ShopInput>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", shopId)
    .select()
    .single();
  if (error) {
    console.error("updateShop error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Fetch all shops with owner profiles joined.
 * Optionally filter by category.
 */
export async function fetchAllShops(category?: string | null) {
  const supabase = createClient();
  let query = supabase
    .from("shops")
    .select("*, owner:profiles!shops_owner_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) {
    console.error("fetchAllShops error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function deleteShop(shopId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("shops").delete().eq("id", shopId);
  if (error) {
    console.error("deleteShop error:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

// ============================================================
// Chats
// ============================================================

/**
 * Find or create a 1-on-1 chat with another user. Returns chat ID.
 */
export async function findOrCreateChat(otherUserId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("find_or_create_chat", {
    other_user_id: otherUserId,
  });
  if (error) {
    console.error("findOrCreateChat error:", error.message);
    return null;
  }
  return data;
}

/**
 * Fetch chat list for current user with last message and other member profile.
 */
export async function fetchUserChats(userId: string) {
  const supabase = createClient();
  const { data: memberships } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", userId);
  if (!memberships || memberships.length === 0) return [];
  const chatIds = memberships.map((m) => m.chat_id);

  const { data: chats } = await supabase
    .from("chats")
    .select("*, members:chat_members(user:profiles(*)), messages(id, body, created_at, sender_id, read_at)")
    .in("id", chatIds)
    .order("created_at", { ascending: false });

  if (!chats) return [];

  return chats.map((c: { id: string; created_at: string; members?: { user: unknown }[]; messages?: { id: string; body: string; created_at: string; sender_id: string; read_at: string | null }[] }) => {
    const otherMembers = (c.members ?? [])
      .map((m) => m.user)
      .filter((u: unknown) => u && typeof u === "object" && "id" in u && (u as { id: string }).id !== userId);
    const sortedMsgs = [...(c.messages ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      id: c.id,
      created_at: c.created_at,
      other: otherMembers[0] ?? null,
      last_message: sortedMsgs[0] ?? null,
    };
  });
}

export async function fetchChatMessages(chatId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, sender:profiles(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function sendMessage(chatId: string, senderId: string, body: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, body })
    .select("*, sender:profiles(*)")
    .single();
  if (error) {
    console.error("sendMessage error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function fetchChatMembers(chatId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_members")
    .select("user:profiles(*)")
    .eq("chat_id", chatId);
  return (data ?? []).map((m) => m.user);
}

// ============================================================
// Trade proposals
// ============================================================

export interface TradeProposalInput {
  chatId: string;
  proposerId: string;
  recipientId: string;
  shopId?: string | null;
  tradeType: "cash" | "barter" | "tip";
  amountJpy?: number | null;
  barterOffer?: string | null;
  note?: string | null;
}

export async function createTradeProposal(input: TradeProposalInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trade_proposals")
    .insert({
      chat_id: input.chatId,
      proposer_id: input.proposerId,
      recipient_id: input.recipientId,
      shop_id: input.shopId ?? null,
      trade_type: input.tradeType,
      amount_jpy: input.amountJpy ?? null,
      barter_offer: input.barterOffer ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("createTradeProposal error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function respondToTradeProposal(
  proposalId: string,
  status: "accepted" | "rejected" | "cancelled"
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trade_proposals")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", proposalId)
    .select()
    .single();
  if (error) {
    console.error("respondToTradeProposal error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function markTradeCompleted(proposalId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("trade_proposals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", proposalId);
  if (error) {
    console.error("markTradeCompleted error:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function fetchChatProposals(chatId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("trade_proposals")
    .select("*, shop:shops(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// ============================================================
// Trade records (交換日記)
// ============================================================

export async function createTradeRecord(
  authorId: string,
  partnerId: string,
  title: string,
  diary: string,
  proposalId?: string | null
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trade_records")
    .insert({
      author_id: authorId,
      partner_id: partnerId,
      title,
      diary,
      proposal_id: proposalId ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("createTradeRecord error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function fetchUserTradeRecords(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("trade_records")
    .select("*, author:profiles!trade_records_author_id_fkey(*), partner:profiles!trade_records_partner_id_fkey(*)")
    .or(`author_id.eq.${userId},partner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return data ?? [];
}
