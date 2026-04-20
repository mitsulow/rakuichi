"use client";

import { use, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { mockMessages, mockProfiles } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const [newMessage, setNewMessage] = useState("");

  // Simulate current user = u1
  const currentUserId = "u1";

  const messages = mockMessages.filter((m) => m.chat_id === chatId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          const sender = mockProfiles.find((p) => p.id === msg.sender_id);

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
            >
              {!isMine && sender && (
                <Avatar
                  src={sender.avatar_url}
                  alt={sender.display_name}
                  size="sm"
                />
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? "bg-accent text-white rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
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

      {/* Input */}
      <div className="border-t border-border pt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            disabled={!newMessage.trim()}
            className="bg-accent text-white rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
