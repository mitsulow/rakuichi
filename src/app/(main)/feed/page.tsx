"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { MigrationDashboard } from "@/components/feed/MigrationDashboard";
import { QuickActions } from "@/components/feed/QuickActions";
import { FeedFilterTabs } from "@/components/feed/FeedFilterTabs";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchPosts, getUserLikes } from "@/lib/data";
import { getCached, setCached } from "@/lib/cache";
import type { Post } from "@/lib/types";

export default function FeedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("featured");
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<Post[]>("feed:posts") ?? [];
  });
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached<Post[]>("feed:posts");
  });

  useEffect(() => {
    let cancelled = false;

    // Stop showing spinner after 4s no matter what
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    async function init() {
      try {
        // Fetch fresh posts in background
        const fetchedPosts = await Promise.race([
          fetchPosts(),
          new Promise<Post[]>((resolve) =>
            setTimeout(() => resolve([]), 8000)
          ),
        ]);
        if (cancelled) return;

        // Only overwrite if fetch actually returned something
        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
          setCached("feed:posts", fetchedPosts);
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
        console.error("Feed init error:", e);
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
      setCached("feed:posts", next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Welcome banner for new users */}
      <WelcomeBanner />

      {/* クイックアクション - ログイン中のみ */}
      <QuickActions isLoggedIn={!!user} />

      {/* 全体の移行度ダッシュボード */}
      <MigrationDashboard />

      {/* 週イチ楽座 */}
      <WeeklyMarket />

      {/* Filter tabs */}
      <FeedFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Post composer - only visible when logged in */}
      {user ? (
        <PostComposer user={user} onPostCreated={handlePostCreated} />
      ) : (
        <a
          href="/login"
          className="block p-4 bg-accent/10 border-2 border-dashed border-accent/40 rounded-xl text-center text-sm text-accent font-medium no-underline hover:bg-accent/15 transition-colors"
        >
          🪧 立て札を立てるには → ログイン
        </a>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <LoadingScreen step="立て札を読み込み中..." />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-text-mute">
            <p className="text-4xl mb-3">🪧</p>
            <p className="text-sm">まだ立て札がありません</p>
            <p className="text-xs mt-1">最初の立て札を立ててみよう</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
              isLiked={likedPostIds.has(post.id)}
              onLikeToggled={(postId, liked) => {
                setLikedPostIds((prev) => {
                  const next = new Set(prev);
                  if (liked) {
                    next.add(postId);
                  } else {
                    next.delete(postId);
                  }
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
