"use client";

import { use, useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { RichBody } from "@/components/feed/RichBody";
import {
  fetchKomeFieldById,
  joinKomeField,
  leaveKomeField,
  setKomeFieldStatus,
  deleteKomeField,
} from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { KomeField, Profile } from "@/lib/types";

interface HelperRow {
  user_id: string;
  comment: string | null;
  joined_at: string;
  profile: Profile | null;
}

interface KomeFieldWithDetail extends KomeField {
  helpers?: HelperRow[];
}

export default function KomeFieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [field, setField] = useState<KomeFieldWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const reload = async () => {
    const f = await fetchKomeFieldById(id, user?.id);
    setField(f as KomeFieldWithDetail | null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const f = await fetchKomeFieldById(id, user?.id);
      if (!cancelled) {
        setField(f as KomeFieldWithDetail | null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  if (loading) return <LoadingScreen step="田んぼを読み込み中..." />;
  if (!field) notFound();

  const isOwner = user?.id === field.owner_user_id;
  const hasJoined = field.user_has_joined ?? false;
  const isOpen = field.status === "open";
  const hasImages = field.image_urls && field.image_urls.length > 0;

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    const result = await joinKomeField(field.id, user.id, comment || undefined);
    setBusy(false);
    if (result.error) {
      toast.show(`参加できませんでした: ${result.error}`, "error");
      return;
    }
    setComment("");
    setShowCommentBox(false);
    toast.show("🌾 MY農家として登録しました", "success");
    await reload();
  };

  const handleLeave = async () => {
    if (!user) return;
    if (!confirm("MY農家から外れますか？")) return;
    const result = await leaveKomeField(field.id, user.id);
    if (result.error) {
      toast.show(`失敗: ${result.error}`, "error");
      return;
    }
    await reload();
  };

  const handleClose = async () => {
    if (!confirm("募集を締め切りますか？")) return;
    await setKomeFieldStatus(field.id, "closed");
    await reload();
  };

  const handleComplete = async () => {
    if (!confirm("この田んぼを「完了」にしますか？")) return;
    await setKomeFieldStatus(field.id, "completed");
    await reload();
  };

  const handleDelete = async () => {
    if (!confirm("この田んぼを削除しますか？")) return;
    const result = await deleteKomeField(field.id);
    if (result.error) {
      toast.show(`削除に失敗: ${result.error}`, "error");
      return;
    }
    router.push("/kome");
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.back()}
        className="text-sm text-text-sub hover:text-accent"
      >
        ← 米部に戻る
      </button>

      {/* Hero image carousel */}
      {hasImages && (
        <div className="-mx-4">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="block w-full aspect-[16/9] overflow-hidden bg-bg cursor-zoom-in"
          >
            <img
              src={field.image_urls[0]}
              alt={field.name}
              className="w-full h-full object-cover"
            />
          </button>
          {field.image_urls.length > 1 && (
            <div className="flex gap-1 px-4 py-2 overflow-x-auto hide-scrollbar">
              {field.image_urls.slice(1).map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i + 1)}
                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {lightboxIndex !== null && hasImages && (
        <ImageLightbox
          images={field.image_urls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Status + name + location */}
      <div
        className="rounded-2xl border-2 px-4 py-3 relative overflow-hidden"
        style={{
          borderColor: "#5a7d4a40",
          background:
            "linear-gradient(135deg, #f5e8d5 0%, #e8e6c8 100%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: "#5a7d4a" }}
        />
        <div className="flex items-center gap-2 mb-1">
          {!isOpen && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                field.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-text-mute/20 text-text-mute"
              }`}
            >
              {field.status === "completed" ? "✅ 完了" : "🚪 締め切り"}
            </span>
          )}
          <span className="text-[10px] text-text-mute ml-auto">
            {formatRelativeTime(field.created_at)}
          </span>
        </div>
        <h1
          className="text-lg font-bold leading-tight"
          style={{ color: "#5a7d4a" }}
        >
          🌾 {field.name}
        </h1>
        <div className="text-xs text-text-sub mt-1">
          📍 {field.prefecture}
          {field.city ? ` ${field.city}` : ""}
        </div>
        {field.owner && (
          <Link
            href={`/u/${field.owner.username}`}
            className="flex items-center gap-2 mt-2 no-underline"
          >
            <Avatar
              src={field.owner.avatar_url}
              alt={field.owner.display_name}
              size="sm"
            />
            <div>
              <div className="text-xs font-bold text-text">
                {field.owner.display_name}
              </div>
              <div className="text-[10px] text-text-mute">この田んぼの主</div>
            </div>
          </Link>
        )}
      </div>

      {/* Description */}
      {field.description && (
        <Card>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            <RichBody body={field.description} />
          </p>
        </Card>
      )}

      {/* Season info + max helpers */}
      <div className="grid grid-cols-1 gap-2">
        {field.season_info && (
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="text-[10px] text-text-mute font-medium tracking-widest mb-0.5">
              🗓 作業時期 ・ 通い方
            </div>
            <p className="text-sm text-text">{field.season_info}</p>
          </div>
        )}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="text-[10px] text-text-mute font-medium tracking-widest mb-0.5">
            🤝 MY農家
          </div>
          <p className="text-sm text-text">
            <strong>{field.helper_count ?? 0} 人</strong>
            {field.max_helpers ? ` / ${field.max_helpers} 人 募集` : " 登録中"}
          </p>
        </div>
      </div>

      {/* Action — join / leave / login */}
      {isOpen && !isOwner && (
        <div className="sticky bottom-20 md:static z-10 space-y-2">
          {hasJoined ? (
            <div
              className="rounded-xl border-2 px-3 py-2.5 text-center"
              style={{
                borderColor: "#5a7d4a40",
                background: "#f5e8d5",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: "#5a7d4a" }}
              >
                🌾 あなたはこの田んぼの MY農家 です
              </p>
              <button
                onClick={handleLeave}
                className="text-[11px] text-text-mute underline mt-1"
              >
                MY農家から外れる
              </button>
            </div>
          ) : (
            <>
              {showCommentBox && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="一言（任意）：何を手伝いたい？通える頻度は？"
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
                <button
                  onClick={handleJoin}
                  disabled={busy}
                  className={`${
                    showCommentBox ? "w-full" : "flex-1"
                  } py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition shadow-sm disabled:opacity-50`}
                  style={{ background: "#5a7d4a" }}
                >
                  {busy ? "..." : "🌾 MY農家として登録する"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-2">
          {isOpen ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={handleComplete}
                className="flex-1"
              >
                ✅ 完了にする
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleClose}
                className="flex-1"
              >
                🚪 募集を締切
              </Button>
            </>
          ) : (
            <button
              onClick={async () => {
                await setKomeFieldStatus(field.id, "open");
                await reload();
              }}
              className="flex-1 text-xs text-accent underline"
            >
              ↻ 募集を再開する
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

      {/* Helpers list */}
      <div>
        <p className="text-xs text-text-sub font-medium mb-1.5 px-1">
          🌾 MY農家として登録した人（{field.helper_count ?? 0}人）
        </p>
        {(!field.helpers || field.helpers.length === 0) ? (
          <p className="text-xs text-text-mute py-4 text-center">
            まだ誰もいません。一番最初の MY農家 になろう
          </p>
        ) : (
          <div className="space-y-1.5">
            {field.helpers.map((h) =>
              h.profile ? (
                <Link
                  key={h.user_id}
                  href={`/u/${h.profile.username}`}
                  className="no-underline block"
                >
                  <div className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow p-2.5 flex items-start gap-2.5">
                    <Avatar
                      src={h.profile.avatar_url}
                      alt={h.profile.display_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {h.profile.display_name}
                      </div>
                      {h.comment && (
                        <p className="text-[11px] text-text-sub mt-0.5 line-clamp-2">
                          「{h.comment}」
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-text-mute">
                      {formatRelativeTime(h.joined_at)}
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
