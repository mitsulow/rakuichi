"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchNotifications,
  markNotificationsRead,
} from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const TYPE_META: Record<
  string,
  { emoji: string; verb: string; targetPath: (n: Notification) => string }
> = {
  like: {
    emoji: "🌱",
    verb: "あなたの情緒に種をまきました",
    targetPath: (n) => (n.target_id ? `/posts/${n.target_id}` : "/posts"),
  },
  comment: {
    emoji: "📜",
    verb: "あなたの情緒に文を寄せました",
    targetPath: (n) => (n.target_id ? `/posts/${n.target_id}` : "/posts"),
  },
  callout_join: {
    emoji: "🤚",
    verb: "あなたの呼びかけに指をあげました",
    targetPath: (n) =>
      n.target_id ? `/callouts/${n.target_id}` : "/callouts",
  },
  message: {
    emoji: "✉",
    verb: "あなたに文を送りました",
    targetPath: (n) => (n.target_id ? `/chat/${n.target_id}` : "/chat"),
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      const list = await fetchNotifications(user.id);
      if (!cancelled) {
        setNotifications(list as Notification[]);
        setLoading(false);
        // Mark all as read on view
        await markNotificationsRead(user.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-3">
      <div
        className="text-center py-3 px-4 rounded-2xl border-2"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
        }}
      >
        <h1
          className="text-xl font-bold tracking-wide leading-tight"
          style={{ color: "#c94d3a" }}
        >
          🔔 お知らせ
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          種をまかれたとき・文をもらったとき・指をあげられたとき
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-bg animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="text-center py-12 px-6 rounded-2xl border-2 border-dashed"
          style={{
            borderColor: "#c94d3a40",
            background:
              "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-sm font-bold" style={{ color: "#c94d3a" }}>
            まだお知らせはありません
          </p>
          <p className="text-xs text-text-sub mt-1.5">
            誰かに種をまかれたり、文をもらうとここに表示されます
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? {
              emoji: "🔔",
              verb: "アクションがありました",
              targetPath: () => "/feed",
            };
            const isUnread = !n.read_at;
            const href = meta.targetPath(n);
            return (
              <Link
                key={n.id}
                href={href}
                className="no-underline block"
              >
                <div
                  className={`rounded-xl border p-3 flex items-start gap-3 transition-shadow hover:shadow-sm ${
                    isUnread ? "border-accent/40" : "border-border"
                  }`}
                  style={{
                    background: isUnread
                      ? "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)"
                      : undefined,
                  }}
                >
                  <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                  {n.actor && (
                    <Avatar
                      src={n.actor.avatar_url}
                      alt={n.actor.display_name}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">
                      {n.actor && (
                        <span className="font-bold">
                          {n.actor.display_name}
                        </span>
                      )}
                      <span className="text-text-sub"> が{meta.verb}</span>
                    </p>
                    {n.payload &&
                      typeof n.payload === "object" &&
                      "preview" in n.payload && (
                        <p className="text-[11px] text-text-mute mt-0.5 line-clamp-1">
                          「{String(n.payload.preview)}」
                        </p>
                      )}
                    {n.payload &&
                      typeof n.payload === "object" &&
                      "comment" in n.payload &&
                      String(n.payload.comment).length > 0 && (
                        <p className="text-[11px] text-text-mute mt-0.5 line-clamp-1">
                          「{String(n.payload.comment)}」
                        </p>
                      )}
                    <p className="text-[10px] text-text-mute mt-0.5">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {isUnread && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{ background: "#c94d3a" }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {hasUnread && notifications.length > 0 && !loading && (
        <p className="text-[10px] text-text-mute text-center py-2">
          ✓ 既読にしました
        </p>
      )}
    </div>
  );
}
