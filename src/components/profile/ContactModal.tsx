"use client";

import { Modal } from "@/components/ui/Modal";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="連絡を取る">
      <div className="space-y-3">
        {/* Internal chat */}
        <button className="w-full flex items-center gap-3 p-3 bg-accent-soft hover:bg-accent-soft/80 rounded-xl transition-colors text-left">
          <span className="text-xl">💬</span>
          <div>
            <div className="font-medium text-sm text-accent">
              チャットで相談
            </div>
            <div className="text-xs text-text-sub">楽市楽座内チャット</div>
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
