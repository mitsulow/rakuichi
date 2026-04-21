"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface RecentPostsProps {
  posts: Post[];
  username: string;
}

export function RecentPosts({ posts, username: _username }: RecentPostsProps) {
  const [showAll, setShowAll] = useState(false);
  if (!posts.length) return null;

  const visible = showAll ? posts : posts.slice(0, 5);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">💭 最近の情緒</h3>
      <div className="space-y-2">
        {visible.map((post) => (
          <div
            key={post.id}
            className="border-l-2 border-border pl-3 py-1.5"
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {truncate(post.body, 200)}
            </p>
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="flex gap-1 mt-2 overflow-x-auto hide-scrollbar">
                {post.image_urls.slice(0, 4).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-1.5 text-xs text-text-mute">
              <span>{formatRelativeTime(post.created_at)}</span>
              <span className="flex items-center gap-3">
                <span>🌱 {post.likes_count}</span>
                <span>📜 {post.comments_count}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      {posts.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-accent hover:underline block text-center w-full py-1"
        >
          さらに{posts.length - 5}件表示 ↓
        </button>
      )}
    </div>
  );
}
