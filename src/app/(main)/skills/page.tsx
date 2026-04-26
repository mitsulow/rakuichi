"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import {
  searchProfilesBySkill,
  fetchPopularSkills,
} from "@/lib/data";
import type { Profile } from "@/lib/types";

interface PopularSkill {
  skill: string;
  count: number;
}

/**
 * SKILL検索 — find座の民 by what they can do.
 * Tap a popular chip or type a skill, see everyone who has it.
 */
export default function SkillsSearchPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [results, setResults] = useState<Profile[]>([]);
  const [popular, setPopular] = useState<PopularSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [popLoading, setPopLoading] = useState(true);

  // Load popular skills on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchPopularSkills(24);
      if (!cancelled) {
        setPopular(list);
        setPopLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = async (skill: string) => {
    const q = skill.trim();
    if (!q) {
      setActive(null);
      setResults([]);
      return;
    }
    setActive(q);
    setLoading(true);
    const profiles = await searchProfilesBySkill(q);
    setResults(profiles as Profile[]);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="space-y-3">
      {/* Hero */}
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
          🛠 SKILL 検 索
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          できること・特技で座の民を見つける
        </p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例: 釣り / 整体 / イラスト"
          className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90"
        >
          🔍 探す
        </button>
      </form>

      {/* Popular skills — cloud */}
      {!active && (
        <div>
          <p className="text-[11px] text-text-mute mb-1.5 px-1 font-medium">
            🌟 みんなが登録しているスキル
          </p>
          {popLoading ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block w-16 h-7 rounded-full bg-bg animate-pulse"
                />
              ))}
            </div>
          ) : popular.length === 0 ? (
            <p className="text-xs text-text-mute py-4 text-center">
              まだ誰もスキルを登録していません
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {popular.map((p) => (
                <button
                  key={p.skill}
                  onClick={() => {
                    setQuery(p.skill);
                    search(p.skill);
                  }}
                  className="inline-flex items-center gap-1 bg-card border border-border hover:border-accent rounded-full px-2.5 py-1.5 text-xs transition-colors"
                  style={{
                    fontSize: 11 + Math.min(4, Math.log2(p.count + 1) * 1.5),
                  }}
                >
                  <span className="font-medium">{p.skill}</span>
                  <span className="text-text-mute text-[10px]">
                    {p.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {active && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-sub">
              <span className="font-bold">「{active}」</span> の検索結果
              {!loading && (
                <span className="text-text-mute ml-1.5">
                  {results.length}人
                </span>
              )}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActive(null);
                setResults([]);
              }}
              className="text-[11px] text-accent underline"
            >
              戻る
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-bg animate-pulse"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🤷</p>
              <p className="text-sm text-text-mute">
                「{active}」を持つ人はまだいません
              </p>
              <p className="text-[11px] text-text-mute mt-1">
                完全一致で探しています。違う言い方も試してみよう
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/u/${profile.username}`}
                  className="no-underline block"
                >
                  <div
                    className="rounded-xl border border-border hover:shadow-md transition-shadow p-3 flex items-start gap-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #fffaf0 0%, #fdf6e9 100%)",
                    }}
                  >
                    <Avatar
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-text">
                          {profile.display_name}
                        </span>
                        {profile.life_work_level && (
                          <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-medium">
                            {profile.life_work_level}
                          </span>
                        )}
                      </div>
                      {profile.life_work && (
                        <div className="text-[11px] text-text-sub mt-0.5 truncate">
                          🌱 {profile.life_work}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-text-mute mt-0.5">
                        {profile.prefecture && (
                          <span>📍 {profile.prefecture}</span>
                        )}
                      </div>
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {profile.skills.slice(0, 8).map((s) => {
                            const isActive =
                              s.toLowerCase() === active.toLowerCase();
                            return (
                              <span
                                key={s}
                                className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                                  isActive
                                    ? "bg-accent text-white font-bold"
                                    : "bg-bg border border-border"
                                }`}
                              >
                                {s}
                              </span>
                            );
                          })}
                          {profile.skills.length > 8 && (
                            <span className="text-[10px] text-text-mute py-0.5">
                              他 {profile.skills.length - 8}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
