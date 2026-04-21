"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import {
  RegionFilter,
  regionToPrefectures,
  type RegionScope,
} from "@/components/feed/RegionFilter";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPostsPaged,
  getUserLikes,
  deletePost,
  POSTS_PAGE_SIZE,
} from "@/lib/data";
import type { Post } from "@/lib/types";

/**
 * 情緒 — store owners' tweets. Region filter + random mode.
 */
export default function PostsPage() {
  const { user, profile } = useAuth();
  const [scope, setScope] = useState<RegionScope>({ kind: "world" });
  const [random, setRandom] = useState(false);
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
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    setLoading(true);
    setPage(0);
    const prefectures = regionToPrefectures(scope);

    (async () => {
      try {
        const { posts: list, total } = await fetchPostsPaged(
          0,
          POSTS_PAGE_SIZE,
          prefectures,
          random
        );
        if (cancelled) return;
        setPosts(list as Post[]);
        setTotal(total);
        if (user && (list as Post[]).length > 0) {
          const ids = (list as Post[]).map((p) => p.id);
          const likes = await getUserLikes(user.id, ids);
          if (!cancelled) setLikedPostIds(likes);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [scope, random, user]);

  const canLoadMore = !random && posts.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const prefectures = regionToPrefectures(scope);
    const { posts: more } = await fetchPostsPaged(
      nextPage,
      POSTS_PAGE_SIZE,
      prefectures,
      false
    );
    setPosts((prev) => [...prev, ...(more as Post[])]);
    setPage(nextPage);
    setLoadingMore(false);
  }, [loadingMore, canLoadMore, page, scope]);

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
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">💭 情緒</h1>
        <p className="text-xs text-text-mute mt-0.5">
          店主たちのつぶやき・今日のこと・シェアしたいもの
        </p>
      </div>

      {/* Region filter */}
      <div>
        <div className="text-[10px] text-text-mute mb-1 px-1">地域で絞る</div>
        <RegionFilter
          scope={scope}
          onChange={(s) => {
            setScope(s);
            setRandom(false);
          }}
          userPrefecture={profile?.prefecture ?? null}
        />
      </div>

      {/* Random button */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-mute">
          {random ? "ランダムに並べてます" : `全${total}件`}
        </p>
        <button
          onClick={random ? () => setRandom(false) : handleRandomize}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            random
              ? "bg-accent text-white"
              : "bg-card text-text-sub border border-border"
          }`}
        >
          {random ? "🎲 新しい順に戻す" : "🎲 ランダムで観る"}
        </button>
      </div>

      {/* Composer or login prompt */}
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

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <LoadingScreen step="情緒を読み込み中..." />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-text-mute">
            <p className="text-4xl mb-3">💭</p>
            <p className="text-sm">このエリアに情緒はまだありません</p>
            <p className="text-xs mt-1">最初の情緒を投げてみよう</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
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
                        ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) }
                        : p
                    )
                  );
                }}
              />
            ))}

            {canLoadMore && (
              <div ref={sentinelRef} className="py-6 text-center">
                {loadingMore ? (
                  <div className="inline-flex items-center gap-2 text-xs text-text-mute">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    次の情緒を読み込み中...
                  </div>
                ) : (
                  <button onClick={loadMore} className="text-xs text-accent underline">
                    もっと見る（あと{total - posts.length}件）
                  </button>
                )}
              </div>
            )}
            {!canLoadMore && !random && posts.length >= POSTS_PAGE_SIZE && (
              <p className="text-center text-[10px] text-text-mute py-4">
                💭 すべて表示しました（全{total}件）
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
