"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { formatRelativeTime } from "@/lib/utils";
import { toggleLike } from "@/lib/data";
import { EmbedCard } from "./EmbedCard";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  currentUserId?: string | null;
  isLiked?: boolean;
  onLikeToggled?: (postId: string, liked: boolean) => void;
}

export function PostCard({ post, currentUserId, isLiked = false, onLikeToggled }: PostCardProps) {
  const { profile, badges, shop } = post;
  const [likeLoading, setLikeLoading] = useState(false);

  // If profile is missing (partial join), use a minimal fallback so the post still shows
  const displayProfile = profile ?? {
    id: post.user_id,
    username: post.user_id.slice(0, 8),
    display_name: "座の民",
    avatar_url: null,
  };

  const handleLikeClick = async () => {
    if (!currentUserId || likeLoading) return;

    // Optimistic update
    onLikeToggled?.(post.id, !isLiked);

    setLikeLoading(true);
    const result = await toggleLike(post.id, currentUserId, isLiked);
    setLikeLoading(false);

    // If the server result disagrees with our optimistic update, revert
    if (result.error) {
      onLikeToggled?.(post.id, isLiked); // revert
    }
  };

  return (
    <Card>
      {/* Author header */}
      <div className="flex items-start gap-3">
        <Link href={`/u/${displayProfile.username}`}>
          <Avatar src={displayProfile.avatar_url} alt={displayProfile.display_name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/u/${displayProfile.username}`}
              className="font-medium text-sm no-underline hover:underline"
            >
              {displayProfile.display_name}
            </Link>
            {badges && <BadgeList badges={badges.slice(0, 3)} />}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-mute">
            {profile?.life_work_level && (
              <span>{profile.life_work_level}</span>
            )}
            {profile?.prefecture && <span>📍{profile.prefecture}</span>}
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">
        {post.body}
      </p>

      {/* Platform embed (Instagram iframe, YouTube, Tweet, or OGP fallback) */}
      {post.embed && <EmbedCard embed={post.embed} />}

      {/* Images */}
      {post.image_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {post.image_urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-full h-40 object-cover"
            />
          ))}
        </div>
      )}

      {/* Shop tag */}
      {shop && (
        <div className="mt-3 bg-bg rounded-xl p-2.5 flex items-center gap-2">
          <CategoryTag categoryId={shop.category} size="sm" />
          <span className="text-xs font-medium">{shop.name}</span>
          {shop.price_text && (
            <span className="text-xs text-accent ml-auto">{shop.price_text}</span>
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <button
          onClick={handleLikeClick}
          disabled={!currentUserId || likeLoading}
          title={isLiked ? "種をまいた" : "種をまく"}
          className={`flex items-center gap-1 text-sm transition-colors ${
            isLiked
              ? "text-accent font-medium"
              : "text-text-sub hover:text-accent"
          } ${!currentUserId ? "opacity-50 cursor-default" : ""}`}
        >
          <span>{isLiked ? "🌱" : "🌱"}</span>
          <span>{post.likes_count}</span>
        </button>
        <button
          title="文を寄せる"
          className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors"
        >
          <span>📜</span>
          <span>{post.comments_count}</span>
        </button>
        <button
          title="共有"
          className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors"
        >
          <span>🔗</span>
        </button>
      </div>
    </Card>
  );
}
