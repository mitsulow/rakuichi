"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="連絡を取る">
      <div className="space-y-3">
        {/* Internal chat */}
        <button
          onClick={handleStartChat}
          disabled={starting}
          className="w-full flex items-center gap-3 p-3 bg-accent-soft hover:bg-accent-soft/80 rounded-xl transition-colors text-left disabled:opacity-60"
        >
          <span className="text-xl">💬</span>
          <div>
            <div className="font-medium text-sm text-accent">
              {starting ? "準備中..." : "文を送る（楽市楽座内チャット）"}
            </div>
            <div className="text-xs text-text-sub">
              取引の提案もここから
            </div>
          </div>
        </button>

        {/* External links */}
        {externalLinks.length > 0 && (
          <>
            <div className="text-xs text-text-mute text-center">
              または外部リンクで直接
            </div>
            {externalLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS.find(
                (p) => p.id === link.platform
              );
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 bg-bg hover:bg-border/50 rounded-xl transition-colors no-underline text-left"
                >
                  <span className="text-xl">{platform?.icon || "🔗"}</span>
                  <div>
                    <div className="font-medium text-sm text-text">
                      {platform?.label || "外部リンク"}
                    </div>
                    <div className="text-xs text-text-mute truncate max-w-[250px]">
                      {link.url}
                    </div>
                  </div>
                </a>
              );
            })}
          </>
        )}
      </div>
    </Modal>
  );
}
