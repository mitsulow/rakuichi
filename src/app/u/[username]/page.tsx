"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { MyzaStorefront } from "@/components/profile/MyzaStorefront";
import { StorySection } from "@/components/profile/StorySection";
import { WishList } from "@/components/profile/WishList";
import { RecentPosts } from "@/components/profile/RecentPosts";
import { TradeRecords } from "@/components/profile/TradeRecords";
import {
  fetchProfileByUsername,
  fetchBadges,
  fetchPostsByUser,
  fetchExternalLinks,
  fetchShopsByOwner,
  fetchWishes,
  fetchTotalSeeds,
} from "@/lib/data";
import type { Profile, Badge, Post, ExternalLink, Shop, Wish } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [totalSeeds, setTotalSeeds] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 10000);

    async function load() {
      try {
        const p = await fetchProfileByUsername(username);
        if (cancelled) return;
        if (!p) {
          setProfile(null);
          return;
        }
        setProfile(p as Profile);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setIsOwner(session?.user?.id === p.id);

        const [b, po, el, sh, wi, seeds] = await Promise.all([
          fetchBadges(p.id).catch(() => []),
          fetchPostsByUser(p.id).catch(() => []),
          fetchExternalLinks(p.id).catch(() => []),
          fetchShopsByOwner(p.id).catch(() => []),
          fetchWishes(p.id).catch(() => []),
          fetchTotalSeeds(p.id).catch(() => 0),
        ]);
        if (cancelled) return;

        setBadges(b as Badge[]);
        setPosts(po as Post[]);
        setExternalLinks(el as ExternalLink[]);
        setShops(sh as Shop[]);
        setWishes(wi as Wish[]);
        setTotalSeeds(seeds);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [username]);

  if (loading) {
    return <LoadingScreen step={`マイページを読み込み中... (${username})`} />;
  }

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-4 space-y-4">
      {/* マイページ — 1画面ストアフロント */}
      <MyzaStorefront
        profile={profile}
        badges={badges}
        externalLinks={externalLinks}
        shops={shops}
        totalSeeds={totalSeeds}
        isOwner={isOwner}
      />

      {/* ストーリー */}
      {profile.story && (
        <Card>
          <StorySection story={profile.story} />
        </Card>
      )}

      {/* 最近の情緒 — shown directly (was folded) */}
      {posts.length > 0 && (
        <Card>
          <RecentPosts posts={posts} username={username} />
        </Card>
      )}

      {/* 交換記録 + ほしいもの only inside the fold */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-sm text-text-sub py-2 hover:text-accent transition-colors"
      >
        {showDetails ? "▲ 閉じる" : "▼ 交換記録・ほしいもの"}
      </button>

      {showDetails && (
        <>
          <Card>
            <TradeRecords userId={profile.id} />
          </Card>

          {wishes.length > 0 && (
            <Card>
              <WishList wishes={wishes} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
