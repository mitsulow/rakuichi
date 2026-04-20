"use client";

import { useState } from "react";
import { TodayFive } from "@/components/feed/TodayFive";
import { FeedFilterTabs } from "@/components/feed/FeedFilterTabs";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { mockProfiles, mockBadges, getPostsWithProfiles } from "@/lib/mock-data";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("featured");

  // Today's 5: pick 5 profiles with some logic
  const todayFive = mockProfiles
    .filter((p) => p.is_paid)
    .slice(0, 5);

  const posts = getPostsWithProfiles();

  return (
    <div className="space-y-4">
      {/* Today's 5 */}
      <TodayFive profiles={todayFive} badges={mockBadges} />

      {/* Filter tabs */}
      <FeedFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Post composer */}
      <PostComposer />

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
