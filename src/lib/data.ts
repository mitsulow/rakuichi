import { createClient } from "@/lib/supabase/client";
import type { Post, OGPEmbed, Profile } from "@/lib/types";

/**
 * Fetch posts with joined profile and badge data from Supabase.
 * Falls back to mock data if Supabase is not configured or returns no posts.
 */
export async function fetchPosts(): Promise<Post[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profile:profiles(*)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchPosts error:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: badgesData } = await supabase
    .from("badges")
    .select("*")
    .in("user_id", userIds);

  const badgesByUser = new Map<string, unknown[]>();
  for (const badge of badgesData ?? []) {
    const existing = badgesByUser.get(badge.user_id) ?? [];
    existing.push(badge);
    badgesByUser.set(badge.user_id, existing);
  }

  return data.map((row) => ({
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
    badges: (badgesByUser.get(row.user_id) ?? []) as Post["badges"],
    shop: undefined,
  }));
}

/**
 * Insert a new post. Returns { post, error } — caller gets detail on failure.
 */
export async function createPost(
  body: string,
  userId: string,
  embed?: OGPEmbed | null,
  imageUrls: string[] = []
): Promise<{ post: Post | null; error: string | null }> {
  const supabase = createClient();

  // Ensure the profile row exists (important: FK reference posts.user_id -> profiles.id)
  // Older users whose trigger didn't fire won't have a profile; create one lazily.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user.email ?? "";
    const name =
      session?.user.user_metadata?.full_name ??
      session?.user.user_metadata?.name ??
      email.split("@")[0] ??
      "ユーザー";
    const username = email.split("@")[0] || userId.slice(0, 8);
    await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: name,
      email,
      avatar_url: session?.user.user_metadata?.avatar_url ?? null,
    });
  }

  // Insert with a timeout to prevent infinite spinner
  const insertPromise = supabase
    .from("posts")
    .insert({
      user_id: userId,
      body,
      image_urls: imageUrls,
      embed: embed ?? null,
      likes_count: 0,
      comments_count: 0,
    })
    .select()
    .single();

  const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(
    (resolve) =>
      setTimeout(
        () => resolve({ data: null, error: { message: "タイムアウト（ネットワーク不調？）" } }),
        10000
      )
  );

  const { data, error } = (await Promise.race([insertPromise, timeoutPromise])) as
    | { data: Post; error: null }
    | { data: null; error: { message: string } };

  if (error) {
    console.error("createPost error:", error.message);
    return { post: null, error: error.message };
  }

  return { post: data as Post, error: null };
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
  avatar_url?: string | null;
  cover_url?: string | null;
  show_on_map?: boolean;
}) {
  const supabase = createClient();

  async function attemptUpdate(payload: Record<string, unknown>): Promise<{ data: unknown; error: string | null }> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  }

  // Try full update first. If Supabase errors due to missing columns, retry
  // after removing any keys the error mentions (defensive for un-migrated DBs).
  const payload: Record<string, unknown> = { ...fields };
  let result = await attemptUpdate(payload);

  // Retry dropping potentially-new columns if update failed
  if (result.error) {
    const missingColumnPatterns = [
      "migration_percent",
      "avatar_url",
      "cover_url",
      "show_on_map",
    ];
    let dropped = false;
    for (const col of missingColumnPatterns) {
      if (result.error.toLowerCase().includes(col) && col in payload) {
        delete payload[col];
        dropped = true;
      }
    }
    if (dropped) {
      result = await attemptUpdate(payload);
    }
  }

  if (result.error) {
    console.error("updateProfile error:", result.error);
  }
  return result;
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
 * Replace all of a user's external links with the given list.
 * Deletes existing links and inserts new ones in order.
 */
export async function replaceExternalLinks(
  userId: string,
  links: Array<{ platform: string; url: string }>
) {
  const supabase = createClient();
  // Delete all existing
  const { error: delErr } = await supabase
    .from("external_links")
    .delete()
    .eq("user_id", userId);
  if (delErr) {
    console.error("replaceExternalLinks delete error:", delErr.message);
    return { error: delErr.message };
  }
  if (links.length === 0) return { error: null };

  const rows = links
    .filter((l) => l.url.trim().length > 0)
    .map((l, i) => ({
      user_id: userId,
      platform: l.platform,
      url: l.url.trim(),
      sort_order: i,
    }));
  if (rows.length === 0) return { error: null };

  const { error: insErr } = await supabase.from("external_links").insert(rows);
  if (insErr) {
    console.error("replaceExternalLinks insert error:", insErr.message);
    return { error: insErr.message };
  }
  return { error: null };
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
 * Fetch all profiles that have lat/long set AND show_on_map=true, with their shops.
 */
export async function fetchMapVillageShops() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, shops(*)")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .eq("show_on_map", true);
  if (!profiles) return [];
  return profiles
    .filter((p) => Array.isArray(p.shops) && p.shops.length > 0)
    .map((p) => ({ profile: p as Profile, shops: p.shops }));
}

// ============================================================
// Aspirations (私もやってみたい)
// ============================================================

export async function fetchAspirationCount(inspirerId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("aspirations")
    .select("id", { count: "exact", head: true })
    .eq("inspirer_id", inspirerId);
  return count ?? 0;
}

export async function hasAspired(
  inspiredId: string,
  inspirerId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("aspirations")
    .select("id")
    .eq("inspired_id", inspiredId)
    .eq("inspirer_id", inspirerId)
    .maybeSingle();
  return !!data;
}

export async function toggleAspiration(
  inspiredId: string,
  inspirerId: string,
  lifeWork?: string | null
): Promise<{ aspired: boolean }> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("aspirations")
    .select("id")
    .eq("inspired_id", inspiredId)
    .eq("inspirer_id", inspirerId)
    .maybeSingle();
  if (existing) {
    await supabase.from("aspirations").delete().eq("id", existing.id);
    return { aspired: false };
  }
  await supabase.from("aspirations").insert({
    inspired_id: inspiredId,
    inspirer_id: inspirerId,
    life_work: lifeWork ?? null,
  });
  return { aspired: true };
}

export async function fetchAspirers(inspirerId: string, limit = 6) {
  const supabase = createClient();
  const { data } = await supabase
    .from("aspirations")
    .select("inspired:profiles!aspirations_inspired_id_fkey(*)")
    .eq("inspirer_id", inspirerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => r.inspired as unknown as Profile);
}

// ============================================================
// Recommended shops (みんなの推薦店)
// ============================================================

export interface RecommendedShopInput {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  category: string;
  description?: string | null;
  image_url?: string | null;
  phone?: string | null;
  website?: string | null;
  prefecture?: string | null;
  city?: string | null;
}

export async function fetchRecommendedShops(options?: {
  category?: string | null;
  prefecture?: string | null;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from("recommended_shops")
    .select("*, recommendations(id)")
    .order("created_at", { ascending: false });
  if (options?.category) query = query.eq("category", options.category);
  if (options?.prefecture) query = query.eq("prefecture", options.prefecture);
  if (options?.limit) query = query.limit(options.limit);
  const { data } = await query;
  if (!data) return [];
  return data.map((r) => ({
    ...r,
    recommendation_count: Array.isArray(r.recommendations) ? r.recommendations.length : 0,
  }));
}

export async function createRecommendedShop(
  input: RecommendedShopInput,
  userId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recommended_shops")
    .insert({
      name: input.name,
      address: input.address ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      prefecture: input.prefecture ?? null,
      city: input.city ?? null,
      added_by: userId,
      is_seed: false,
    })
    .select()
    .single();
  if (error) {
    console.error("createRecommendedShop error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function toggleRecommendation(
  shopId: string,
  userId: string,
  comment?: string | null
) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("recommendations")
    .select("id")
    .eq("user_id", userId)
    .eq("recommended_shop_id", shopId)
    .maybeSingle();

  if (existing) {
    await supabase.from("recommendations").delete().eq("id", existing.id);
    return { recommended: false };
  }

  await supabase.from("recommendations").insert({
    user_id: userId,
    recommended_shop_id: shopId,
    comment: comment ?? null,
  });
  return { recommended: true };
}

export async function fetchUserRecommendations(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select("recommended_shop_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.recommended_shop_id));
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

// ============================================================
// Dashboard & rankings
// ============================================================

/**
 * Aggregate: total users, average migration_percent, users with active life work
 */
export async function fetchMigrationStats() {
  const supabase = createClient();
  const { data, count } = await supabase
    .from("profiles")
    .select("migration_percent", { count: "exact" });
  if (!data) return { total: 0, avg: 0, fullyMigrated: 0 };
  const total = count ?? data.length;
  const sum = data.reduce((s, p) => s + (p.migration_percent ?? 0), 0);
  const fullyMigrated = data.filter((p) => (p.migration_percent ?? 0) >= 100).length;
  return {
    total,
    avg: total > 0 ? Math.round(sum / total) : 0,
    fullyMigrated,
  };
}

/**
 * Top seed receivers (total likes across their posts).
 */
export async function fetchSeedRanking(limit = 10) {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("user_id, likes_count, profile:profiles(*)")
    .order("likes_count", { ascending: false });
  if (!data) return [];

  const map = new Map<string, { profile: Profile; total: number }>();
  for (const p of data) {
    const profile = p.profile as unknown as Profile | null;
    if (!profile) continue;
    const existing = map.get(p.user_id);
    if (existing) {
      existing.total += p.likes_count ?? 0;
    } else {
      map.set(p.user_id, { profile, total: p.likes_count ?? 0 });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Top exchangers (most completed trades).
 */
export async function fetchExchangeRanking(limit = 10) {
  const supabase = createClient();
  const { data } = await supabase
    .from("trade_records")
    .select("author_id, partner_id");
  if (!data) return [];

  const counts = new Map<string, number>();
  for (const r of data) {
    counts.set(r.author_id, (counts.get(r.author_id) ?? 0) + 1);
    counts.set(r.partner_id, (counts.get(r.partner_id) ?? 0) + 1);
  }

  const userIds = Array.from(counts.keys());
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const result = (profiles ?? [])
    .map((p) => ({ profile: p as Profile, total: counts.get(p.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return result;
}

/**
 * Top mentors (most active apprentices).
 */
export async function fetchMentorRanking(limit = 10) {
  const supabase = createClient();
  const { data } = await supabase
    .from("mentorships")
    .select("mentor_id, mentor:profiles!mentorships_mentor_id_fkey(*)")
    .eq("status", "active");
  if (!data) return [];

  const map = new Map<string, { profile: Profile; total: number }>();
  for (const m of data) {
    const mentor = m.mentor as unknown as Profile | null;
    if (!mentor) continue;
    const existing = map.get(m.mentor_id);
    if (existing) existing.total += 1;
    else map.set(m.mentor_id, { profile: mentor, total: 1 });
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ============================================================
// Weekly pickups (週イチ楽座)
// ============================================================

/**
 * Get the Monday of the current week as YYYY-MM-DD.
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

/**
 * Fetch pickups for the current week, falling back to newest posts owners if none set.
 */
export async function fetchCurrentWeekPickups() {
  const supabase = createClient();
  const weekStart = getCurrentWeekStart();
  const { data } = await supabase
    .from("weekly_pickups")
    .select("*, user:profiles(*)")
    .eq("week_start", weekStart)
    .order("sort_order", { ascending: true });
  if (data && data.length > 0) return data;

  // Fallback: 5 recent active users (by latest post)
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("user_id, profile:profiles(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!recentPosts) return [];
  const seen = new Set<string>();
  const fallback: { user: unknown; reason: string; sort_order: number }[] = [];
  for (const p of recentPosts) {
    if (seen.has(p.user_id) || fallback.length >= 5) continue;
    seen.add(p.user_id);
    fallback.push({
      user: p.profile,
      reason: "今週の活発な座の民",
      sort_order: fallback.length,
    });
  }
  return fallback;
}

// ============================================================
// Mentorships (師弟)
// ============================================================

export async function proposeMentorship(input: {
  mentorId: string;
  apprenticeId: string;
  proposedBy: string;
  craft?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mentorships")
    .insert({
      mentor_id: input.mentorId,
      apprentice_id: input.apprenticeId,
      proposed_by: input.proposedBy,
      craft: input.craft ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("proposeMentorship error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function respondMentorship(
  id: string,
  status: "active" | "declined" | "graduated"
) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "active") updates.started_at = new Date().toISOString();
  if (status === "graduated") updates.ended_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("mentorships")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("respondMentorship error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Fetch mentorships where the user is mentor or apprentice.
 */
export async function fetchUserMentorships(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("mentorships")
    .select("*, mentor:profiles!mentorships_mentor_id_fkey(*), apprentice:profiles!mentorships_apprentice_id_fkey(*)")
    .or(`mentor_id.eq.${userId},apprentice_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return data ?? [];
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
