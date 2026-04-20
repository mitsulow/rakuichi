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
