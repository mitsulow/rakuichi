"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { respondToTradeProposal, markTradeCompleted } from "@/lib/data";
import type { TradeProposal } from "@/lib/types";

interface TradeProposalCardProps {
  proposal: TradeProposal;
  currentUserId: string;
  onUpdate: (proposal: TradeProposal) => void;
  onWriteDiary?: (proposal: TradeProposal) => void;
}

export function TradeProposalCard({
  proposal,
  currentUserId,
  onUpdate,
  onWriteDiary,
}: TradeProposalCardProps) {
  const [busy, setBusy] = useState(false);

  const isProposer = proposal.proposer_id === currentUserId;
  const isRecipient = proposal.recipient_id === currentUserId;

  const typeEmoji =
    proposal.trade_type === "cash"
      ? "💴"
      : proposal.trade_type === "barter"
      ? "🔄"
      : "🪙";

  const typeLabel =
    proposal.trade_type === "cash"
      ? "日本円で支払う"
      : proposal.trade_type === "barter"
      ? "物々交換"
      : "投げ銭";

  const handleRespond = async (status: "accepted" | "rejected" | "cancelled") => {
    if (busy) return;
    setBusy(true);
    const result = await respondToTradeProposal(proposal.id, status);
    setBusy(false);
    if (result.data) onUpdate(result.data as TradeProposal);
  };

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);
    const result = await markTradeCompleted(proposal.id);
    setBusy(false);
    if (!result.error) {
      onUpdate({ ...proposal, status: "completed", completed_at: new Date().toISOString() });
    }
  };

  const statusBadge = () => {
    switch (proposal.status) {
      case "pending":
        return <span className="text-amber-600 text-[10px]">⏳ 返事待ち</span>;
      case "accepted":
        return <span className="text-green-600 text-[10px]">✓ 承認済み</span>;
      case "rejected":
        return <span className="text-red-500 text-[10px]">✗ お断り</span>;
      case "cancelled":
        return <span className="text-text-mute text-[10px]">取消</span>;
      case "completed":
        return <span className="text-accent text-[10px]">🎉 取引完了</span>;
    }
  };

  return (
    <div className="w-full max-w-[85%] mx-auto my-2 border-2 border-accent/30 bg-accent/5 rounded-2xl overflow-hidden">
      <div className="bg-accent/10 px-3 py-1.5 text-xs font-medium flex items-center justify-between">
        <span>🔄 取引提案</span>
        {statusBadge()}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeEmoji}</span>
          <div className="flex-1">
            <div className="text-xs text-text-mute">{typeLabel}</div>
            <div className="text-base font-bold">
              {proposal.trade_type === "cash" && proposal.amount_jpy != null
                ? `¥${proposal.amount_jpy.toLocaleString()}`
                : proposal.trade_type === "tip" && proposal.amount_jpy != null
                ? `¥${proposal.amount_jpy.toLocaleString()}（投げ銭）`
                : proposal.trade_type === "barter"
                ? proposal.barter_offer
                : "—"}
            </div>
          </div>
        </div>

        {proposal.note && (
          <p className="text-xs bg-bg-card rounded-lg p-2 text-text-sub">
            {proposal.note}
          </p>
        )}

        {/* Actions depending on status and role */}
        {proposal.status === "pending" && isRecipient && (
          <div className="flex gap-1.5 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRespond("rejected")}
              disabled={busy}
              className="flex-1"
            >
              お断り
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRespond("accepted")}
              disabled={busy}
              className="flex-1"
            >
              ✓ 承認する
            </Button>
          </div>
        )}

        {proposal.status === "pending" && isProposer && (
          <button
            onClick={() => handleRespond("cancelled")}
            disabled={busy}
            className="text-[10px] text-text-mute underline"
          >
            提案を取り消す
          </button>
        )}

        {proposal.status === "accepted" && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-text-mute">
              取引の内容でやり取りして、完了したら「取引完了」を押そう
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              disabled={busy}
              className="w-full"
            >
              🎉 取引完了にする
            </Button>
          </div>
        )}

        {proposal.status === "completed" && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-text-mute">
              交換日記を書くと、お互いのマイページに残ります
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onWriteDiary?.(proposal)}
              className="w-full"
            >
              📖 交換日記を書く
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
