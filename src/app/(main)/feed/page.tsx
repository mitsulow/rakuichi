"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAllShops } from "@/lib/data";
import { getCached, setCached } from "@/lib/cache";
import { CATEGORIES } from "@/lib/constants";
import type { Shop, Profile } from "@/lib/types";

interface ShopWithOwner extends Shop {
  owner?: Profile | null;
}

/**
 * 屋台 — the main landing page. A marketplace of all shops (屋台) across
 * the site, newest first. Acts as the "showcase" where users scroll through
 * what everyone is offering / trading.
 */
export default function FeedPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopWithOwner[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<ShopWithOwner[]>("feed:shops") ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached<ShopWithOwner[]>("feed:shops");
  });

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    (async () => {
      try {
        const data = await Promise.race([
          fetchAllShops(),
          new Promise<unknown[]>((resolve) =>
            setTimeout(() => resolve([]), 8000)
          ),
        ]);
        if (cancelled) return;
        const list = data as ShopWithOwner[];
        if (list.length > 0) {
          setShops(list);
          setCached("feed:shops", list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!selectedCategory) return shops;
    return shops.filter((s) => s.category === selectedCategory);
  }, [shops, selectedCategory]);

  return (
    <div className="space-y-4">
      <WelcomeBanner />

      {/* Weekly market banner */}
      <WeeklyMarket />

      {/* Not logged in — invite to register */}
      {!user && (
        <Card className="!p-4 border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
          <div className="text-center space-y-2">
            <div className="text-3xl">🏮</div>
            <h2 className="text-base font-bold">ようこそ、楽市楽座へ</h2>
            <p className="text-xs text-text-sub">
              自分の腕一本で、本当にやりたい仕事を。
              <br />
              まずは登録してMY屋台を出してみよう。
            </p>
            <a
              href="/login"
              className="inline-block mt-2 bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium no-underline"
            >
              🪞 登録する
            </a>
          </div>
        </Card>
      )}

      {/* Section header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold">🏪 屋台</h1>
          <p className="text-[11px] text-text-mute">
            {shops.length}件の屋台が並んでいます
          </p>
        </div>
        {user && (
          <Link
            href="/settings/shops"
            className="text-xs text-accent no-underline font-medium"
          >
            + 自分も出店
          </Link>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
            !selectedCategory
              ? "bg-accent text-white"
              : "bg-card text-text-sub border border-border"
          }`}
        >
          すべて
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
                : "bg-card text-text-sub border border-border"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Shops showcase — 2-column grid */}
      {loading ? (
        <LoadingScreen step="屋台を読み込み中..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-mute">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-sm">
            {selectedCategory ? "このジャンルの屋台はまだありません" : "まだ屋台が出ていません"}
          </p>
          <p className="text-xs mt-1">
            {user ? "最初の屋台を出してみよう" : "登録して最初の屋台を出そう"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
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
  const image = shop.image_urls?.[0];
  return (
    <Link href={href} className="no-underline block">
      <Card className="!p-0 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Image or category placeholder */}
        {image ? (
          <div className="aspect-square overflow-hidden bg-bg">
            <img src={image} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-accent/10 to-transparent">
            <CategoryTag categoryId={shop.category} size="sm" />
          </div>
        )}

        <div className="p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-1 mb-1">
            <CategoryTag categoryId={shop.category} size="sm" />
            {shop.is_trial && (
              <span className="text-[9px] bg-accent/20 text-accent px-1.5 rounded-full">
                お試し
              </span>
            )}
          </div>
          <div className="text-sm font-medium line-clamp-2">{shop.name}</div>
          {shop.description && (
            <p className="text-[10px] text-text-mute line-clamp-2 mt-1">
              {shop.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="text-xs font-medium text-accent">
              {shop.is_trial
                ? "0円〜"
                : shop.price_jpy != null
                ? `¥${shop.price_jpy.toLocaleString()}`
                : shop.price_text ?? ""}
            </div>
            <div className="flex gap-0.5 text-[10px]">
              {shop.accepts_barter && <span title="物々交換可">🔄</span>}
              {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
            </div>
          </div>

          {shop.owner && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
              <Avatar
                src={shop.owner.avatar_url}
                alt={shop.owner.display_name}
                size="xs"
              />
              <span className="text-[10px] text-text-mute line-clamp-1">
                {shop.owner.display_name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
