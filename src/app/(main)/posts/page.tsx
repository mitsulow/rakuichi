"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { FeedFilterTabs } from "@/components/feed/FeedFilterTabs";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchPosts, getUserLikes, deletePost } from "@/lib/data";
import { getCached, setCached } from "@/lib/cache";
import type { Post } from "@/lib/types";

/**
 * 情緒（じょうちょ） — 店主たちのつぶやき。
 * Formerly the "feed" / 立て札. Now renamed and moved behind 屋台.
 */
export default function PostsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("featured");
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<Post[]>("posts:feed") ?? [];
  });
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached<Post[]>("posts:feed");
  });

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    async function init() {
      try {
        const fetchedPosts = await Promise.race([
          fetchPosts(),
          new Promise<Post[]>((resolve) =>
            setTimeout(() => resolve([]), 8000)
          ),
        ]);
        if (cancelled) return;
        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
          setCached("posts:feed", fetchedPosts);
        }
        if (user && fetchedPosts.length > 0) {
          const postIds = fetchedPosts.map((p) => p.id);
          const likes = await Promise.race([
            getUserLikes(user.id, postIds),
            new Promise<Set<string>>((resolve) =>
              setTimeout(() => resolve(new Set()), 5000)
            ),
          ]);
          if (cancelled) return;
          setLikedPostIds(likes);
        }
      } catch (e) {
        console.error("Posts init error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [user]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => {
      const next = [newPost, ...prev];
      setCached("posts:feed", next);
      return next;
    });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("この情緒を消しますか？")) return;
    const result = await deletePost(postId);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== postId);
      setCached("posts:feed", next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">💭 情緒</h1>
        <p className="text-xs text-text-mute mt-0.5">
          店主たちのつぶやき・今日のこと・シェアしたいもの
        </p>
      </div>

      <FeedFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

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

      <div className="space-y-4">
        {loading ? (
          <LoadingScreen step="情緒を読み込み中..." />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-text-mute">
            <p className="text-4xl mb-3">💭</p>
            <p className="text-sm">まだ情緒がありません</p>
            <p className="text-xs mt-1">最初の情緒を投げてみよう</p>
          </div>
        ) : (
          posts.map((post) => (
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
          ))
        )}
      </div>
    </div>
  );
}
