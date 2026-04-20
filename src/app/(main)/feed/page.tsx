"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
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
    async function init() {
      const supabase = createClient();

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Fetch posts
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);

      // Fetch user's likes
      if (currentUser) {
        const postIds = fetchedPosts.map((p) => p.id);
        const likes = await getUserLikes(currentUser.id, postIds);
        setLikedPostIds(likes);
      }

      setLoading(false);
    }

    init();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="space-y-4">
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
          <div className="text-center py-8 text-text-mute text-sm">読み込み中...</div>
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
