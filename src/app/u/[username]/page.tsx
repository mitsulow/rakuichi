"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatusLine } from "@/components/profile/StatusLine";
import { WorkSection } from "@/components/profile/WorkSection";
import { StorySection } from "@/components/profile/StorySection";
import { ShopList } from "@/components/profile/ShopList";
import { WishList } from "@/components/profile/WishList";
import { TradeRecord } from "@/components/profile/TradeRecord";
import { ExternalLinks } from "@/components/profile/ExternalLinks";
import { RecentPosts } from "@/components/profile/RecentPosts";
import {
  fetchProfileByUsername,
  fetchBadges,
  fetchPostsByUser,
  fetchExternalLinks,
  fetchShopsByOwner,
  fetchWishes,
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await fetchProfileByUsername(username);
      if (!p) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(p as Profile);

      // Check if current user is the profile owner
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsOwner(session?.user?.id === p.id);

      // Fetch related data in parallel
      const [b, po, el, sh, wi] = await Promise.all([
        fetchBadges(p.id),
        fetchPostsByUser(p.id),
        fetchExternalLinks(p.id),
        fetchShopsByOwner(p.id),
        fetchWishes(p.id),
      ]);

      setBadges(b as Badge[]);
      setPosts(po as Post[]);
      setExternalLinks(el as ExternalLink[]);
      setShops(sh as Shop[]);
      setWishes(wi as Wish[]);
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return <div className="text-center py-12 text-text-mute text-sm">読み込み中...</div>;
  }

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-4 space-y-4">
      <Card>
        <ProfileHeader
          profile={profile}
          badges={badges}
          externalLinks={externalLinks}
          isOwner={isOwner}
        />
      </Card>

      <StatusLine statusLine={profile.status_line} />

      <Card>
        <WorkSection profile={profile} />
      </Card>

      {profile.story && (
        <Card>
          <StorySection story={profile.story} />
        </Card>
      )}

      {profile.is_paid && shops.length > 0 && (
        <Card>
          <ShopList shops={shops} />
        </Card>
      )}

      {wishes.length > 0 && (
        <Card>
          <WishList wishes={wishes} />
        </Card>
      )}

      <Card>
        <TradeRecord
          profile={profile}
          transactionCount={0}
          barterCount={0}
        />
      </Card>

      {externalLinks.length > 0 && (
        <Card>
          <ExternalLinks links={externalLinks} />
        </Card>
      )}

      {posts.length > 0 && (
        <Card>
          <RecentPosts posts={posts} username={username} />
        </Card>
      )}
    </div>
  );
}
