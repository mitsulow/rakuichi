"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { SnsIcon, getPlatformLabel } from "@/components/ui/SnsIcon";
import { createClient } from "@/lib/supabase/client";
import { findOrCreateChat } from "@/lib/data";
import type { Profile, ExternalLink } from "@/lib/types";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  externalLinks: ExternalLink[];
}

export function ContactModal({
  isOpen,
  onClose,
  profile,
  externalLinks,
}: ContactModalProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStartChat = async () => {
    if (starting) return;
    setStarting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      setStarting(false);
      return;
    }
    const chatId = await findOrCreateChat(profile.id);
    setStarting(false);
    if (!chatId) {
      alert("チャットの作成に失敗しました");
      return;
    }
    onClose();
    router.push(`/chat/${chatId}`);
  };

  // Pull LINE / Instagram out so they can be primary CTAs
  const lineLink = externalLinks.find((l) => l.platform === "line");
  const instaLink = externalLinks.find((l) => l.platform === "instagram");
  const otherLinks = externalLinks.filter(
    (l) => l.platform !== "line" && l.platform !== "instagram"
  );
  const hasLine = !!profile.line_qr_url || !!lineLink;

  // Extract Instagram username and build a DM-compose URL (ig.me/m/{user}).
  // Falls back to the profile URL if extraction fails.
  const instaUsername = instaLink
    ? (instaLink.url.match(/instagram\.com\/([^/?#]+)/i)?.[1] ?? null)
    : null;
  const instaDmUrl = instaUsername
    ? `https://ig.me/m/${instaUsername}`
    : instaLink?.url ?? null;

  const [showQR, setShowQR] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="連絡を取る">
      <div className="space-y-3">
        <p className="text-[11px] text-text-mute -mt-1">
          一番気軽な方法から好きなものを選んでね
        </p>

        {/* Internal chat — primary */}
        <button
          onClick={handleStartChat}
          disabled={starting}
          className="w-full flex items-center gap-3 p-3 bg-accent-soft hover:bg-accent-soft/80 rounded-xl transition-colors text-left disabled:opacity-60"
        >
          <span className="text-xl">💬</span>
          <div>
            <div className="font-medium text-sm text-accent">
              {starting ? "準備中..." : "楽市楽座の手紙で連絡"}
            </div>
            <div className="text-xs text-text-sub">
              取引の提案・物々交換もここから
            </div>
          </div>
        </button>

        {/* Instagram DM — most casual external option */}
        {instaDmUrl && (
          <a
            href={instaDmUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3 rounded-xl no-underline text-left text-white hover:opacity-90 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <SnsIcon platform="instagram" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">
                📷 InstagramのDMで連絡
              </div>
              <div className="text-[11px] opacity-90 truncate">
                {instaUsername ? `@${instaUsername}` : instaLink?.url}
              </div>
            </div>
            <span className="text-base flex-shrink-0">→</span>
          </a>
        )}

        {/* Email — prefer custom contact_email, else Google email if consented */}
        {(() => {
          const displayEmail =
            profile.contact_email ??
            (profile.email_share_consent === true ? profile.email : null);
          if (!displayEmail) return null;
          return (
            <a
              href={`mailto:${displayEmail}?subject=${encodeURIComponent(
                `楽市楽座より：${profile.display_name}さんへ`
              )}`}
              onClick={onClose}
              className="w-full flex items-center gap-3 p-3 rounded-xl no-underline text-left hover:opacity-90 transition-opacity"
              style={{
                background:
                  "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
                border: "2px solid #c94d3a40",
              }}
            >
              <span className="text-xl">✉</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-text">
                  メールで連絡
                </div>
                <div className="text-xs text-text-sub truncate">
                  {displayEmail}
                </div>
              </div>
              <span className="text-base flex-shrink-0 text-accent">→</span>
            </a>
          );
        })()}

        {/* LINE — primary external (when available) */}
        {hasLine ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "#06C755" }}
          >
            {profile.line_qr_url ? (
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center gap-3 p-3 text-left text-white hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <SnsIcon platform="line" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">
                    📱 LINEのQRコードを見せる
                  </div>
                  <div className="text-[11px] opacity-90">
                    自分のスマホでスキャンして友だち追加
                  </div>
                </div>
                <span className="text-base flex-shrink-0">
                  {showQR ? "▲" : "▼"}
                </span>
              </button>
            ) : null}
            {showQR && profile.line_qr_url && (
              <div className="bg-white p-4 flex flex-col items-center gap-2">
                <img
                  src={profile.line_qr_url}
                  alt={`${profile.display_name}のLINE QRコード`}
                  className="w-56 h-56 object-contain"
                />
                <p className="text-[11px] text-text-sub text-center">
                  📷 自分のスマホのカメラで このQR を写してください<br />
                  「LINE で開く」が出たらタップ → 友だち追加
                </p>
              </div>
            )}
            {lineLink && (
              <a
                href={lineLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`w-full flex items-center gap-3 p-3 no-underline text-left text-white hover:opacity-90 transition-opacity ${
                  profile.line_qr_url ? "border-t border-white/20" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  🔗
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">
                    LINE のリンクで開く
                  </div>
                  <div className="text-xs opacity-90 truncate">
                    {lineLink.url}
                  </div>
                </div>
                <span className="text-base flex-shrink-0">→</span>
              </a>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg/50 border border-dashed border-border text-left">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 opacity-50">
              <SnsIcon platform="line" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-text-mute">
                LINEは未登録
              </div>
              <div className="text-[11px] text-text-mute/80">
                {profile.display_name} さんが LINE のQRや リンクを登録すると、
                ここから直接トークできるようになります
              </div>
            </div>
          </div>
        )}

        {/* Other external links */}
        {otherLinks.length > 0 && (
          <>
            <div className="text-xs text-text-mute text-center pt-1">
              または別のSNSで
            </div>
            {otherLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-3 p-3 bg-bg hover:bg-border/50 rounded-xl transition-colors no-underline text-left"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <SnsIcon platform={link.platform} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-text">
                    {getPlatformLabel(link.platform)}
                  </div>
                  <div className="text-xs text-text-mute truncate">
                    {link.url}
                  </div>
                </div>
              </a>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}
