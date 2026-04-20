"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { formatRelativeTime } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { profile, badges, shop } = post;
  if (!profile) return null;

  return (
    <Card>
      {/* Author header */}
      <div className="flex items-start gap-3">
        <Link href={`/u/${profile.username}`}>
          <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/u/${profile.username}`}
              className="font-medium text-sm no-underline hover:underline"
            >
              {profile.display_name}
            </Link>
            {badges && <BadgeList badges={badges.slice(0, 3)} />}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-mute">
            {profile.life_work_level && (
              <span>{profile.life_work_level}</span>
            )}
            {profile.prefecture && <span>📍{profile.prefecture}</span>}
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">
        {post.body}
      </p>

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
        <button className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors">
          <span>🌾</span>
          <span>{post.likes_count}</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors">
          <span>💬</span>
          <span>{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors">
          <span>🔗</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-text-sub hover:text-accent transition-colors ml-auto">
          <span>📖</span>
        </button>
      </div>
    </Card>
  );
}
