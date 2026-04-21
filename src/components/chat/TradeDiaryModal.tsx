"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createTradeRecord } from "@/lib/data";

interface TradeDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: string;
  partnerId: string;
  partnerName: string;
  proposalId?: string | null;
  onSaved: () => void;
}

export function TradeDiaryModal({
  isOpen,
  onClose,
  authorId,
  partnerId,
  partnerName,
  proposalId,
  onSaved,
}: TradeDiaryModalProps) {
  const [title, setTitle] = useState("");
  const [diary, setDiary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !diary.trim() || submitting) return;
    setSubmitting(true);
    const result = await createTradeRecord(
      authorId,
      partnerId,
      title.trim(),
      diary.trim(),
      proposalId ?? null
    );
    setSubmitting(false);
    if (result.error) {
      alert(`保存に失敗: ${result.error}`);
      return;
    }
    setTitle("");
    setDiary("");
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">📖 交換日記を書く</h2>
          <button
            onClick={onClose}
            className="text-text-mute hover:text-text text-lg"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-text-mute bg-accent/5 rounded-lg p-2.5">
          <span className="font-medium text-text-sub">{partnerName}</span>
          さんとの交換を振り返って一言。
          マイページに公開されて、これから出会う人の参考になります。
        </p>

        <div>
          <label className="text-xs text-text-mute block mb-1">交換したもの</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：陶芸体験60分 ⇄ ヨガレッスン"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">ひとこと</label>
          <textarea
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
            rows={4}
            placeholder="どんな出会いだった？どんな気持ち？"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            あとで
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!title.trim() || !diary.trim() || submitting}
            className="flex-1"
          >
            {submitting ? "保存中..." : "📖 書き残す"}
          </Button>
        </div>
      </div>
    </div>
  );
}
