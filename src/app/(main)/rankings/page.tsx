"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import {
  fetchSeedRanking,
  fetchExchangeRanking,
  fetchMentorRanking,
  fetchMigrationStats,
} from "@/lib/data";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { Profile } from "@/lib/types";

interface RankingEntry {
  profile: Profile;
  total: number;
}

type Tab = "seed" | "exchange" | "mentor";

export default function RankingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("seed");
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState<RankingEntry[]>([]);
  const [exchange, setExchange] = useState<RankingEntry[]>([]);
  const [mentor, setMentor] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    avg: number;
    fullyMigrated: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const [s, e, m, st] = await Promise.all([
        fetchSeedRanking(),
        fetchExchangeRanking(),
        fetchMentorRanking(),
        fetchMigrationStats(),
      ]);
      setSeed(s as RankingEntry[]);
      setExchange(e as RankingEntry[]);
      setMentor(m as RankingEntry[]);
      setStats(st);
      setLoading(false);
    }
    load();
  }, []);

  const active =
    tab === "seed" ? seed : tab === "exchange" ? exchange : mentor;
  const suffix =
    tab === "seed" ? "個の種" : tab === "exchange" ? "回の交換" : "人の弟子";
  const emoji = tab === "seed" ? "🌱" : tab === "exchange" ? "🔄" : "🎓";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-1"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">🏮 楽市ランキング</h1>
      </div>

      {/* Dashboard */}
      {stats && (
        <Card>
          <div className="text-xs text-text-mute mb-1">
            座の民 {stats.total.toLocaleString()}人
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent">{stats.avg}</span>
            <span className="text-sm">%</span>
            <span className="text-xs text-text-mute">
              平均ライフワーク移行度
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden bg-bg border border-border">
            <div
              className="h-full bg-gradient-to-r from-accent/70 to-accent"
              style={{ width: `${stats.avg}%` }}
            />
          </div>
          {stats.fullyMigrated > 0 && (
            <p className="text-[10px] text-text-mute mt-1.5">
              ✨ すでに{stats.fullyMigrated}人が完全移行
            </p>
          )}
        </Card>
      )}

      <p className="text-xs text-text-mute px-2">
        楽市楽座には「売上ランキング」はありません。
        大切なのは金額の大小じゃなく、どれだけ交わったか。
      </p>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        <TabButton
          active={tab === "seed"}
          onClick={() => setTab("seed")}
          emoji="🌱"
          label="種まき"
        />
        <TabButton
          active={tab === "exchange"}
          onClick={() => setTab("exchange")}
          emoji="🔄"
          label="交換数"
        />
        <TabButton
          active={tab === "mentor"}
          onClick={() => setTab("mentor")}
          emoji="🎓"
          label="師弟"
        />
      </div>

      {/* Ranking list */}
      {loading ? (
        <LoadingScreen step="ランキングを読み込み中..." />
      ) : active.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-text-mute">
            <p className="text-3xl mb-2">{emoji}</p>
            <p className="text-sm">まだランキングがありません</p>
            <p className="text-xs mt-1">最初の一人になりませんか？</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {active.map((entry, i) => (
            <Link
              key={entry.profile.id}
              href={`/u/${entry.profile.username}`}
              className="no-underline"
            >
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 text-center font-bold ${
                      i === 0
                        ? "text-amber-500 text-xl"
                        : i === 1
                        ? "text-gray-400 text-lg"
                        : i === 2
                        ? "text-amber-700 text-lg"
                        : "text-text-mute text-sm"
                    }`}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <Avatar
                    src={entry.profile.avatar_url}
                    alt={entry.profile.display_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {entry.profile.display_name}
                    </div>
                    <div className="text-xs text-text-mute line-clamp-1">
                      {entry.profile.life_work ?? ""}
                      {entry.profile.life_work_level &&
                        `・${entry.profile.life_work_level}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-accent">
                      {entry.total.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-text-mute">{suffix}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
        active
          ? "bg-accent text-white"
          : "bg-card text-text-sub border border-border hover:bg-bg"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
