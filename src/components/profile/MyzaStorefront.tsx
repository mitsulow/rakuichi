"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SnsIcon, getPlatformLabel } from "@/components/ui/SnsIcon";
import { EdoIcon } from "@/components/ui/EdoIcon";
import { ContactModal } from "./ContactModal";
import { QRModal } from "./QRModal";
import { MigrationBar } from "./MigrationBar";
import { SeedStage } from "./SeedStage";
import { MentorshipSection } from "./MentorshipSection";
import { AspireButton } from "./AspireButton";
import type { Profile, Badge, ExternalLink, Shop } from "@/lib/types";

interface MyzaStorefrontProps {
  profile: Profile;
  badges: Badge[];
  externalLinks: ExternalLink[];
  shops: Shop[];
  totalSeeds: number;
  isOwner?: boolean;
}

export function MyzaStorefront({
  profile,
  badges,
  externalLinks,
  shops,
  totalSeeds,
  isOwner = false,
}: MyzaStorefrontProps) {
  const [showContact, setShowContact] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const location = [profile.prefecture, profile.city].filter(Boolean).join(" ");

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/u/${profile.username}`;
    const title = `${profile.display_name} のマイページ — 楽市楽座`;
    const text = profile.life_work
      ? `${profile.display_name}（${profile.life_work}）のマイページ`
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
        {/* Cover image - prominent store banner */}
        {profile.cover_url ? (
          <div className="h-40 overflow-hidden">
            <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="h-28"
            style={{
              background:
                "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
            }}
          />
        )}

        {/* Noren-style name banner overlapping the cover */}
        <div className="px-4 -mt-10 relative">
          <div className="flex items-end gap-3">
            <div className="ring-4 ring-card rounded-full">
              <Avatar
                src={profile.avatar_url}
                alt={profile.display_name}
                size="xl"
              />
            </div>
            <div className="flex gap-1 ml-auto mb-1 relative">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm hover:bg-bg shadow-sm"
                title="シェア"
                aria-label="シェア"
              >
                ⤴
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm hover:bg-bg shadow-sm"
                title="QRコード"
                aria-label="QRコード"
              >
                📱
              </button>
              {!isOwner && (
                <button
                  onClick={() => setShowContact(true)}
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm hover:bg-bg shadow-sm"
                  title="連絡"
                  aria-label="連絡"
                >
                  💬
                </button>
              )}
              {shareToast && (
                <div className="absolute top-11 right-0 bg-black/80 text-white text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap">
                  URLをコピーしました
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 pt-3 relative">
          {/* Name with hanko-style level badge */}
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

          {/* Life work + Rice work — clearly displayed */}
          {(profile.life_work || profile.rice_work) && (
            <div className="mt-3 space-y-1.5">
              {profile.life_work && (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: "#c94d3a" }}
                  >
                    ライフワーク
                  </span>
                  <span className="text-base font-bold text-accent">
                    {profile.life_work}
                  </span>
                  {profile.life_work_years != null && profile.life_work_years > 0 && (
                    <span className="text-[10px] text-text-sub">
                      移行{profile.life_work_years}年目
                    </span>
                  )}
                </div>
              )}
              {profile.rice_work && (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded flex-shrink-0 bg-text-mute">
                    ライスワーク
                  </span>
                  <span className="text-sm text-text-sub">
                    {profile.rice_work}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* My SKILL — できること */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-text-mute mb-1.5 font-medium">
                🛠 できること
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className="inline-flex items-center bg-accent/10 text-accent text-[11px] font-medium rounded-full px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <p className="text-xs text-text-mute mt-2">📍 {location}</p>
          )}

          {/* SNS icon bar */}
          {externalLinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {externalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:bg-bg-card hover:scale-105 transition-all no-underline shadow-sm"
                  title={getPlatformLabel(link.platform)}
                  aria-label={getPlatformLabel(link.platform)}
                >
                  <SnsIcon platform={link.platform} size={18} />
                </a>
              ))}
            </div>
          )}

          {/* Status — "今" */}
          {profile.status_line && (
            <div
              className="mt-3 rounded-xl px-3 py-2.5 relative"
              style={{
                background: "linear-gradient(135deg, #fff9f0 0%, #fdf6e8 100%)",
                border: "1px solid #d4a04340",
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0"
                  style={{ background: "#d4a043" }}
                >
                  今
                </span>
                <p className="text-xs text-text-sub flex-1">
                  {profile.status_line}
                </p>
              </div>
            </div>
          )}

          {/* Migration bar — THE story, big and clear */}
          <div
            className="mt-4 p-3 rounded-xl"
            style={{ background: "#f5e8d5" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-sub">
                🌾 ライスワーク → ライフワーク
              </span>
              <span className="text-lg font-bold text-accent">
                {profile.migration_percent ?? 0}%
              </span>
            </div>
            <MigrationBar
            percent={profile.migration_percent ?? 0}
            riceWork={profile.rice_work}
            lifeWork={profile.life_work}
            compact
          />
        </div>

        {/* Seed stage */}
        <div className="mt-3 pt-3 border-t border-border">
          <SeedStage count={totalSeeds} showProgress />
        </div>

        {/* Shops — the actual storefront */}
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

        {/* Aspirations */}
        <AspireButton profile={profile} isOwner={isOwner} />

        {/* Mentorships */}
        <MentorshipSection profile={profile} isOwner={isOwner} />

        {/* Primary action */}
        <div className="mt-4">
          {isOwner ? (
            <Link href="/settings/profile" className="block no-underline">
              <Button variant="secondary" size="md" className="w-full">
                ✏️ マイページを編集
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setShowContact(true)}
            >
              💬 連絡を取る
            </Button>
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
