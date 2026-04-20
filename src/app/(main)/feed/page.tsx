"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TodayFive } from "@/components/feed/TodayFive";
import { FeedFilterTabs } from "@/components/feed/FeedFilterTabs";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { mockProfiles, mockBadges } from "@/lib/mock-data";
import { fetchPosts, getUserLikes } from "@/lib/data";
import type { Post } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("featured");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Today's 5: pick 5 profiles with some logic
  const todayFive = mockProfiles
    .filter((p) => p.is_paid)
    .slice(0, 5);

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
      {/* Today's 5 */}
      <TodayFive profiles={todayFive} badges={mockBadges} />

      {/* Filter tabs */}
      <FeedFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Post composer - only visible when logged in */}
      {user && <PostComposer user={user} onPostCreated={handlePostCreated} />}

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-text-mute text-sm">読み込み中...</div>
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
