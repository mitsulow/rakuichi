"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { CATEGORIES } from "@/lib/constants";
import { fetchAllShops } from "@/lib/data";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { Shop, Profile } from "@/lib/types";

interface ShopWithOwner extends Shop {
  owner?: Profile | null;
}

const suggestions = [
  "お米",
  "整体",
  "ヨガ",
  "味噌",
  "音楽",
  "物々交換",
  "お試し",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopWithOwner[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    (async () => {
      try {
        const data = await Promise.race([
          fetchAllShops(selectedCategory),
          new Promise<unknown[]>((resolve) => setTimeout(() => resolve([]), 6000)),
        ]);
        if (cancelled) return;
        setShops(data as ShopWithOwner[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (s.description?.toLowerCase().includes(q)) return true;
      if (s.owner?.display_name.toLowerCase().includes(q)) return true;
      if (s.owner?.prefecture?.toLowerCase().includes(q)) return true;
      if (q === "お試し" && s.is_trial) return true;
      if (q === "物々交換" && s.accepts_barter) return true;
      return false;
    });
  }, [shops, query]);

  // Group by category when no filter/query
  const grouped = useMemo(() => {
    if (selectedCategory || query) return null;
    const map = new Map<string, ShopWithOwner[]>();
    for (const s of filtered) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [filtered, selectedCategory, query]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">🏪 屋台を探す</h1>

      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 陶芸、整体、沖縄、物々交換..."
          className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {/* Quick suggestions */}
      {!query && (
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

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
            !selectedCategory
              ? "bg-accent text-white"
              : "bg-card text-text-sub border border-border hover:bg-bg"
          }`}
        >
          <span>🏮</span>
          <span>すべて</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
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
      {loading ? (
        <LoadingScreen step="屋台を読み込み中..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-mute">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm">まだ屋台がここに並んでいません</p>
          <p className="text-xs mt-2">
            あなたが最初の屋台を出してみませんか？
          </p>
        </div>
      ) : grouped ? (
        // Grouped by category
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catShops = grouped.get(cat.id);
            if (!catShops || catShops.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{cat.emoji}</span>
                  <h2 className="text-sm font-bold">{cat.label}</h2>
                  <span className="text-xs text-text-mute">
                    ({catShops.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {catShops.slice(0, 4).map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({ shop }: { shop: ShopWithOwner }) {
  const href = shop.owner ? `/u/${shop.owner.username}` : "#";
  return (
    <Link href={href} className="no-underline block">
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {shop.owner && (
            <Avatar
              src={shop.owner.avatar_url}
              alt={shop.owner.display_name}
              size="md"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CategoryTag categoryId={shop.category} size="sm" />
              <span className="text-sm font-medium">{shop.name}</span>
              {shop.is_trial && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                  お試し
                </span>
              )}
            </div>
            {shop.description && (
              <p className="text-xs text-text-mute line-clamp-2 mt-1">
                {shop.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              {shop.owner && (
                <span className="text-text-sub">
                  {shop.owner.display_name}
                </span>
              )}
              {shop.owner?.prefecture && (
                <span className="text-text-mute">
                  📍{shop.owner.prefecture}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {shop.is_trial ? (
              <span className="text-sm text-accent font-medium">0円〜</span>
            ) : shop.price_jpy != null ? (
              <span className="text-sm text-accent font-medium">
                ¥{shop.price_jpy.toLocaleString()}
              </span>
            ) : shop.price_text ? (
              <span className="text-sm text-accent font-medium">
                {shop.price_text}
              </span>
            ) : null}
            <div className="flex gap-0.5 text-xs justify-end mt-0.5">
              {shop.accepts_barter && <span title="物々交換可">🔄</span>}
              {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
