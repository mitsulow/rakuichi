"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { fetchMigrationStats } from "@/lib/data";

export function MigrationDashboard() {
  const [stats, setStats] = useState<{
    total: number;
    avg: number;
    fullyMigrated: number;
  } | null>(null);

  useEffect(() => {
    fetchMigrationStats().then(setStats);
  }, []);

  if (!stats || stats.total === 0) return null;

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-r from-accent/5 via-transparent to-accent/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🌾</span>
        <h2 className="text-sm font-bold">今、日本は何％フリーランス化？</h2>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-accent">{stats.avg}</span>
        <span className="text-sm text-text-sub">%</span>
        <span className="text-xs text-text-mute ml-auto">
          座の民 {stats.total.toLocaleString()}人の平均
        </span>
      </div>

      {/* Bar */}
      <div className="mt-2 h-3 rounded-full overflow-hidden bg-bg border border-border">
        <div
          className="h-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-1000"
          style={{ width: `${stats.avg}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-text-mute">
        <span>🍚 ライスワーク100%</span>
        <span>🌾 完全ライフワーク化</span>
      </div>

      {stats.fullyMigrated > 0 && (
        <p className="text-[10px] text-accent mt-2 text-center">
          ✨ {stats.fullyMigrated}人がすでに完全移行しました
        </p>
      )}

      <Link
        href="/rankings"
        className="block mt-3 text-xs text-accent text-center no-underline hover:underline"
      >
        ランキングを見る →
      </Link>
    </Card>
  );
}
