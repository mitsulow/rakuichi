"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import { mockChats } from "@/lib/mock-data";

export default function ChatListPage() {
  // Simulate current user = u1 (mitsuro)
  const currentUserId = "u1";

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">💬 チャット</h1>

      <div className="space-y-2">
        {mockChats.map((chat) => {
          const otherMember = chat.members?.find(
            (m) => m.id !== currentUserId
          );
          if (!otherMember) return null;

          const isUnread = chat.last_message && !chat.last_message.read_at;

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
                      src={otherMember.avatar_url}
                      alt={otherMember.display_name}
                      size="md"
                    />
                    {isUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {otherMember.display_name}
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

      {mockChats.length === 0 && (
        <div className="text-center py-12 text-text-mute">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">まだチャットがありません</p>
          <p className="text-xs mt-1">
            村人のMy座から「連絡を取る」でチャットを始められます
          </p>
        </div>
      )}
    </div>
  );
}
