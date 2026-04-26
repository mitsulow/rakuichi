"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import {
  RegionFilter,
  regionToPrefectures,
  scopeLabel,
  type RegionScope,
} from "@/components/feed/RegionFilter";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPostsPaged,
  fetchFollowingIds,
  getUserLikes,
  deletePost,
  POSTS_PAGE_SIZE,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";

/**
 * 情緒 — store owners' tweets. Region filter + random mode.
 */
export default function PostsPage() {
  const { user, profile } = useAuth();
  const [scope, setScope] = useState<RegionScope>({ kind: "world" });
  const [random, setRandom] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [filterMode, setFilterMode] = useState<"all" | "following">("all");
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  // Start empty — older cached data may have been filtered. Always fetch fresh.
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // No auto-prefecture filter on mount — user chooses explicitly.

  // Re-fetch on scope/random change
  useEffect(() => {
    let cancelled = false;
    // Generous failsafe — cold-starting Supabase can take 10-20s
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 15000);

    setLoading(true);
    setPage(0);
    const prefectures = regionToPrefectures(scope);

    (async () => {
      try {
        let restrictUserIds: string[] | null = null;
        if (filterMode === "following" && user) {
          let ids = followingIds;
          if (ids == null) {
            ids = await fetchFollowingIds(user.id);
            if (!cancelled) setFollowingIds(ids);
          }
          restrictUserIds = ids;
        }
        const { posts: list, total } = await fetchPostsPaged(
          0,
          POSTS_PAGE_SIZE,
          prefectures,
          random,
          searchTerm,
          restrictUserIds
        );
        if (cancelled) return;
        setPosts(list as Post[]);
        setTotal(total);
        if (user && (list as Post[]).length > 0) {
          const ids = (list as Post[]).map((p) => p.id);
          const likes = await getUserLikes(user.id, ids);
          if (!cancelled) setLikedPostIds(likes);
        }
      } catch (e) {
        console.error("Posts fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [scope, random, user, searchTerm, filterMode, followingIds]);

  const canLoadMore = !random && posts.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const prefectures = regionToPrefectures(scope);
    const restrictUserIds =
      filterMode === "following" && user ? followingIds : null;
    const { posts: more } = await fetchPostsPaged(
      nextPage,
      POSTS_PAGE_SIZE,
      prefectures,
      false,
      searchTerm,
      restrictUserIds
    );
    setPosts((prev) => [...prev, ...(more as Post[])]);
    setPage(nextPage);
    setLoadingMore(false);
  }, [
    loadingMore,
    canLoadMore,
    page,
    scope,
    searchTerm,
    filterMode,
    followingIds,
    user,
  ]);

  // Realtime: track new posts arriving while user is viewing
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const newPost = payload.new as { user_id?: string };
          // Don't count the user's own new posts (already prepended via composer)
          if (newPost?.user_id && newPost.user_id !== user?.id) {
            setNewPostsCount((c) => c + 1);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshNewPosts = async () => {
    const prefectures = regionToPrefectures(scope);
    const { posts: list, total } = await fetchPostsPaged(
      0,
      POSTS_PAGE_SIZE,
      prefectures,
      random,
      searchTerm
    );
    setPosts(list as Post[]);
    setTotal(total);
    setPage(0);
    setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, posts.length]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("この情緒を消しますか？")) return;
    const result = await deletePost(postId);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleRandomize = async () => {
    setRandom(true);
  };

  return (
    <div className="space-y-3">
      {/* Composer first — Twitter-style "post here" at top */}
      {user ? (
        <PostComposer user={user} onPostCreated={handlePostCreated} />
      ) : (
        <a
          href="/login"
          className="block p-4 bg-accent/10 border-2 border-dashed border-accent/40 rounded-xl text-center text-sm text-accent font-medium no-underline hover:bg-accent/15 transition-colors"
        >
          💭 情緒を投げるには → ログイン
        </a>
      )}

      {/* Filter strip + meta — visually unified, separates composer from feed */}
      <div className="pt-3 border-t border-border space-y-2">
        {/* Tab switch: 全部 / のれん中 */}
        {user && (
          <div className="flex gap-1 p-1 bg-bg rounded-full">
            <button
              onClick={() => setFilterMode("all")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterMode === "all"
                  ? "bg-card shadow-sm"
                  : "text-text-mute hover:text-text-sub"
              }`}
              style={filterMode === "all" ? { color: "#c94d3a" } : undefined}
            >
              🏮 全部
            </button>
            <button
              onClick={() => setFilterMode("following")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterMode === "following"
                  ? "bg-card shadow-sm"
                  : "text-text-mute hover:text-text-sub"
              }`}
              style={
                filterMode === "following" ? { color: "#c94d3a" } : undefined
              }
            >
              🏮 のれん中
            </button>
          </div>
        )}

        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(searchInput.trim());
            setRandom(false);
          }}
          className="relative"
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="情緒を キーワードで検索..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-text-mute hover:bg-bg flex items-center justify-center text-xs"
              aria-label="クリア"
            >
              ✕
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <RegionFilter
              scope={scope}
              onChange={(s) => {
                setScope(s);
                setRandom(false);
              }}
              userPrefecture={profile?.prefecture ?? null}
            />
          </div>
          <button
            onClick={random ? () => setRandom(false) : handleRandomize}
            className={`text-xs px-3 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              random
                ? "bg-accent text-white border border-accent"
                : "bg-card text-text-sub border border-border hover:border-accent"
            }`}
            title={random ? "新しい順に戻す" : "ランダムで眺める"}
          >
            {random ? "🆕 新着" : "🎲 ランダム"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-mute px-1">
          <span className="font-medium">
            {searchTerm
              ? `🔍 "${searchTerm}"`
              : random
              ? "🎲 ランダム"
              : "🆕 新しい順"}
          </span>
          <span className="text-text-mute/40">／</span>
          <span>{scopeLabel(scope)}</span>
          <span className="ml-auto">{total}件</span>
        </div>
      </div>

      {/* New posts indicator — appears when realtime detects new posts */}
      {newPostsCount > 0 && !loading && (
        <button
          onClick={refreshNewPosts}
          className="w-full sticky top-14 z-30 bg-accent text-white rounded-full py-2 text-xs font-bold hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
        >
          <span>🆕 新着 {newPostsCount} 件</span>
          <span className="opacity-70">↑ タップで読み込み</span>
        </button>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {loading ? (
          <PostsSkeleton />
        ) : posts.length === 0 ? (
          <div
            className="text-center py-8 px-6 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: "#c94d3a40",
              background:
                "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
            }}
          >
            <img
              src="/icons/empty-posts.png"
              alt=""
              className="w-32 h-32 mx-auto mb-3"
            />
            <p className="text-sm font-bold" style={{ color: "#c94d3a" }}>
              このエリアにはまだ情緒がありません
            </p>
            <p className="text-xs text-text-sub mt-1.5">
              {user
                ? "最初の一言を投げて、フィードを始めよう"
                : "ログインして、最初の情緒を投げてみよう"}
            </p>
          </div>
        ) : (
          <>
            {(() => {
              const items: React.ReactNode[] = [];
              let prevBucket = "";
              for (const post of posts) {
                const bucket = bucketLabel(post.created_at);
                if (bucket !== prevBucket && !random) {
                  items.push(
                    <div
                      key={`divider-${bucket}-${post.id}`}
                      className="flex items-center gap-2 py-1 px-1"
                    >
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: "#c94d3a" }}
                      >
                        {bucket}
                      </span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                  );
                  prevBucket = bucket;
                }
                items.push(
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id ?? null}
                    isLiked={likedPostIds.has(post.id)}
                    onDelete={handleDelete}
                    onLikeToggled={(postId, liked) => {
                      setLikedPostIds((prev) => {
                        const next = new Set(prev);
                        if (liked) next.add(postId);
                        else next.delete(postId);
                        return next;
                      });
                      setPosts((prev) =>
                        prev.map((p) =>
                          p.id === postId
                            ? {
                                ...p,
                                likes_count:
                                  p.likes_count + (liked ? 1 : -1),
                              }
                            : p
                        )
                      );
                    }}
                  />
                );
              }
              return items;
            })()}
            {canLoadMore && (
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {loadingMore ? (
                  <div className="inline-flex items-center gap-2 text-xs text-text-mute">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    読み込み中...
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="text-xs font-bold text-accent bg-accent/10 hover:bg-accent/15 transition-colors rounded-full px-4 py-2"
                  >
                    ▼ あと {total - posts.length} 件 読み込む
                  </button>
                )}
              </div>
            )}
            {!canLoadMore && !random && posts.length >= POSTS_PAGE_SIZE && (
              <p className="text-center text-[10px] text-text-mute py-4">
                🌙 すべて表示しました（全 {total} 件）
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Group posts into time buckets for date dividers.
 * Returns 今日 / 昨日 / 今週 / 今月 / 過去
 */
function bucketLabel(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = startOfToday.getTime() - d.getTime();
  if (d >= startOfToday) return "今日";
  if (diff < oneDay) return "昨日";
  if (diff < 7 * oneDay) return "今週";
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  )
    return "今月";
  return "過去";
}

function PostsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-card border border-border p-4 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-bg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-bg rounded" />
              <div className="h-2.5 w-1/2 bg-bg rounded" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full bg-bg rounded" />
            <div className="h-3 w-5/6 bg-bg rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
