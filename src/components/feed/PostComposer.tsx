"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { createPost } from "@/lib/data";
import { EmbedCard } from "./EmbedCard";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import type { Post, OGPEmbed } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface PostComposerProps {
  user: User;
  onPostCreated?: (post: Post) => void;
}

const URL_REGEX = /https?:\/\/[^\s]+/g;

function detectPlatform(url: string): string | undefined {
  if (/instagram\.com/.test(url)) return "instagram";
  if (/x\.com|twitter\.com/.test(url)) return "x";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/facebook\.com/.test(url)) return "facebook";
  if (/note\.com/.test(url)) return "note";
  if (/ameblo\.jp/.test(url)) return "ameblo";
  return undefined;
}

async function fetchOGP(url: string): Promise<OGPEmbed | null> {
  try {
    const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.title && !data.description && !data.image) {
      // Fallback: still embed with bare URL so user sees something
      return { url, title: new URL(url).hostname, platform: detectPlatform(url) };
    }
    return {
      url,
      title: data.title || new URL(url).hostname,
      description: data.description,
      image: data.image,
      platform: detectPlatform(url),
    };
  } catch {
    return null;
  }
}

export function PostComposer({ user, onPostCreated }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [embed, setEmbed] = useState<OGPEmbed | null>(null);
  const [loadingOGP, setLoadingOGP] = useState(false);
  const lastFetchedUrl = useRef<string | null>(null);

  // Detect URL from either the dedicated link input or the body text
  useEffect(() => {
    const urlFromInput = linkUrl.trim().match(URL_REGEX)?.[0];
    const urlFromBody = body.match(URL_REGEX)?.[0];
    const firstUrl = urlFromInput || urlFromBody || null;

    if (!firstUrl) {
      setEmbed(null);
      lastFetchedUrl.current = null;
      return;
    }

    if (firstUrl === lastFetchedUrl.current) return;
    lastFetchedUrl.current = firstUrl;

    const timer = setTimeout(async () => {
      setLoadingOGP(true);
      const ogp = await fetchOGP(firstUrl);
      setEmbed(ogp);
      setLoadingOGP(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [body, linkUrl]);

  const handleSubmit = async () => {
    if ((!body.trim() && !embed) || isSubmitting) return;

    setIsSubmitting(true);
    const newPost = await createPost(body.trim(), user.id, embed);
    setIsSubmitting(false);

    if (newPost) {
      const enrichedPost: Post = {
        ...newPost,
        profile: {
          id: user.id,
          username: user.user_metadata?.username ?? user.email?.split("@")[0] ?? "user",
          email: user.email ?? "",
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.display_name ?? "ユーザー",
          avatar_url: user.user_metadata?.avatar_url ?? null,
          cover_url: null,
          bio: null,
          story: null,
          status_line: null,
          prefecture: null,
          city: null,
          latitude: null,
          longitude: null,
          is_paid: false,
          paid_since: null,
          rice_work: null,
          life_work: null,
          life_work_years: null,
          life_work_level: null,
          migration_percent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        badges: [],
      };
      onPostCreated?.(enrichedPost);
      setBody("");
      setLinkUrl("");
      setEmbed(null);
      lastFetchedUrl.current = null;
      setIsExpanded(false);
    }
  };

  const removeEmbed = () => {
    setEmbed(null);
    setLinkUrl("");
    lastFetchedUrl.current = "__removed__";
  };

  return (
    <Card>
      <div className="flex gap-3">
        <Avatar
          src={user.user_metadata?.avatar_url ?? null}
          alt={user.user_metadata?.full_name ?? "あなた"}
          size="md"
        />
        <div className="flex-1 min-w-0">
          {isExpanded ? (
            <>
              {/* Main text area */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="今日の出来事を共有しよう..."
                className="w-full bg-bg rounded-xl p-3 text-sm resize-none border border-border focus:border-accent focus:outline-none min-h-[90px]"
                maxLength={500}
              />

              {/* OGP Preview */}
              {loadingOGP && (
                <div className="mt-2 text-xs text-text-mute flex items-center gap-1.5">
                  <span className="animate-pulse">⏳</span> リンクを取り込んでいます...
                </div>
              )}
              {embed && !loadingOGP && (
                <div className="relative mt-2">
                  <div className="px-2.5 py-1 text-[10px] text-accent font-medium">
                    ✓ 取り込みました
                  </div>
                  <EmbedCard embed={embed} />
                  <button
                    type="button"
                    onClick={removeEmbed}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80 z-10"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* SNS Link paste area — the star of the show */}
              <div className="mt-3 border-2 border-dashed border-accent/30 bg-accent/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">🔗</span>
                  <span className="text-xs font-medium">
                    他のSNSに投稿したもの、そのまま取り込める
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {SOCIAL_PLATFORMS.map((p) => (
                    <span
                      key={p.id}
                      className="text-xs bg-bg-card rounded-full px-2 py-0.5 text-text-mute border border-border"
                      title={p.label}
                    >
                      <span className="mr-0.5">{p.icon}</span>
                      {p.label}
                    </span>
                  ))}
                </div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URLをここに貼り付け（https://...）"
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-xs focus:border-accent focus:outline-none"
                />
                <p className="text-[10px] text-text-mute mt-1.5">
                  💡 InstagramもXもnoteもYouTubeも、URLを貼るだけで楽市楽座のフィードに綺麗に並びます
                </p>
              </div>

              {/* Submit bar */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-text-mute">{body.length}/500</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setBody("");
                      setLinkUrl("");
                      removeEmbed();
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={(!body.trim() && !embed) || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "立てかけ中..." : "🪧 立て札を立てる"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full bg-bg rounded-xl p-3 text-sm text-text-mute text-left hover:bg-border/50 transition-colors"
            >
              今日の出来事、他のSNSのリンクも貼れます...
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
