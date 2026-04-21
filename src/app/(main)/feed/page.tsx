"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { AhouDansu } from "@/components/feed/AhouDansu";
import {
  RegionFilter,
  regionToPrefectures,
  type RegionScope,
} from "@/components/feed/RegionFilter";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAllShops, SHOPS_PAGE_SIZE } from "@/lib/data";
import { getCached, setCached } from "@/lib/cache";
import { CATEGORIES } from "@/lib/constants";
import type { Shop, Profile } from "@/lib/types";

interface ShopWithOwner extends Shop {
  owner?: Profile | null;
}

/**
 * 楽座 — the main landing page. A marketplace of all 楽座 across the site.
 * Scope filter (自分の県 / 日本全体 / 全世界 / 地方) + category filter.
 */
export default function FeedPage() {
  const { user, profile } = useAuth();
  // Default: show EVERYTHING (no filter). Users pick a region if they want.
  const [scope, setScope] = useState<RegionScope>({ kind: "world" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopWithOwner[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<ShopWithOwner[]>("feed:shops") ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached<ShopWithOwner[]>("feed:shops");
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // No auto-filter by prefecture on mount — show everything by default.
  // Users tap '自分の県' themselves when they want to filter.

  // Reset + fetch whenever scope or category changes
  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    setLoading(true);
    setPage(0);
    const prefectures = regionToPrefectures(scope);

    (async () => {
      try {
        const { shops: list, total } = await fetchAllShops(
          selectedCategory,
          0,
          SHOPS_PAGE_SIZE,
          prefectures
        );
        if (cancelled) return;
        setShops(list as ShopWithOwner[]);
        setTotal(total);
        if (!selectedCategory && scope.kind === "japan") {
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
  }, [scope, selectedCategory]);

  const canLoadMore = shops.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const prefectures = regionToPrefectures(scope);
    const { shops: more } = await fetchAllShops(
      selectedCategory,
      nextPage,
      SHOPS_PAGE_SIZE,
      prefectures
    );
    setShops((prev) => [...prev, ...(more as ShopWithOwner[])]);
    setPage(nextPage);
    setLoadingMore(false);
  }, [loadingMore, canLoadMore, page, selectedCategory, scope]);

  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, shops.length]);

  return (
    <div className="space-y-4">
      <AhouDansu />
      <WelcomeBanner />
      <WeeklyMarket />

      {/* Edo-style noren header */}
      <div className="relative">
        <div
          className="text-center py-3 px-4 flex items-center justify-center gap-3"
          style={{
            background:
              "linear-gradient(180deg, #c94d3a 0%, #c94d3a 75%, transparent 100%)",
            clipPath:
              "polygon(0 0, 100% 0, 100% 75%, 95% 85%, 85% 75%, 75% 85%, 65% 75%, 55% 85%, 45% 75%, 35% 85%, 25% 75%, 15% 85%, 5% 75%, 0 85%)",
          }}
        >
          <span style={{ fontSize: 22 }}>🏮</span>
          <h1
            className="text-lg font-bold text-white tracking-widest"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          >
            楽 座
          </h1>
          <span style={{ fontSize: 22 }}>🏮</span>
        </div>
      </div>

      {/* Filters: region + category as dropdowns */}
      <div>
        <div className="text-[11px] text-text-sub font-medium mb-1.5 px-1">
          🔍 絞り込み検索
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-text-mute mb-1 px-1">地域検索</div>
            <RegionFilter
              scope={scope}
              onChange={setScope}
              userPrefecture={profile?.prefecture ?? null}
            />
          </div>
          <div>
            <div className="text-[10px] text-text-mute mb-1 px-1">
              ジャンル検索
            </div>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
              }}
            >
              <option value="">すべてのジャンル</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Count + 出す button */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-mute">
          今 {total}座 並んでいます
        </p>
        <Link
          href={user ? "/settings/shops" : "/login"}
          className="text-xs text-accent no-underline font-medium"
        >
          + 自分も楽座を出す
        </Link>
      </div>

      {/* Prominent "自分も楽座を出す" CTA */}
      <Link
        href={user ? "/settings/shops" : "/login"}
        className="block no-underline group"
      >
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-accent/40 shadow-sm hover:shadow-md transition-all"
          style={{
            background:
              "linear-gradient(135deg, #f5e8d5 0%, #ffffff 50%, #f5e8d5 100%)",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: "#c94d3a" }}
            >
              🏪
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-text">
                自分も楽座を出す
              </div>
              <div className="text-xs text-text-sub mt-0.5">
                {user
                  ? "お試し出品（0円）もOK、物々交換もできる"
                  : "登録して、あなたの腕で勝負する"}
              </div>
            </div>
            <div className="text-accent text-xl">→</div>
          </div>
        </div>
      </Link>

      {/* Shops showcase — 2-column grid */}
      {loading ? (
        <LoadingScreen step="楽座を読み込み中..." />
      ) : shops.length === 0 ? (
        <div className="text-center py-12 text-text-mute">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-sm">
            このエリア・ジャンルの楽座はまだありません
          </p>
          <p className="text-xs mt-1">
            {user ? "最初の楽座を出してみよう" : "登録して最初の楽座を出そう"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {canLoadMore && (
            <div ref={sentinelRef} className="py-6 text-center">
              {loadingMore ? (
                <div className="inline-flex items-center gap-2 text-xs text-text-mute">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  次の楽座を読み込み中...
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="text-xs text-accent underline"
                >
                  もっと見る（あと{total - shops.length}件）
                </button>
              )}
            </div>
          )}
          {!canLoadMore && shops.length >= SHOPS_PAGE_SIZE && (
            <p className="text-center text-[10px] text-text-mute py-4">
              🏮 すべての楽座を表示しました（全{total}件）
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ShopCard({ shop }: { shop: ShopWithOwner }) {
  const router = useRouter();
  const image = shop.image_urls?.[0];

  return (
    <Link href={`/shop/${shop.id}`} className="no-underline block">
      <Card className="!p-0 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-bg">
          {image ? (
            <img
              src={image}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl"
              style={{
                background:
                  "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
              }}
            >
              🏪
            </div>
          )}

          <div
            className="absolute top-0 left-0 right-0 p-2.5 pb-6 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
            }}
          >
            <div className="flex items-start gap-1.5">
              {shop.is_trial && (
                <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  お試し
                </span>
              )}
              <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                {shop.name}
              </h3>
            </div>
          </div>

          {shop.owner && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/u/${shop.owner!.username}`);
              }}
              className="absolute bottom-1.5 left-1.5 ring-2 ring-white/80 rounded-full hover:scale-110 transition-transform"
              title={`${shop.owner.display_name}のマイページ`}
              aria-label={`${shop.owner.display_name}のマイページへ`}
            >
              <Avatar
                src={shop.owner.avatar_url}
                alt={shop.owner.display_name}
                size="sm"
              />
            </button>
          )}
        </div>

        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
          <div className="text-xs font-bold text-accent truncate">
            {shop.is_trial
              ? "0円〜"
              : shop.price_jpy != null
              ? `¥${shop.price_jpy.toLocaleString()}`
              : shop.price_text ?? ""}
          </div>
          <div className="flex gap-0.5 text-[11px] flex-shrink-0">
            {shop.accepts_barter && <span title="物々交換可">🔄</span>}
            {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
