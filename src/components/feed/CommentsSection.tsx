"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import {
  fetchComments,
  createComment,
  deleteComment,
} from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment, Profile } from "@/lib/types";

type CommentWithProfile = Comment & { profile?: Profile };

interface CommentsSectionProps {
  postId: string;
  currentUserId?: string | null;
  currentUserAvatarUrl?: string | null;
  currentUserName?: string | null;
  onCountChange?: (delta: number) => void;
}

export function CommentsSection({
  postId,
  currentUserId,
  currentUserAvatarUrl,
  currentUserName,
  onCountChange,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchComments(postId);
      if (cancelled) return;
      setComments(data as CommentWithProfile[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleSubmit = async () => {
    if (!currentUserId || !body.trim() || sending) return;
    setSending(true);
    const result = await createComment(postId, currentUserId, body.trim());
    setSending(false);
    if (result.error || !result.data) {
      alert(`送信に失敗: ${result.error}`);
      return;
    }
    setComments((prev) => [...prev, result.data as CommentWithProfile]);
    setBody("");
    onCountChange?.(+1);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("この文を消しますか？")) return;
    const result = await deleteComment(commentId);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCountChange?.(-1);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {loading ? (
        <p className="text-xs text-text-mute text-center py-2">
          読み込み中...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-text-mute text-center py-2">
          まだ文はありません
        </p>
      ) : (
        <div className="space-y-2.5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.profile ? (
                <Link href={`/u/${c.profile.username}`}>
                  <Avatar
                    src={c.profile.avatar_url}
                    alt={c.profile.display_name}
                    size="xs"
                  />
                </Link>
              ) : (
                <div className="w-6 h-6 rounded-full bg-bg" />
              )}
              <div className="flex-1 min-w-0">
                <div className="bg-bg rounded-xl px-3 py-1.5">
                  {c.profile && (
                    <Link
                      href={`/u/${c.profile.username}`}
                      className="text-xs font-medium no-underline"
                    >
                      {c.profile.display_name}
                    </Link>
                  )}
                  <p className="text-xs whitespace-pre-wrap mt-0.5">
                    {c.body}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-mute px-1">
                  <span>{formatRelativeTime(c.created_at)}</span>
                  {currentUserId === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-text-mute hover:text-red-500"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      {currentUserId ? (
        <div className="flex gap-2 items-start">
          <Avatar
            src={currentUserAvatarUrl ?? null}
            alt={currentUserName ?? "あなた"}
            size="xs"
          />
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="文を寄せる..."
              maxLength={300}
              className="flex-1 min-w-0 bg-bg border border-border rounded-full px-3 py-1.5 text-xs focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!body.trim() || sending}
              className="bg-accent text-white rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {sending ? "..." : "送る"}
            </button>
          </div>
        </div>
      ) : (
        <a
          href="/login"
          className="block text-xs text-accent text-center py-1 no-underline"
        >
          文を寄せるにはログインしてください
        </a>
      )}
    </div>
  );
}
