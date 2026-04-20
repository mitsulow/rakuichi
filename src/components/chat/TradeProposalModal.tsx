"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createTradeProposal } from "@/lib/data";
import type { TradeProposal } from "@/lib/types";

interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  proposerId: string;
  recipientId: string;
  onCreated: (proposal: TradeProposal) => void;
}

type TradeType = "cash" | "barter" | "tip";

export function TradeProposalModal({
  isOpen,
  onClose,
  chatId,
  proposerId,
  recipientId,
  onCreated,
}: TradeProposalModalProps) {
  const [type, setType] = useState<TradeType>("cash");
  const [amount, setAmount] = useState("");
  const [barterOffer, setBarterOffer] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (submitting) return;
    if (type === "cash" && !amount) return;
    if (type === "barter" && !barterOffer.trim()) return;

    setSubmitting(true);
    const result = await createTradeProposal({
      chatId,
      proposerId,
      recipientId,
      tradeType: type,
      amountJpy: type === "cash" ? parseInt(amount) : null,
      barterOffer: type === "barter" ? barterOffer.trim() : null,
      note: note.trim() || null,
    });
    setSubmitting(false);

    if (result.error || !result.data) {
      alert(`送信に失敗: ${result.error}`);
      return;
    }
    onCreated(result.data as TradeProposal);
    setAmount("");
    setBarterOffer("");
    setNote("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">🔄 取引を提案する</h2>
          <button
            onClick={onClose}
            className="text-text-mute hover:text-text text-lg"
          >
            ✕
          </button>
        </div>

        {/* Type selection */}
        <div className="grid grid-cols-3 gap-1.5">
          <TypeButton
            active={type === "cash"}
            onClick={() => setType("cash")}
            emoji="💴"
            label="日本円"
          />
          <TypeButton
            active={type === "barter"}
            onClick={() => setType("barter")}
            emoji="🔄"
            label="物々交換"
          />
          <TypeButton
            active={type === "tip"}
            onClick={() => setType("tip")}
            emoji="🪙"
            label="投げ銭"
          />
        </div>

        {/* Fields */}
        {type === "cash" && (
          <div>
            <label className="text-xs text-text-mute block mb-1">金額</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="3000"
                min="0"
                className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <span className="text-sm text-text-sub">円</span>
            </div>
          </div>
        )}

        {type === "barter" && (
          <div>
            <label className="text-xs text-text-mute block mb-1">
              代わりに何を提供する？
            </label>
            <textarea
              value={barterOffer}
              onChange={(e) => setBarterOffer(e.target.value)}
              rows={2}
              placeholder="例：ヨガレッスン1回"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {type === "tip" && (
          <div>
            <label className="text-xs text-text-mute block mb-1">
              金額（気持ち）
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min="0"
                className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <span className="text-sm text-text-sub">円</span>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-text-mute block mb-1">
            ひとこと（任意）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="受けたいサービスや希望日時など"
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
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "送信中..." : "提案する"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-xl text-xs border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "bg-bg border-border hover:bg-bg-card"
      }`}
    >
      <div className="text-xl mb-0.5">{emoji}</div>
      {label}
    </button>
  );
}
