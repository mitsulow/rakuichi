"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { CATEGORIES } from "@/lib/constants";
import { mockProfiles, mockShops, mockBadges } from "@/lib/mock-data";

const suggestions = [
  "自然栽培のお米",
  "整体",
  "手作り味噌",
  "ヨガ",
  "音楽",
  "物々交換",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return mockProfiles
      .filter((p) => p.is_paid)
      .map((profile) => {
        const shops = mockShops.filter((s) => s.owner_id === profile.id);
        const badges = mockBadges.filter((b) => b.user_id === profile.id);
        return { profile, shops, badges };
      })
      .filter(({ profile, shops }) => {
        if (selectedCategory) {
          return shops.some((s) => s.category === selectedCategory);
        }
        if (!q) return true;
        return (
          profile.display_name.toLowerCase().includes(q) ||
          profile.bio?.toLowerCase().includes(q) ||
          profile.prefecture?.includes(q) ||
          profile.life_work?.toLowerCase().includes(q) ||
          shops.some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.description?.toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => {
        // みつろう認定 first
        const aHasCert = a.badges.some(
          (b) => b.badge_type === "mitsuro_certified"
        );
        const bHasCert = b.badges.some(
          (b) => b.badge_type === "mitsuro_certified"
        );
        if (aHasCert && !bHasCert) return -1;
        if (!aHasCert && bHasCert) return 1;

        // Then by level
        const levelOrder = { 一人前: 0, 歩み中: 1, 修行中: 2 };
        const aLevel =
          levelOrder[a.profile.life_work_level as keyof typeof levelOrder] ?? 3;
        const bLevel =
          levelOrder[b.profile.life_work_level as keyof typeof levelOrder] ?? 3;
        return aLevel - bLevel;
      });
  }, [query, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedCategory(null);
          }}
          placeholder="🔍 自然栽培のお米、札幌 整体、物々交換..."
          className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {/* Quick suggestions */}
      {!query && !selectedCategory && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="bg-card border border-border rounded-full px-3 py-1.5 text-xs text-text-sub hover:bg-accent-soft hover:text-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.id ? null : cat.id
              )
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-accent text-white"
                : "bg-card text-text-sub border border-border hover:bg-bg"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map(({ profile, shops, badges }) => (
          <Link
            key={profile.id}
            href={`/u/${profile.username}`}
            className="no-underline"
          >
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm">
                      {profile.display_name}
                    </span>
                    <BadgeList badges={badges.slice(0, 4)} />
                  </div>
                  {profile.life_work_level && (
                    <p className="text-xs text-text-sub mt-0.5">
                      {profile.life_work_level}
                      {profile.life_work
                        ? `・${profile.life_work}`
                        : ""}
                      {profile.life_work_years
                        ? `${profile.life_work_years}年`
                        : ""}
                    </p>
                  )}
                  {profile.prefecture && (
                    <p className="text-xs text-text-mute mt-0.5">
                      📍 {profile.prefecture}
                      {profile.city ? ` ${profile.city}` : ""}
                    </p>
                  )}
                  {shops.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {shops.slice(0, 3).map((shop) => (
                        <CategoryTag
                          key={shop.id}
                          categoryId={shop.category}
                          size="sm"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {results.length === 0 && (
          <div className="text-center py-12 text-text-mute">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">検索結果がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
