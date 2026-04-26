"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import { RichBody } from "@/components/feed/RichBody";
import {
  fetchCalloutById,
  joinCallout,
  leaveCallout,
  setCalloutStatus,
  deleteCallout,
} from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { Callout, Profile } from "@/lib/types";

interface ParticipantRow {
  user_id: string;
  comment: string | null;
  joined_at: string;
  profile: Profile | null;
}

interface CalloutWithDetail extends Callout {
  participants?: ParticipantRow[];
}

export default function CalloutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [callout, setCallout] = useState<CalloutWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  const reload = async () => {
    const c = await fetchCalloutById(id, user?.id);
    setCallout(c as CalloutWithDetail | null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await fetchCalloutById(id, user?.id);
      if (!cancelled) {
        setCallout(c as CalloutWithDetail | null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  if (loading) return <LoadingScreen step="呼びかけを読み込み中..." />;
  if (!callout) notFound();

  const isAuthor = user?.id === callout.user_id;
  const hasJoined = callout.user_has_joined ?? false;
  const isOpen = callout.status === "open";

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setJoining(true);
    const result = await joinCallout(callout.id, user.id, comment || undefined);
    setJoining(false);
    if (result.error) {
      alert(`指をあげられませんでした: ${result.error}`);
      return;
    }
    setComment("");
    setShowCommentBox(false);
    await reload();
  };

  const handleLeave = async () => {
    if (!user) return;
    if (!confirm("指を下ろしますか？")) return;
    const result = await leaveCallout(callout.id, user.id);
    if (result.error) {
      alert(`失敗: ${result.error}`);
      return;
    }
    await reload();
  };

  const handleClose = async () => {
    if (!confirm("この呼びかけを締め切りますか？")) return;
    await setCalloutStatus(callout.id, "closed");
    await reload();
  };

  const handleComplete = async () => {
    if (!confirm("この呼びかけを「達成」にしますか？")) return;
    await setCalloutStatus(callout.id, "completed");
    await reload();
  };

  const handleDelete = async () => {
    if (!confirm("この呼びかけを削除しますか？")) return;
    const result = await deleteCallout(callout.id);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    router.push("/callouts");
  };

  return (
    <div className="space-y-3">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-text-sub hover:text-accent"
      >
        ← 一覧に戻る
      </button>

      {/* Header */}
      <div
        className="rounded-2xl border-2 px-4 py-3 relative overflow-hidden"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: "#c94d3a" }}
        />
        <div className="flex items-center gap-2 mb-1.5">
          {!isOpen && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                callout.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-text-mute/20 text-text-mute"
              }`}
            >
              {callout.status === "completed" ? "✅ 達成" : "🚪 締め切り"}
            </span>
          )}
          {callout.prefecture && (
            <span className="text-[10px] text-text-mute">
              📍 {callout.prefecture}
            </span>
          )}
          <span className="text-[10px] text-text-mute ml-auto">
            {formatRelativeTime(callout.created_at)}
          </span>
        </div>
        <h1 className="text-lg font-bold leading-tight">{callout.title}</h1>
        {callout.author && (
          <Link
            href={`/u/${callout.author.username}`}
            className="flex items-center gap-2 mt-2 no-underline"
          >
            <Avatar
              src={callout.author.avatar_url}
              alt={callout.author.display_name}
              size="sm"
            />
            <span className="text-xs font-medium text-text">
              {callout.author.display_name}
            </span>
          </Link>
        )}
      </div>

      {/* Body */}
      {callout.body && (
        <Card>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            <RichBody body={callout.body} />
          </p>
        </Card>
      )}

      {/* Needed skills */}
      {callout.needed_skills.length > 0 && (
        <div>
          <p className="text-xs text-text-sub font-medium mb-1.5 px-1">
            🛠 ほしいスキル・特技
          </p>
          <div className="flex flex-wrap gap-1.5">
            {callout.needed_skills.map((s) => (
              <Link
                key={s}
                href={`/skills?q=${encodeURIComponent(s)}`}
                className="text-xs bg-accent/10 text-accent rounded-full px-2.5 py-1 font-medium no-underline hover:bg-accent/20"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action — join / leave / login */}
      {isOpen && !isAuthor && (
        <div className="sticky bottom-20 md:static z-10 space-y-2">
          {hasJoined ? (
            <div
              className="rounded-xl border-2 border-accent/40 px-3 py-2.5 text-center"
              style={{ background: "#fdf6e9" }}
            >
              <p className="text-sm font-bold text-accent">
                🤚 あなたは指をあげています
              </p>
              <button
                onClick={handleLeave}
                className="text-[11px] text-text-mute underline mt-1"
              >
                指を下ろす
              </button>
            </div>
          ) : (
            <>
              {showCommentBox && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="一言（任意）：何ができる？どう関わりたい？"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
                  maxLength={300}
                />
              )}
              <div className="flex gap-2">
                {!showCommentBox && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setShowCommentBox(true)}
                    className="flex-1"
                  >
                    💬 一言添える
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleJoin}
                  disabled={joining}
                  className={showCommentBox ? "w-full" : "flex-1"}
                >
                  {joining ? "..." : "🤚 指をあげる"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Author actions */}
      {isAuthor && (
        <div className="flex gap-2">
          {isOpen ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={handleComplete}
                className="flex-1"
              >
                ✅ 達成にする
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleClose}
                className="flex-1"
              >
                🚪 締め切る
              </Button>
            </>
          ) : (
            <button
              onClick={async () => {
                await setCalloutStatus(callout.id, "open");
                await reload();
              }}
              className="flex-1 text-xs text-accent underline"
            >
              ↻ 再開する
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 underline px-2"
          >
            🗑 削除
          </button>
        </div>
      )}

      {/* Participants */}
      <div>
        <p className="text-xs text-text-sub font-medium mb-1.5 px-1">
          🤚 指をあげている人（{callout.participant_count ?? 0}人）
        </p>
        {(!callout.participants || callout.participants.length === 0) ? (
          <p className="text-xs text-text-mute py-4 text-center">
            まだ誰もいません。一番最初の指になろう
          </p>
        ) : (
          <div className="space-y-1.5">
            {callout.participants.map((p) =>
              p.profile ? (
                <Link
                  key={p.user_id}
                  href={`/u/${p.profile.username}`}
                  className="no-underline block"
                >
                  <div className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow p-2.5 flex items-start gap-2.5">
                    <Avatar
                      src={p.profile.avatar_url}
                      alt={p.profile.display_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {p.profile.display_name}
                      </div>
                      {p.comment && (
                        <p className="text-[11px] text-text-sub mt-0.5 line-clamp-2">
                          「{p.comment}」
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-text-mute">
                      {formatRelativeTime(p.joined_at)}
                    </span>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
