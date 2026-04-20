"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { createPost } from "@/lib/data";
import type { Post, OGPEmbed } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface PostComposerProps {
  user: User;
  onPostCreated?: (post: Post) => void;
}

const URL_REGEX = /https?:\/\/[^\s]+/g;

async function fetchOGP(url: string): Promise<OGPEmbed | null> {
  try {
    const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.title) return null;

    // Detect platform from URL
    let platform: string | undefined;
    if (/instagram\.com/.test(url)) platform = "instagram";
    else if (/x\.com|twitter\.com/.test(url)) platform = "x";
    else if (/youtube\.com|youtu\.be/.test(url)) platform = "youtube";
    else if (/tiktok\.com/.test(url)) platform = "tiktok";
    else if (/facebook\.com/.test(url)) platform = "facebook";

    return { url, title: data.title, description: data.description, image: data.image, platform };
  } catch {
    return null;
  }
}

export function PostComposer({ user, onPostCreated }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [embed, setEmbed] = useState<OGPEmbed | null>(null);
  const [loadingOGP, setLoadingOGP] = useState(false);
  const lastFetchedUrl = useRef<string | null>(null);

  // Detect URLs in body and fetch OGP
  useEffect(() => {
    const urls = body.match(URL_REGEX);
    const firstUrl = urls?.[0] ?? null;

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
  }, [body]);

  const handleSubmit = async () => {
    if (!body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newPost = await createPost(body.trim(), user.id, embed);
    setIsSubmitting(false);

    if (newPost) {
      // Attach user profile info from metadata for immediate display
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        badges: [],
      };
      onPostCreated?.(enrichedPost);
      setBody("");
      setEmbed(null);
      lastFetchedUrl.current = null;
      setIsExpanded(false);
    }
  };

  return (
    <Card>
      <div className="flex gap-3">
        <Avatar
          src={user.user_metadata?.avatar_url ?? null}
          alt={user.user_metadata?.full_name ?? "あなた"}
          size="md"
        />
        <div className="flex-1">
          {isExpanded ? (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="今日の出来事を共有しよう..."
                className="w-full bg-bg rounded-xl p-3 text-sm resize-none border border-border focus:border-accent focus:outline-none min-h-[100px]"
                maxLength={500}
              />
              {/* OGP Preview */}
              {loadingOGP && (
                <div className="mt-2 text-xs text-text-mute">リンクを読み込み中...</div>
              )}
              {embed && !loadingOGP && (
                <div className="mt-2 border border-border rounded-xl overflow-hidden relative">
                  {embed.image && (
                    <img src={embed.image} alt="" className="w-full h-32 object-cover" />
                  )}
                  <div className="p-2.5">
                    <div className="text-xs font-medium line-clamp-1">{embed.title}</div>
                    {embed.description && (
                      <div className="text-xs text-text-mute line-clamp-2 mt-0.5">{embed.description}</div>
                    )}
                    <div className="text-xs text-text-mute mt-1 flex items-center gap-1">
                      {embed.platform && <span className="capitalize">{embed.platform}</span>}
                      <span className="truncate">{new URL(embed.url).hostname}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEmbed(null); lastFetchedUrl.current = "__removed__"; }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-mute">
                  {body.length}/500
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setBody("");
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!body.trim() || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "投稿中..." : "投稿する"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full bg-bg rounded-xl p-3 text-sm text-text-mute text-left hover:bg-border/50 transition-colors"
            >
              今日の出来事を共有しよう...
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
