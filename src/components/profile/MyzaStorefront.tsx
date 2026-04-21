"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { SnsIcon, getPlatformLabel } from "@/components/ui/SnsIcon";
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

  const levelText = [
    profile.life_work,
    profile.life_work_level,
    profile.life_work_years ? `移行${profile.life_work_years}年目` : null,
  ]
    .filter(Boolean)
    .join(" ・ ");

  const location = [profile.prefecture, profile.city].filter(Boolean).join(" ");

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
            <div className="flex gap-1 ml-auto mb-1">
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

          {/* Life work — the BIG headline */}
          {profile.life_work && (
            <div className="mt-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[10px] text-text-mute tracking-widest">
                  生業（なりわい）
                </span>
                <span className="text-base font-bold text-accent">
                  {profile.life_work}
                </span>
                {profile.life_work_years != null && profile.life_work_years > 0 && (
                  <span className="text-xs text-text-sub">
                    移行{profile.life_work_years}年目
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <p className="text-xs text-text-mute mt-1">📍 {location}</p>
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
              <div className="text-xs text-text-mute">🏪 出品中の楽座</div>
              {isOwner && (
                <Link href="/settings/shops" className="text-xs text-accent no-underline hover:underline">
                  {shops.length > 0 ? "管理" : "+ 楽座を出す"}
                </Link>
              )}
            </div>
            {shops.length === 0 && isOwner && (
              <div className="text-center py-4 border border-dashed border-border rounded-xl">
                <p className="text-xs text-text-mute mb-2">まだ楽座がありません</p>
                <Link href="/settings/shops" className="no-underline">
                  <span className="text-xs text-accent">🌱 お試しで1つ出してみる →</span>
                </Link>
              </div>
            )}
            <div className="space-y-2">
              {shops.slice(0, 3).map((shop) => (
                <div
                  key={shop.id}
                  className="border border-border rounded-xl p-2.5 flex items-center gap-2.5"
                >
                  {shop.image_urls && shop.image_urls.length > 0 ? (
                    <img
                      src={shop.image_urls[0]}
                      alt={shop.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <CategoryTag categoryId={shop.category} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{shop.name}</div>
                    {shop.description && (
                      <div className="text-xs text-text-mute line-clamp-1">{shop.description}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-xs">
                    {shop.is_trial ? (
                      <span className="text-accent font-medium">お試し</span>
                    ) : shop.price_jpy != null ? (
                      <span className="text-accent font-medium">
                        ¥{shop.price_jpy.toLocaleString()}
                      </span>
                    ) : shop.price_text ? (
                      <span className="text-accent font-medium">{shop.price_text}</span>
                    ) : null}
                    <div className="flex gap-0.5 text-[10px] text-text-mute">
                      {shop.accepts_barter && <span title="物々交換可">🔄</span>}
                      {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
