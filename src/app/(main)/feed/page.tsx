"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { MigrationDashboard } from "@/components/feed/MigrationDashboard";
import { FeedFilterTabs } from "@/components/feed/FeedFilterTabs";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { fetchPosts, getUserLikes } from "@/lib/data";
import type { Post } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("featured");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Hard timeout: even if everything hangs, show the page after 6 seconds
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 6000);

    async function init() {
      try {
        const supabase = createClient();

        // Get current user (timeout 4s)
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 4000)
          ),
        ]);
        const currentUser = sessionResult.data.session?.user ?? null;
        if (cancelled) return;
        setUser(currentUser);

        // Fetch posts (timeout 5s)
        const fetchedPosts = await Promise.race([
          fetchPosts(),
          new Promise<Post[]>((resolve) =>
            setTimeout(() => resolve([]), 5000)
          ),
        ]);
        if (cancelled) return;
        setPosts(fetchedPosts);

        if (currentUser && fetchedPosts.length > 0) {
          const postIds = fetchedPosts.map((p) => p.id);
          const likes = await Promise.race([
            getUserLikes(currentUser.id, postIds),
            new Promise<Set<string>>((resolve) =>
              setTimeout(() => resolve(new Set()), 3000)
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
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Welcome banner for new users */}
      <WelcomeBanner />

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
