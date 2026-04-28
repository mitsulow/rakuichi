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
    // Unique username: base + short random suffix to avoid collisions
    const base = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_-]/g, "");
    const username = `${base || "user"}_${userId.slice(0, 6)}`;
    await supabase.from("profiles").upsert(
      {
        id: userId,
        username,
        display_name: name,
        email,
        avatar_url: session?.user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
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
 * Fetch a single post by id, with profile joined (and badges).
 * Robust to missing profile (fetches separately, doesn't 404 if join fails).
 */
export async function fetchPostById(postId: string): Promise<Post | null> {
  const supabase = createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (error) {
    console.error("fetchPostById error:", error.message);
    return null;
  }
  if (!post) return null;

  const [{ data: profile }, { data: badges }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", post.user_id)
      .maybeSingle(),
    supabase.from("badges").select("*").eq("user_id", post.user_id),
  ]);

  return {
    ...post,
    profile: (profile ?? undefined) as Post["profile"],
    badges: (badges ?? []) as Post["badges"],
  } as Post;
}

/**
 * Fetch comments for a post, newest first, with author profile joined.
 */
export async function fetchComments(postId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, profile:profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createComment(
  postId: string,
  userId: string,
  body: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, body })
    .select("*, profile:profiles(*)")
    .single();
  if (error) {
    console.error("createComment error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) {
    console.error("deleteComment error:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Delete own post. Owner-only via RLS.
 */
export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("deletePost error:", error.message);
    return { error: error.message };
  }
  return { error: null };
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
  skills?: string[];
  wants_to_do?: string[];
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
      "skills",
      "wants_to_do",
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
// この指とまれ (callouts) — open call to gather hands
// ============================================================

export interface CalloutInput {
  title: string;
  body?: string | null;
  needed_skills?: string[];
  prefecture?: string | null;
  closes_at?: string | null;
}

export async function fetchCallouts(options?: {
  status?: "open" | "closed" | "completed" | "all";
  limit?: number;
  prefecture?: string | null;
  skill?: string | null;
}) {
  const supabase = createClient();
  let query = supabase
    .from("callouts")
    .select(
      "*, author:profiles!callouts_user_id_fkey(*), participants:callout_participants(user_id)"
    )
    .order("created_at", { ascending: false });
  const status = options?.status ?? "open";
  if (status !== "all") query = query.eq("status", status);
  if (options?.prefecture) query = query.eq("prefecture", options.prefecture);
  if (options?.skill) query = query.contains("needed_skills", [options.skill]);
  if (options?.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) {
    console.error("fetchCallouts error:", error.message);
    return [];
  }
  // Reshape participants → participant_count
  return (data ?? []).map((row) => {
    const participants = (row as { participants?: Array<{ user_id: string }> })
      .participants;
    return {
      ...(row as Record<string, unknown>),
      participant_count: participants?.length ?? 0,
    };
  });
}

export async function fetchCalloutById(id: string, currentUserId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("callouts")
    .select(
      "*, author:profiles!callouts_user_id_fkey(*), participants:callout_participants(user_id, comment, joined_at, profile:profiles!callout_participants_user_id_fkey(*))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("fetchCalloutById error:", error.message);
    return null;
  }
  if (!data) return null;
  const participants = (data as { participants?: Array<{ user_id: string }> })
    .participants ?? [];
  return {
    ...(data as Record<string, unknown>),
    participant_count: participants.length,
    user_has_joined: currentUserId
      ? participants.some((p) => p.user_id === currentUserId)
      : false,
  };
}

export async function createCallout(userId: string, input: CalloutInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("callouts")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      needed_skills: input.needed_skills ?? [],
      prefecture: input.prefecture ?? null,
      closes_at: input.closes_at ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("createCallout error:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function deleteCallout(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("callouts").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function joinCallout(
  calloutId: string,
  userId: string,
  comment?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("callout_participants").insert({
    callout_id: calloutId,
    user_id: userId,
    comment: comment ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function leaveCallout(calloutId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("callout_participants")
    .delete()
    .eq("callout_id", calloutId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function setCalloutStatus(
  id: string,
  status: "open" | "closed" | "completed"
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("callouts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

// ============================================================
// Profile suggestions — "おすすめのむらびと"
// ============================================================

export async function fetchProfileSuggestions(
  excludeUserId: string | null,
  limit = 6
) {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .not("life_work", "is", null)
    .not("avatar_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit * 4);
  if (excludeUserId) query = query.neq("id", excludeUserId);
  const { data } = await query;
  if (!data) return [];
  // Already-followed: filter client side (fetch follower's following list)
  let followingSet = new Set<string>();
  if (excludeUserId) {
    const ids = await fetchFollowingIds(excludeUserId);
    followingSet = new Set(ids);
  }
  return data
    .filter((p) => !followingSet.has((p as { id: string }).id))
    .slice(0, limit);
}

// ============================================================
// follow (フォロー)
// ============================================================

export async function followUser(followerId: string, followingId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function isFollowing(followerId: string, followingId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  return (data ?? []).map((row) => (row as { following_id: string }).following_id);
}

export async function fetchFollowCounts(userId: string) {
  const supabase = createClient();
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

// ============================================================
// Notifications
// ============================================================

export async function fetchNotifications(userId: string, limit = 40) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchNotifications error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchUnreadNotificationCount(userId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    console.error("fetchUnreadNotificationCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }
  const { error } = await query;
  if (error) return { error: error.message };
  return { error: null };
}

// ============================================================
// Global search across types
// ============================================================

export async function searchProfilesByText(term: string, limit = 20) {
  const supabase = createClient();
  const t = term.trim();
  if (!t) return [];
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(
      `display_name.ilike.%${t}%,life_work.ilike.%${t}%,bio.ilike.%${t}%`
    )
    .limit(limit);
  return data ?? [];
}

export async function searchShopsByText(term: string, limit = 20) {
  const supabase = createClient();
  const t = term.trim();
  if (!t) return [];
  const { data } = await supabase
    .from("shops")
    .select("*, owner:profiles!shops_owner_id_fkey(*)")
    .or(`name.ilike.%${t}%,description.ilike.%${t}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function searchCalloutsByText(term: string, limit = 20) {
  const supabase = createClient();
  const t = term.trim();
  if (!t) return [];
  const { data } = await supabase
    .from("callouts")
    .select("*, author:profiles!callouts_user_id_fkey(*)")
    .or(`title.ilike.%${t}%,body.ilike.%${t}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ============================================================
// Skill search — find people by what they can do
// ============================================================

/**
 * Profiles whose `skills` array contains the given skill (exact match,
 * case-insensitive). Returns up to `limit` rows ordered by recency.
 */
export async function searchProfilesBySkill(skill: string, limit = 50) {
  const supabase = createClient();
  const trimmed = skill.trim();
  if (!trimmed) return [];
  // Try exact array contains first (fast, GIN-indexed)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .contains("skills", [trimmed])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("searchProfilesBySkill error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Pull every profile.skills array, flatten, count occurrences, and return
 * the top N most-registered skills with their counts. Used to power the
 * "popular skills" suggestions on the search page.
 */
export async function fetchPopularSkills(topN = 24) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("skills")
    .not("skills", "is", null);
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    const arr = (row as { skills: string[] | null }).skills ?? [];
    for (const s of arr) {
      const key = s.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([skill, count]) => ({ skill, count }));
}

// ============================================================
// Shops CRUD
// ============================================================

export interface ShopInput {
  category: string;
  subcategory?: string | null;
  name: string;
  description?: string | null;
  price_text?: string | null;
  price_jpy?: number | null;
  is_trial?: boolean;
  accepts_barter?: boolean;
  accepts_tip?: boolean;
  delivery_methods?: string[];
  image_urls?: string[];
}

export async function createShop(ownerId: string, input: ShopInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .insert({
      owner_id: ownerId,
      category: input.category,
      subcategory: input.subcategory ?? null,
      name: input.name,
      description: input.description ?? null,
      price_text: input.price_text ?? null,
      price_jpy: input.price_jpy ?? null,
      is_trial: input.is_trial ?? false,
      accepts_barter: input.accepts_barter ?? true,
      accepts_tip: input.accepts_tip ?? false,
      delivery_methods: input.delivery_methods ?? [],
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

/**
 * Fetch a single recommended shop by id.
 */
export async function fetchRecommendedShopById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recommended_shops")
    .select("*, recommendations(id, user_id, comment, created_at, profile:profiles(*))")
    .eq("id", id)
    .single();
  if (error || !data) {
    console.error("fetchRecommendedShopById error:", error?.message);
    return null;
  }
  return data;
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
 * Fetch a single shop by id, with owner profile joined.
 */
export async function fetchShopById(shopId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*, owner:profiles!shops_owner_id_fkey(*)")
    .eq("id", shopId)
    .single();
  if (error) {
    console.error("fetchShopById error:", error.message);
    return null;
  }
  return data;
}

/**
 * Fetch all shops with owner profiles joined.
 * Optionally filter by category.
 */
export const SHOPS_PAGE_SIZE = 20;

export async function fetchAllShops(
  category?: string | null,
  page = 0,
  pageSize = SHOPS_PAGE_SIZE,
  prefectures?: string[] | null,
  subcategory?: string | null
) {
  const supabase = createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // If we need to filter by prefectures, use inner join so Supabase can filter on joined column
  const select = prefectures && prefectures.length > 0
    ? "*, owner:profiles!shops_owner_id_fkey!inner(*)"
    : "*, owner:profiles!shops_owner_id_fkey(*)";

  let query = supabase
    .from("shops")
    .select(select, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (category) query = query.eq("category", category);
  if (subcategory) query = query.eq("subcategory", subcategory);
  if (prefectures && prefectures.length > 0) {
    query = query.in("owner.prefecture", prefectures);
  }
  const { data, error, count } = await query;
  if (error) {
    console.error("fetchAllShops error:", error.message);
    return { shops: [], total: 0 };
  }
  return { shops: data ?? [], total: count ?? 0 };
}

/**
 * Fetch posts (情緒) with owner prefecture filter + pagination.
 */
export const POSTS_PAGE_SIZE = 20;

export async function fetchPostsPaged(
  page = 0,
  pageSize = POSTS_PAGE_SIZE,
  prefectures?: string[] | null,
  random = false,
  searchTerm?: string | null,
  restrictUserIds?: string[] | null
) {
  const supabase = createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Step 1: fetch posts (with a separate profiles lookup below so a missing
  // join never filters out a post).
  let postsQuery = supabase
    .from("posts")
    .select("*", { count: "estimated" });

  // Free-text search on body
  const term = searchTerm?.trim();
  if (term) {
    postsQuery = postsQuery.ilike("body", `%${term}%`);
  }

  // Restrict by author IDs (e.g. "following only" feed)
  if (restrictUserIds && restrictUserIds.length > 0) {
    postsQuery = postsQuery.in("user_id", restrictUserIds);
  } else if (restrictUserIds && restrictUserIds.length === 0) {
    // Following empty → return nothing (caller already wants restricted set)
    return { posts: [], total: 0 };
  }

  if (!random) {
    postsQuery = postsQuery.order("created_at", { ascending: false }).range(from, to);
  } else {
    postsQuery = postsQuery.order("created_at", { ascending: false }).limit(100);
  }

  const { data: rawPosts, error, count } = await postsQuery;
  if (error) {
    console.error("fetchPostsPaged error:", error.message);
    return { posts: [], total: 0 };
  }

  let posts = (rawPosts ?? []) as Array<{
    id: string;
    user_id: string;
    [k: string]: unknown;
  }>;

  // Step 2: fetch all unique profiles in one query
  const userIds = Array.from(new Set(posts.map((p) => p.user_id)));
  const profilesById = new Map<string, unknown>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
    for (const p of profs ?? []) {
      profilesById.set((p as { id: string }).id, p);
    }
  }

  // Step 3: attach profile; if prefecture filter set, filter here
  let enriched = posts.map((p) => ({
    ...p,
    profile: profilesById.get(p.user_id) ?? null,
  }));

  if (prefectures && prefectures.length > 0) {
    const set = new Set(prefectures);
    enriched = enriched.filter((p) => {
      const prof = p.profile as { prefecture?: string | null } | null;
      return prof?.prefecture && set.has(prof.prefecture);
    });
  }

  if (random) {
    enriched = [...enriched].sort(() => Math.random() - 0.5).slice(0, pageSize);
  }

  return { posts: enriched, total: count ?? enriched.length };
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

/**
 * Count unread messages — messages newer than the user's locally-stored
 * "last read" timestamp for each chat they're in, sent by someone else.
 *
 * Client-side tracking (via localStorage) so it works without requiring
 * the server-side read_at UPDATE policy. Attempts the server update as a
 * best-effort side-effect but doesn't depend on it.
 */
export async function fetchUnreadMessageCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { data: memberships } = await supabase
    .from("chat_members")
    .select("chat_id, joined_at")
    .eq("user_id", userId);
  const rows = memberships ?? [];
  if (rows.length === 0) return 0;

  const chatIds = rows.map((m) => m.chat_id);
  const joinedAt = new Map<string, string>(
    rows.map((m) => [m.chat_id as string, m.joined_at as string])
  );

  // Pull recent incoming messages across all my chats
  const { data: messages } = await supabase
    .from("messages")
    .select("chat_id, created_at")
    .in("chat_id", chatIds)
    .neq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!messages) return 0;

  let count = 0;
  for (const m of messages) {
    const chatId = m.chat_id as string;
    const createdAt = m.created_at as string;
    let lastRead: string | null = null;
    try {
      lastRead = localStorage.getItem(`rakuichi:lastRead:${chatId}`);
    } catch {
      // storage blocked — treat as never-read, count will be high but not broken
    }
    const threshold = lastRead ?? joinedAt.get(chatId) ?? "1970-01-01";
    if (createdAt > threshold) count++;
  }
  return count;
}

/**
 * Mark a chat as read — records a local timestamp (works without server UPDATE
 * policy) and also best-effort updates the server if allowed.
 */
export async function markChatRead(chatId: string, userId: string) {
  try {
    localStorage.setItem(
      `rakuichi:lastRead:${chatId}`,
      new Date().toISOString()
    );
  } catch {
    // storage unavailable
  }
  // Also dispatch a custom event so BottomNav can refresh immediately
  try {
    window.dispatchEvent(new CustomEvent("rakuichi:unreadRefresh"));
  } catch {}
  // Best-effort server update; ignored if RLS blocks
  const supabase = createClient();
  supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", userId)
    .is("read_at", null)
    .then(() => {});
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
      reason: "今週の活発なむらびと",
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
