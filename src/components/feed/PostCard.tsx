"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { formatRelativeTime } from "@/lib/utils";
import { toggleLike } from "@/lib/data";
import { EmbedCard } from "./EmbedCard";
import { CommentsSection } from "./CommentsSection";
import { RichBody } from "./RichBody";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  currentUserId?: string | null;
  isLiked?: boolean;
  onLikeToggled?: (postId: string, liked: boolean) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, isLiked = false, onLikeToggled, onDelete }: PostCardProps) {
  const { profile, badges, shop } = post;
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { user } = useAuth();

  // If profile is missing (partial join), use a minimal fallback so the post still shows
  const displayProfile = profile ?? {
    id: post.user_id,
    username: post.user_id.slice(0, 8),
    display_name: "むらびと",
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
    <Card className="!p-0 overflow-hidden relative">
      {/* Thin vermilion top accent — matches 楽座 grid cards */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10 pointer-events-none"
        style={{ background: "#c94d3a" }}
      />

      <div className="p-4">
        {/* Author header */}
        <div className="flex items-start gap-3">
          <Link href={`/u/${displayProfile.username}`}>
            <Avatar
              src={displayProfile.avatar_url}
              alt={displayProfile.display_name}
              size="md"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/u/${displayProfile.username}`}
                className="font-bold text-sm no-underline hover:underline"
              >
                {displayProfile.display_name}
              </Link>
              {profile?.life_work_level && (
                <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-medium">
                  {profile.life_work_level}
                </span>
              )}
              {badges && <BadgeList badges={badges.slice(0, 3)} />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-mute mt-0.5 flex-wrap">
              {profile?.life_work && (
                <span className="truncate max-w-[180px]">
                  🌱 {profile.life_work}
                </span>
              )}
              {profile?.prefecture && (
                <>
                  {profile?.life_work && <span className="text-text-mute/40">／</span>}
                  <span>📍 {profile.prefecture}</span>
                </>
              )}
              <span className="text-text-mute/40">／</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
          {currentUserId === post.user_id && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-text-mute hover:text-red-500 text-sm w-8 h-8 flex items-center justify-center flex-shrink-0"
              title="削除"
              aria-label="削除"
            >
              🗑
            </button>
          )}
        </div>

        {/* Body — with #hashtag/@mention/URL auto-linking */}
        <p className="text-[14px] mt-3 whitespace-pre-wrap leading-relaxed">
          <RichBody body={post.body} />
        </p>

        {/* Platform embed */}
        {post.embed && <EmbedCard embed={post.embed} />}

        {/* Images — tap to enlarge in lightbox */}
        {post.image_urls.length > 0 && (
          <div
            className={`mt-3 gap-1 rounded-xl overflow-hidden ${
              post.image_urls.length === 1
                ? "block"
                : "grid grid-cols-2"
            }`}
          >
            {post.image_urls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="block relative cursor-zoom-in"
              >
                <img
                  src={url}
                  alt=""
                  className={`w-full object-cover ${
                    post.image_urls.length === 1 ? "max-h-96" : "h-40"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <ImageLightbox
            images={post.image_urls}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* Shop tag — matches 楽座 card visual language */}
        {shop && (
          <Link href={`/shop/${shop.id}`} className="block no-underline mt-3">
            <div
              className="rounded-xl border border-accent/30 overflow-hidden flex items-center gap-2 p-2"
              style={{
                background:
                  "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
              }}
            >
              {shop.image_urls && shop.image_urls.length > 0 ? (
                <img
                  src={shop.image_urls[0]}
                  alt={shop.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <CategoryTag categoryId={shop.category} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-text-mute leading-tight">
                  関連楽座
                </div>
                <div className="text-xs font-bold truncate">{shop.name}</div>
              </div>
              {(shop.price_jpy != null || shop.price_text || shop.is_trial) && (
                <span className="text-xs font-bold text-accent flex-shrink-0">
                  {shop.is_trial
                    ? "0円〜"
                    : shop.price_jpy != null
                    ? `¥${shop.price_jpy.toLocaleString()}`
                    : shop.price_text}
                </span>
              )}
            </div>
          </Link>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          <button
            onClick={handleLikeClick}
            disabled={!currentUserId || likeLoading}
            title={isLiked ? "いいねした" : "いいね"}
            className={`flex items-center gap-1 text-sm px-2.5 py-1 rounded-full transition-colors ${
              isLiked
                ? "bg-accent/15 text-accent font-bold"
                : "text-text-sub hover:bg-bg"
            } ${!currentUserId ? "opacity-50 cursor-default" : ""}`}
          >
            <span>🌱</span>
            <span>{post.likes_count}</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen((o) => !o)}
            title="文を寄せる"
            className={`flex items-center gap-1 text-sm px-2.5 py-1 rounded-full transition-colors ${
              commentsOpen
                ? "bg-accent/15 text-accent font-bold"
                : "text-text-sub hover:bg-bg"
            }`}
          >
            <span>📜</span>
            <span>{commentsCount}</span>
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-text-sub hover:bg-bg transition-colors ml-auto no-underline"
            title="この情緒を開く"
          >
            <span>🔗</span>
            <span>個別表示</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              const url = `${window.location.origin}/posts/${post.id}`;
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: "楽市楽座",
                    text: post.body.slice(0, 100),
                    url,
                  });
                } else {
                  await navigator.clipboard.writeText(url);
                  alert("URLをコピーしました");
                }
              } catch {
                /* cancelled */
              }
            }}
            title="シェア"
            className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-full text-text-sub hover:bg-bg transition-colors"
          >
            <span>📤</span>
          </button>
        </div>

        {/* Inline comments */}
        {commentsOpen && (
          <CommentsSection
            postId={post.id}
            currentUserId={user?.id ?? null}
            currentUserAvatarUrl={user?.user_metadata?.avatar_url ?? null}
            currentUserName={user?.user_metadata?.full_name ?? null}
            onCountChange={(delta) => setCommentsCount((c) => c + delta)}
          />
        )}
      </div>
    </Card>
  );
}
