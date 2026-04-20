"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { fetchUserTradeRecords } from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { TradeRecord, Profile } from "@/lib/types";

interface TradeRecordsProps {
  userId: string;
}

type RecordWithProfiles = TradeRecord & {
  author?: Profile | null;
  partner?: Profile | null;
};

export function TradeRecords({ userId }: TradeRecordsProps) {
  const [records, setRecords] = useState<RecordWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchUserTradeRecords(userId);
      setRecords(data as RecordWithProfiles[]);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return null;
  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold">📖 交換の記録</h3>
        <span className="text-xs text-text-mute">({records.length}回)</span>
      </div>
      <div className="space-y-2">
        {records.slice(0, 5).map((r) => {
          const other =
            r.author?.id === userId ? r.partner : r.author;
          return (
            <div key={r.id} className="border-l-2 border-accent/30 pl-3 py-1">
              <div className="flex items-center gap-2">
                {other && (
                  <Link
                    href={`/u/${other.username}`}
                    className="flex items-center gap-1.5 no-underline"
                  >
                    <Avatar
                      src={other.avatar_url}
                      alt={other.display_name}
                      size="sm"
                    />
                    <span className="text-xs font-medium">
                      {other.display_name}
                    </span>
                  </Link>
                )}
                <span className="text-[10px] text-text-mute ml-auto">
                  {formatRelativeTime(r.created_at)}
                </span>
              </div>
              <div className="text-xs font-medium mt-1">🔄 {r.title}</div>
              <p className="text-xs text-text-sub mt-0.5 whitespace-pre-wrap">
                「{r.diary}」
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
