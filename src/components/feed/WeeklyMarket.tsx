"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { fetchCurrentWeekPickups } from "@/lib/data";
import type { Profile } from "@/lib/types";

interface Pickup {
  user: Profile | null;
  reason: string | null;
  sort_order: number;
}

export function WeeklyMarket() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchCurrentWeekPickups();
      setPickups(
        (data as { user: unknown; reason?: string | null; sort_order?: number }[]).map((d) => ({
          user: (d.user as Profile | null) ?? null,
          reason: d.reason ?? null,
          sort_order: d.sort_order ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  // Get the start date of this week's market
  const today = new Date();
  const wednesday = new Date(today);
  wednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7));
  const isWednesdayToday = today.getDay() === 3;

  if (loading || pickups.length === 0) return null;

  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🏮</span>
          <h2 className="text-sm font-bold">今週の楽座</h2>
          {isWednesdayToday && (
            <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full animate-pulse">
              開催中
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-text-mute"
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {!collapsed && (
        <>
          <p className="text-[10px] text-text-mute mt-1">
            毎週水曜20時、今週のピックアップむらびとをご紹介
          </p>

          <div className="mt-3 space-y-2">
            {pickups.map((p, i) =>
              p.user ? (
                <Link
                  key={`${p.user.id}-${i}`}
                  href={`/u/${p.user.username}`}
                  className="flex items-center gap-2.5 no-underline hover:bg-bg rounded-xl p-1.5 -m-1.5 transition-colors"
                >
                  <div className="text-xs font-bold text-accent w-4 text-center">
                    {i + 1}
                  </div>
                  <Avatar
                    src={p.user.avatar_url}
                    alt={p.user.display_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {p.user.display_name}
                    </div>
                    <div className="text-xs text-text-mute line-clamp-1">
                      {p.reason ??
                        (p.user.life_work
                          ? `${p.user.life_work}${
                              p.user.life_work_level
                                ? `・${p.user.life_work_level}`
                                : ""
                            }`
                          : "")}
                    </div>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        </>
      )}
    </Card>
  );
}
