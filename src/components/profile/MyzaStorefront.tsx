"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
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
    profile.life_work_years ? `${profile.life_work_years}年目` : null,
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
          <div className="h-28 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent" />
        )}

        <div className="p-4 -mt-8 relative">

        {/* Top row: Avatar + actions */}
        <div className="flex items-start justify-between">
          <Avatar src={profile.avatar_url} alt={profile.display_name} size="lg" />
          <div className="flex gap-1">
            <button
              onClick={() => setShowQR(true)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-sm hover:bg-bg"
              title="QRコード"
              aria-label="QRコード"
            >
              📱
            </button>
            {!isOwner && (
              <button
                onClick={() => setShowContact(true)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-sm hover:bg-bg"
                title="連絡"
                aria-label="連絡"
              >
                💬
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mt-2">
          <h1 className="text-lg font-bold flex items-center gap-1.5 flex-wrap">
            {profile.display_name}
            {badges.length > 0 && <BadgeList badges={badges} />}
          </h1>
          {levelText && (
            <p className="text-xs text-text-sub mt-0.5">{levelText}</p>
          )}
          {location && (
            <p className="text-xs text-text-mute mt-0.5">📍 {location}</p>
          )}
        </div>

        {/* Status line */}
        {profile.status_line && (
          <div className="mt-3 bg-accent/5 border border-accent/20 rounded-xl px-3 py-2">
            <p className="text-xs text-text-sub">
              <span className="text-accent font-medium">今：</span>
              {profile.status_line}
            </p>
          </div>
        )}

        {/* Migration bar */}
        <div className="mt-4">
          <div className="text-xs text-text-mute mb-1.5">🌾 ライフワーク移行度</div>
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
              <div className="text-xs text-text-mute">🏪 出品中の屋台</div>
              {isOwner && (
                <Link href="/settings/shops" className="text-xs text-accent no-underline hover:underline">
                  {shops.length > 0 ? "管理" : "+ 屋台を出す"}
                </Link>
              )}
            </div>
            {shops.length === 0 && isOwner && (
              <div className="text-center py-4 border border-dashed border-border rounded-xl">
                <p className="text-xs text-text-mute mb-2">まだ屋台がありません</p>
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
                ✏️ MY座を編集
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
