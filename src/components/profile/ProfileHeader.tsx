"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContactModal } from "./ContactModal";
import { QRModal } from "./QRModal";
import type { Profile, Badge, ExternalLink } from "@/lib/types";

interface ProfileHeaderProps {
  profile: Profile;
  badges: Badge[];
  externalLinks: ExternalLink[];
  isOwner?: boolean;
}

export function ProfileHeader({ profile, badges, externalLinks, isOwner = false }: ProfileHeaderProps) {
  const [showContact, setShowContact] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const levelDisplay = profile.life_work_level
    ? `${profile.life_work_level}・${profile.life_work || ""}${
        profile.life_work_years ? `${profile.life_work_years}年` : ""
      }`
    : null;

  return (
    <>
      {/* Cover image */}
      {profile.cover_url && (
        <div className="h-32 -mx-4 -mt-4 mb-4 overflow-hidden rounded-t-2xl">
          <img
            src={profile.cover_url}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        </div>
      )}

      <div className="flex flex-col items-center text-center relative">
        {/* QR button */}
        <button
          onClick={() => setShowQR(true)}
          className="absolute top-0 right-0 text-text-mute hover:text-text text-sm p-1"
          title="QRコード"
        >
          📱
        </button>

        {/* Avatar */}
        <Avatar src={profile.avatar_url} alt={profile.display_name} size="xl" />

        {/* Name + badges */}
        <h1 className="text-xl font-bold mt-3 flex items-center gap-2">
          {profile.display_name}
          <BadgeList badges={badges} />
        </h1>

        {/* Level */}
        {levelDisplay && (
          <p className="text-sm text-text-sub mt-1">{levelDisplay}</p>
        )}

        {/* Location */}
        {(profile.prefecture || profile.city) && (
          <p className="text-sm text-text-mute mt-1">
            📍 {profile.prefecture}
            {profile.city ? ` ${profile.city}` : ""}
          </p>
        )}

        {/* Action buttons */}
        {isOwner ? (
          <Link href="/settings/profile" className="mt-4 w-full max-w-xs no-underline">
            <Button variant="secondary" size="lg" className="w-full">
              ✏️ プロフィールを編集
            </Button>
          </Link>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full max-w-xs"
            onClick={() => setShowContact(true)}
          >
            連絡を取る
          </Button>
        )}
      </div>

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
