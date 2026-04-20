"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export function PostComposer() {
  const [body, setBody] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <div className="flex gap-3">
        <Avatar src={null} alt="あなた" size="md" />
        <div className="flex-1">
          {isExpanded ? (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="今日の出来事を共有しよう..."
                className="w-full bg-bg rounded-xl p-3 text-sm resize-none border border-border focus:border-accent focus:outline-none min-h-[100px]"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-mute">
                  {body.length}/500
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setBody("");
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button variant="primary" size="sm" disabled={!body.trim()}>
                    投稿する
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full bg-bg rounded-xl p-3 text-sm text-text-mute text-left hover:bg-border/50 transition-colors"
            >
              今日の出来事を共有しよう...
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
