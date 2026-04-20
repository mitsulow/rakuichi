"use client";

import type { OGPEmbed } from "@/lib/types";

interface EmbedCardProps {
  embed: OGPEmbed;
}

/**
 * Extract the post/reel ID from an Instagram URL.
 * Supports: /p/xxx/, /reel/xxx/, /tv/xxx/
 */
function getInstagramPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Extract YouTube video ID. Supports youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Extract Tweet ID from x.com or twitter.com URL.
 */
function getTweetId(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/);
  return match ? match[1] : null;
}

export function EmbedCard({ embed }: EmbedCardProps) {
  const url = embed.url;

  // Instagram: iframe embed
  const igId = getInstagramPostId(url);
  if (igId) {
    return (
      <div className="mt-3 border border-border rounded-xl overflow-hidden bg-bg">
        <iframe
          src={`https://www.instagram.com/p/${igId}/embed/captioned/`}
          className="w-full"
          style={{ height: "560px", border: "none" }}
          scrolling="no"
          allowFullScreen
          title="Instagram post"
        />
      </div>
    );
  }

  // YouTube: iframe embed
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="mt-3 border border-border rounded-xl overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      </div>
    );
  }

  // X/Twitter: use platform.twitter.com via iframe (twitframe as fallback)
  const tweetId = getTweetId(url);
  if (tweetId) {
    return (
      <div className="mt-3 border border-border rounded-xl overflow-hidden bg-bg">
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
          className="w-full"
          style={{ height: "560px", border: "none" }}
          scrolling="no"
          title="Tweet"
        />
      </div>
    );
  }

  // Default: OGP card
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block border border-border rounded-xl overflow-hidden hover:bg-bg transition-colors no-underline"
    >
      {embed.image && (
        <img src={embed.image} alt="" className="w-full h-36 object-cover" />
      )}
      <div className="p-2.5">
        <div className="text-xs font-medium line-clamp-2">{embed.title}</div>
        {embed.description && (
          <div className="text-xs text-text-mute line-clamp-2 mt-0.5">
            {embed.description}
          </div>
        )}
        <div className="text-xs text-text-mute mt-1 flex items-center gap-1">
          {embed.platform && (
            <span className="capitalize px-1.5 py-0.5 bg-bg-card rounded">
              {embed.platform}
            </span>
          )}
          <span className="truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}
