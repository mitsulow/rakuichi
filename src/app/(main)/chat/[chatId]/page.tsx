"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  fetchChatMessages,
  sendMessage,
  fetchChatMembers,
  fetchChatProposals,
} from "@/lib/data";
import { TradeProposalModal } from "@/components/chat/TradeProposalModal";
import { TradeProposalCard } from "@/components/chat/TradeProposalCard";
import { TradeDiaryModal } from "@/components/chat/TradeDiaryModal";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { Message, Profile, TradeProposal } from "@/lib/types";

type Item =
  | { kind: "message"; data: Message & { sender?: Profile } }
  | { kind: "proposal"; data: TradeProposal };

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherMember, setOtherMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<(Message & { sender?: Profile })[]>([]);
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [diaryForProposal, setDiaryForProposal] = useState<TradeProposal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshProposals = useCallback(async () => {
    const p = await fetchChatProposals(chatId);
    setProposals(p as TradeProposal[]);
  }, [chatId]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      const [msgs, members, props] = await Promise.all([
        fetchChatMessages(chatId),
        fetchChatMembers(chatId),
        fetchChatProposals(chatId),
      ]);

      setMessages(msgs as (Message & { sender?: Profile })[]);
      setProposals(props as TradeProposal[]);
      const other = (members as unknown as Profile[]).find((m) => m.id !== session.user.id);
      setOtherMember(other ?? null);
      setLoading(false);

      // Realtime subscription for messages
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          async () => {
            const fresh = await fetchChatMessages(chatId);
            setMessages(fresh as (Message & { sender?: Profile })[]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "trade_proposals",
            filter: `chat_id=eq.${chatId}`,
          },
          () => {
            refreshProposals();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    init();
  }, [chatId, router, refreshProposals]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, proposals]);

  const handleSend = async () => {
    const body = newMessage.trim();
    if (!body || !currentUserId || sending) return;
    setSending(true);

    // Timeout so the button never stays disabled forever
    const result = await Promise.race([
      sendMessage(chatId, currentUserId, body),
      new Promise<{ data: null; error: string }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: "タイムアウト（ネットワーク不調）" }),
          10000
        )
      ),
    ]);

    setSending(false);

    if (result.error || !result.data) {
      alert(`送信に失敗: ${result.error ?? "不明なエラー"}`);
      return;
    }
    setMessages((prev) => [...prev, result.data as Message & { sender?: Profile }]);
    setNewMessage("");
  };

  if (loading || !currentUserId) {
    return <LoadingScreen step="会話を読み込み中..." />;
  }

  // Merge messages and proposals into a single timeline
  const items: Item[] = [
    ...messages.map((m) => ({ kind: "message" as const, data: m })),
    ...proposals.map((p) => ({ kind: "proposal" as const, data: p })),
  ].sort(
    (a, b) =>
      new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime()
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with back + other member */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="w-9 h-9 rounded-full hover:bg-bg flex items-center justify-center text-lg -ml-1"
        >
          ←
        </button>
        {otherMember && (
          <Link
            href={`/u/${otherMember.username}`}
            className="flex items-center gap-2 no-underline flex-1"
          >
            <Avatar src={otherMember.avatar_url} alt={otherMember.display_name} size="sm" />
            <span className="text-sm font-medium">{otherMember.display_name}</span>
          </Link>
        )}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-3">
        {items.length === 0 && (
          <div className="text-center py-8 text-text-mute text-sm">
            文はまだありません。最初の挨拶を送ってみよう
          </div>
        )}
        {items.map((item) => {
          if (item.kind === "proposal") {
            return (
              <TradeProposalCard
                key={`p-${item.data.id}`}
                proposal={item.data}
                currentUserId={currentUserId}
                onUpdate={(updated) => {
                  setProposals((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  );
                }}
                onWriteDiary={(p) => setDiaryForProposal(p)}
              />
            );
          }

          const msg = item.data;
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
            >
              {!isMine && msg.sender && (
                <Avatar
                  src={msg.sender.avatar_url}
                  alt={msg.sender.display_name}
                  size="sm"
                />
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                  isMine
                    ? "bg-accent text-white rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    isMine ? "text-white/70" : "text-text-mute"
                  }`}
                >
                  {formatRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border pt-3 space-y-2">
        {/* Trade proposal button - prominent */}
        {otherMember && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTradeModal(true)}
            className="w-full"
          >
            🔄 取引を提案する（日本円 / 物々交換 / 投げ銭）
          </Button>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="文を送る..."
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-accent text-white rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            {sending ? "..." : "送信"}
          </button>
        </div>
      </div>

      {otherMember && (
        <TradeProposalModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          chatId={chatId}
          proposerId={currentUserId}
          recipientId={otherMember.id}
          onCreated={(p) => {
            setProposals((prev) => [...prev, p]);
          }}
        />
      )}

      {diaryForProposal && otherMember && (
        <TradeDiaryModal
          isOpen={true}
          onClose={() => setDiaryForProposal(null)}
          authorId={currentUserId}
          partnerId={otherMember.id}
          partnerName={otherMember.display_name}
          proposalId={diaryForProposal.id}
          onSaved={() => setDiaryForProposal(null)}
        />
      )}
    </div>
  );
}
