"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SnsIcon, getPlatformLabel } from "@/components/ui/SnsIcon";
import { EdoIcon } from "@/components/ui/EdoIcon";
import { ContactModal } from "./ContactModal";
import { QRModal } from "./QRModal";
import { MentorshipSection } from "./MentorshipSection";
import { AspireButton } from "./AspireButton";
import {
  followUser,
  unfollowUser,
  isFollowing,
  fetchFollowCounts,
} from "@/lib/data";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import type { Profile, Badge, ExternalLink, Shop } from "@/lib/types";

interface MyzaStorefrontProps {
  profile: Profile;
  badges: Badge[];
  externalLinks: ExternalLink[];
  shops: Shop[];
  isOwner?: boolean;
}

export function MyzaStorefront({
  profile,
  badges,
  externalLinks,
  shops,
  isOwner = false,
}: MyzaStorefrontProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [showContact, setShowContact] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await fetchFollowCounts(profile.id);
      if (!cancelled) setCounts(c);
      if (user && user.id !== profile.id) {
        const did = await isFollowing(user.id, profile.id);
        if (!cancelled) setFollowing(did);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.id, user]);

  const handleFollow = async () => {
    if (!user || followBusy || isOwner) return;
    setFollowBusy(true);
    if (following) {
      await unfollowUser(user.id, profile.id);
      setFollowing(false);
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      toast.show("フォロー解除しました", "info");
    } else {
      await followUser(user.id, profile.id);
      setFollowing(true);
      setCounts((c) => ({ ...c, followers: c.followers + 1 }));
      toast.show(
        `🏮 ${profile.display_name} をフォローしました`,
        "success"
      );
    }
    setFollowBusy(false);
  };

  const location = [profile.prefecture, profile.city].filter(Boolean).join(" ");

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/u/${profile.username}`;
    const title = `${profile.display_name} の名刺 — 楽市楽座`;
    const text = profile.life_work
      ? `${profile.display_name}（${profile.life_work}）の名刺`
      : title;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      /* nothing */
    }
  };

  const visibleShops = showAllShops ? shops : shops.slice(0, 4);

  return (
    <>
      <Card className="overflow-hidden !p-0">
        {/* Cover image — user upload, or beautiful default landscape */}
        <div className="h-44 overflow-hidden">
          <img
            src={profile.cover_url ?? "/icons/cover-default.png"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Avatar — overlaps cover */}
        <div className="px-4 -mt-12 relative">
          <div className="ring-4 ring-card rounded-full inline-block">
            <Avatar
              src={profile.avatar_url}
              alt={profile.display_name}
              size="xl"
            />
          </div>
        </div>

        <div className="p-4 pt-3 relative">
          {/* Name with hanko-style level badge + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            {profile.life_work_level && (
              <span
                className="inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                style={{
                  background: "#c94d3a",
                  width: 32,
                  height: 32,
                  border: "2px solid #c94d3a",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
                  fontFamily: "serif",
                }}
                title={`レベル：${profile.life_work_level}`}
              >
                {profile.life_work_level === "一人前"
                  ? "壱"
                  : profile.life_work_level === "歩み中"
                  ? "歩"
                  : "修"}
              </span>
            )}
            {badges.length > 0 && <BadgeList badges={badges} />}
          </div>

          {/* The big "what they do" tagline */}
          {profile.life_work && (
            <div className="mt-2">
              <div
                className="text-lg font-bold leading-snug"
                style={{ color: "#c94d3a" }}
              >
                🌱 {profile.life_work}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-text-mute mt-0.5 flex-wrap">
                {profile.life_work_years != null &&
                  profile.life_work_years > 0 && (
                    <span>移行{profile.life_work_years}年目</span>
                  )}
                {location && (
                  <>
                    {profile.life_work_years != null &&
                      profile.life_work_years > 0 && (
                        <span className="text-text-mute/40">／</span>
                      )}
                    <span>📍 {location}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Follow counts */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-mute">
            <span>
              <strong className="text-text">{counts.followers}</strong> 人にフォローされている
            </span>
            <span className="text-text-mute/40">／</span>
            <span>
              <strong className="text-text">{counts.following}</strong> 人をフォローしている
            </span>
          </div>

          {/* Connect/share strip — 4 prominent labeled buttons */}
          <div className="flex gap-1.5 mt-3 relative flex-wrap">
            {!isOwner && (
              <>
                <button
                  onClick={() => setShowContact(true)}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 bg-accent text-white rounded-full px-3 py-2 text-xs font-bold hover:opacity-90 transition shadow-sm"
                >
                  💬 連絡
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followBusy || !user}
                  className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition border-2 ${
                    following
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-card border-border hover:border-accent"
                  } ${!user ? "opacity-50" : ""}`}
                  title={!user ? "ログインが必要" : undefined}
                >
                  {following ? "🏮 フォロー中" : "🏮 フォローする"}
                </button>
              </>
            )}
            <button
              onClick={handleShare}
              className={`flex items-center justify-center gap-1.5 bg-card border-2 border-border hover:border-accent rounded-full px-3 py-2 text-xs font-bold transition ${
                isOwner ? "flex-1" : ""
              }`}
            >
              📤 シェア
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="bg-card border-2 border-border hover:border-accent rounded-full px-3 py-2 text-xs font-bold transition"
              aria-label="QRコード"
            >
              📱 QR
            </button>
            {shareToast && (
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap z-10">
                ✓ URLをコピーしました
              </div>
            )}
          </div>

          {/* Shops — up front: this is "what they do" in storefront form */}
          {(shops.length > 0 || isOwner) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-text-sub">
                  🏪 出品中の楽座（{shops.length}座）
                </div>
                {isOwner && (
                  <Link
                    href="/settings/shops"
                    className="text-xs text-accent no-underline hover:underline"
                  >
                    {shops.length > 0 ? "管理" : "+ 楽座を出す"}
                  </Link>
                )}
              </div>
              {shops.length === 0 && isOwner && (
                <div className="text-center py-6 border border-dashed border-border rounded-xl bg-bg/50">
                  <div className="flex justify-center mb-2 text-accent">
                    <EdoIcon name="rakuza" size={32} />
                  </div>
                  <p className="text-xs text-text-mute mb-2">
                    まだ楽座がありません
                  </p>
                  <Link href="/settings/shops" className="no-underline">
                    <span className="text-xs text-accent font-medium">
                      🌱 お試しで1つ出してみる →
                    </span>
                  </Link>
                </div>
              )}
              {shops.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleShops.map((shop) => (
                      <Link
                        key={shop.id}
                        href={`/shop/${shop.id}`}
                        className="no-underline"
                      >
                        <div
                          className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col"
                          style={{
                            background:
                              "linear-gradient(180deg, #fffaf0 0%, #fdf6e9 100%)",
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden bg-bg">
                            {shop.image_urls && shop.image_urls.length > 0 ? (
                              <img
                                src={shop.image_urls[0]}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-white"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
                                }}
                              >
                                <EdoIcon
                                  name="rakuza"
                                  size={36}
                                  color="#ffffff"
                                />
                              </div>
                            )}
                            {shop.is_trial && (
                              <div className="absolute top-1 right-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm bg-accent shadow-sm">
                                お試し
                              </div>
                            )}
                            <div
                              className="absolute inset-x-0 bottom-0 px-2 pt-6 pb-1.5"
                              style={{
                                background:
                                  "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
                              }}
                            >
                              <div className="text-[11px] font-bold text-white line-clamp-2 leading-tight drop-shadow">
                                {shop.name}
                              </div>
                            </div>
                          </div>
                          <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                            <div className="text-xs font-bold text-accent truncate">
                              {shop.is_trial
                                ? "0円〜"
                                : shop.price_jpy != null
                                ? `¥${shop.price_jpy.toLocaleString()}`
                                : shop.price_text ?? ""}
                            </div>
                            <div className="flex gap-0.5 text-[10px] flex-shrink-0">
                              {shop.accepts_barter && (
                                <span title="物々交換可">🔄</span>
                              )}
                              {shop.accepts_tip && (
                                <span title="投げ銭可">🪙</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {shops.length > 4 && (
                    <button
                      onClick={() => setShowAllShops(!showAllShops)}
                      className="w-full text-xs text-accent mt-2 py-1.5 hover:underline"
                    >
                      {showAllShops
                        ? "▲ 閉じる"
                        : `▼ 他 ${shops.length - 4}座 を見る`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* My Skill — 私が役に立てること */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-text-sub mb-2">
                🛠 私が役に立てること（{profile.skills.length}個）
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s, i) => (
                  <Link
                    key={`${s}-${i}`}
                    href={`/skills?q=${encodeURIComponent(s)}`}
                    className="inline-flex items-center bg-accent/10 text-accent text-[11px] font-medium rounded-full px-2.5 py-1 no-underline hover:bg-accent/20"
                    title={`「${s}」を持つ他の人を探す`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* やりたいこと — pre-skill aspirations */}
          {profile.wants_to_do && profile.wants_to_do.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-text-sub mb-2">
                🌱 私がやりたいこと（{profile.wants_to_do.length}個）
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.wants_to_do.map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className="inline-flex items-center text-[11px] font-medium rounded-full px-2.5 py-1"
                    style={{
                      background: "#2b3a6715",
                      color: "#2b3a67",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SNS link bar — bigger so it's a proper "follow me elsewhere" row */}
          {externalLinks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-text-sub mb-2">
                🔗 SNS でも繋がる
              </div>
              <div className="flex flex-wrap gap-2">
                {externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-card border border-border hover:border-accent rounded-full pl-2.5 pr-3 py-1.5 text-xs no-underline transition-colors hover:scale-105"
                    title={getPlatformLabel(link.platform)}
                  >
                    <SnsIcon platform={link.platform} size={16} />
                    <span className="text-text-sub">
                      {getPlatformLabel(link.platform)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rice work — secondary, lower priority */}
          {profile.rice_work && (
            <div className="mt-3 pt-3 border-t border-dashed border-border">
              <div className="flex items-baseline gap-2 flex-wrap text-xs">
                <span
                  className="inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded flex-shrink-0 bg-text-mute"
                >
                  ライスワーク
                </span>
                <span className="text-text-sub">{profile.rice_work}</span>
              </div>
            </div>
          )}

          {/* Aspirations */}
          <AspireButton profile={profile} isOwner={isOwner} />

          {/* Mentorships */}
          <MentorshipSection profile={profile} isOwner={isOwner} />

          {/* Bottom action bar */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {isOwner ? (
              <>
                <Link href="/settings/profile" className="block no-underline">
                  <Button variant="secondary" size="md" className="w-full">
                    ✏️ 名刺を編集
                  </Button>
                </Link>
                <button
                  onClick={handleShare}
                  className="w-full bg-accent text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition shadow-sm flex items-center justify-center gap-2"
                >
                  📤 自分の名刺を渡す
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setShowContact(true)}
                >
                  💬 連絡を取る
                </Button>
                <button
                  onClick={handleShare}
                  className="w-full bg-card border-2 border-border hover:border-accent rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2"
                >
                  📤 この名刺を友達にシェア
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        profile={profile}
        externalLinks={externalLinks}
      />
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        username={profile.username}
        displayName={profile.display_name}
      />
    </>
  );
}
