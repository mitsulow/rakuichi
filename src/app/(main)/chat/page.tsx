"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchUserChats } from "@/lib/data";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { Profile } from "@/lib/types";

interface ChatListItem {
  id: string;
  created_at: string;
  other: Profile | null;
  last_message: {
    id: string;
    body: string;
    created_at: string;
    sender_id: string;
    read_at: string | null;
  } | null;
}

export default function ChatListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          router.replace("/login");
          return;
        }
        setUserId(session.user.id);
        const data = await Promise.race([
          fetchUserChats(session.user.id),
          new Promise<unknown[]>((resolve) => setTimeout(() => resolve([]), 6000)),
        ]);
        if (cancelled) return;
        setChats(data as ChatListItem[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [router]);

  if (loading) {
    return <LoadingScreen step="文（ふみ）を読み込み中..." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">💬 文（ふみ）</h1>

      {chats.length === 0 ? (
        <div className="text-center py-12 text-text-mute">
          <p className="text-4xl mb-3">📜</p>
          <p className="text-sm">まだ文のやり取りがありません</p>
          <p className="text-xs mt-1">
            MY座の「💬 連絡を取る」から始められます
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => {
            if (!chat.other) return null;
            const isUnread =
              chat.last_message &&
              !chat.last_message.read_at &&
              chat.last_message.sender_id !== userId;

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="no-underline"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={chat.other.avatar_url}
                        alt={chat.other.display_name}
                        size="md"
                      />
                      {isUnread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {chat.other.display_name}
                        </span>
                        {chat.last_message && (
                          <span className="text-xs text-text-mute">
                            {formatRelativeTime(chat.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {chat.last_message && (
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            isUnread
                              ? "text-text font-medium"
                              : "text-text-mute"
                          }`}
                        >
                          {chat.last_message.body}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
