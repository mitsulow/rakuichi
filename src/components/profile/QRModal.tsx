"use client";

import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui/Modal";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export function QRModal({
  isOpen,
  onClose,
  username,
  displayName,
}: QRModalProps) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : `/u/${username}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QRコード">
      <div className="flex flex-col items-center gap-4">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#2a2a2a"
          level="M"
        />
        <p className="text-sm text-text-sub text-center">
          {displayName}さんのMy座
        </p>
        <p className="text-xs text-text-mute text-center break-all">{url}</p>
      </div>
    </Modal>
  );
}
