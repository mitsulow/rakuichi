"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { EdoIcon } from "@/components/ui/EdoIcon";
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

  // 今日のピックアップ — deterministic daily pick from shops with images
  const { featured, rest } = useMemo(() => {
    const withImage = shops.filter((s) => s.image_urls && s.image_urls.length > 0);
    if (withImage.length === 0) return { featured: null, rest: shops };
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const pick = withImage[dayOfYear % withImage.length];
    return { featured: pick, rest: shops.filter((s) => s.id !== pick.id) };
  }, [shops]);

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

      {/* 今日のピックアップ — featured shop of the day */}
      {!loading && featured && <FeaturedShopCard shop={featured} />}

      {/* Count + 出す button */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-mute">
          今 {total}座 並んでいます
        </p>
        <Link
          href={user ? "/settings/shops" : "/login"}
          className="text-xs text-accent no-underline font-medium"
        >
          + あなたも楽座を出す
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
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: "#c94d3a" }}
            >
              <EdoIcon name="rakuza" size={28} color="#ffffff" />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-text">
                あなたも楽座を出しましょう
              </div>
              <div className="text-xs text-text-sub mt-0.5">
                {user
                  ? "お試し出品（0円）もOK、物々交換もできる"
                  : "登録して、あなたの才能を並べてみよう"}
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
          <div className="flex justify-center mb-3 text-accent">
            <EdoIcon name="rakuza" size={48} />
          </div>
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
            {rest.map((shop) => (
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

/**
 * 今日のピックアップ — large featured shop card.
 * Magazine-style: hero image on top with category badge, owner+title overlay,
 * and a warm washi-toned content strip below.
 */
function FeaturedShopCard({ shop }: { shop: ShopWithOwner }) {
  const router = useRouter();
  const image = shop.image_urls?.[0];
  const category = CATEGORIES.find((c) => c.id === shop.category);

  return (
    <div className="relative">
      {/* Floating "今日のピックアップ" ribbon */}
      <div className="absolute -top-2 left-3 z-20">
        <div
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold text-white rounded-full shadow-md"
          style={{
            background: "linear-gradient(135deg, #c94d3a 0%, #d4612e 100%)",
          }}
        >
          <span>🌟</span>
          <span className="tracking-wider">今日のピックアップ</span>
        </div>
      </div>

      <Link href={`/shop/${shop.id}`} className="no-underline block">
        <div
          className="relative overflow-hidden rounded-2xl border-2 shadow-md hover:shadow-lg transition-shadow"
          style={{
            borderColor: "#c94d3a40",
            background:
              "linear-gradient(180deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          {/* Hero image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-bg">
            {image ? (
              <img
                src={image}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
                }}
              >
                <EdoIcon name="rakuza" size={64} color="#ffffff" />
              </div>
            )}

            {/* Bottom gradient + title overlay */}
            <div
              className="absolute inset-x-0 bottom-0 p-3 pt-12"
              style={{
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {category && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/90 text-text px-1.5 py-0.5 rounded-full font-medium">
                    {category.emoji} {category.label}
                  </span>
                )}
                {shop.is_trial && (
                  <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full font-bold">
                    お試し
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                {shop.name}
              </h2>
            </div>

            {/* Top-right: location pill */}
            {shop.owner?.prefecture && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 text-[10px] bg-white/85 backdrop-blur-sm text-text px-2 py-0.5 rounded-full font-medium">
                  📍 {shop.owner.prefecture}
                </span>
              </div>
            )}
          </div>

          {/* Content strip */}
          <div className="p-3 flex items-center gap-3">
            {/* Owner avatar — prominent */}
            {shop.owner && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/u/${shop.owner!.username}`);
                }}
                className="ring-2 ring-accent/30 rounded-full hover:ring-accent transition flex-shrink-0"
                title={`${shop.owner.display_name}のマイページ`}
              >
                <Avatar
                  src={shop.owner.avatar_url}
                  alt={shop.owner.display_name}
                  size="md"
                />
              </button>
            )}

            <div className="flex-1 min-w-0">
              {shop.owner && (
                <div className="text-[11px] text-text-sub truncate">
                  {shop.owner.display_name}
                  {shop.owner.life_work && (
                    <span className="text-text-mute"> ・ {shop.owner.life_work}</span>
                  )}
                </div>
              )}
              {shop.description && (
                <div className="text-xs text-text-sub line-clamp-2 mt-0.5">
                  {shop.description}
                </div>
              )}
            </div>

            {/* Price block */}
            <div className="text-right flex-shrink-0">
              <div className="text-base font-bold text-accent leading-tight">
                {shop.is_trial
                  ? "0円〜"
                  : shop.price_jpy != null
                  ? `¥${shop.price_jpy.toLocaleString()}`
                  : shop.price_text ?? "—"}
              </div>
              <div className="flex justify-end gap-0.5 text-xs mt-0.5">
                {shop.accepts_barter && <span title="物々交換可">🔄</span>}
                {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Refined shop card — washi-toned background, larger owner avatar,
 * nobori-style trial flag, refined info strip.
 */
function ShopCard({ shop }: { shop: ShopWithOwner }) {
  const router = useRouter();
  const image = shop.image_urls?.[0];

  return (
    <Link href={`/shop/${shop.id}`} className="no-underline block">
      <div
        className="relative overflow-hidden rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
        style={{
          background: "linear-gradient(180deg, #fffaf0 0%, #fdf6e9 100%)",
        }}
      >
        <div className="relative aspect-square overflow-hidden bg-bg">
          {image ? (
            <img
              src={image}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white"
              style={{
                background:
                  "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
              }}
            >
              <EdoIcon name="rakuza" size={48} color="#ffffff" />
            </div>
          )}

          {/* Title overlay */}
          <div
            className="absolute top-0 left-0 right-0 p-2.5 pb-6 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
            }}
          >
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
              {shop.name}
            </h3>
          </div>

          {/* Nobori-style お試し flag — top-right */}
          {shop.is_trial && (
            <div className="absolute top-1.5 right-1.5 pointer-events-none">
              <div
                className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm shadow-sm"
                style={{
                  background: "#c94d3a",
                  writingMode: "horizontal-tb",
                  letterSpacing: "0.05em",
                }}
              >
                お試し
              </div>
            </div>
          )}

          {/* Owner avatar — bigger, more visible */}
          {shop.owner && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/u/${shop.owner!.username}`);
              }}
              className="absolute bottom-1.5 left-1.5 ring-2 ring-white rounded-full hover:scale-110 transition-transform shadow-md"
              title={`${shop.owner.display_name}のマイページ`}
              aria-label={`${shop.owner.display_name}のマイページへ`}
            >
              <Avatar
                src={shop.owner.avatar_url}
                alt={shop.owner.display_name}
                size="md"
              />
            </button>
          )}
        </div>

        {/* Info strip — name of owner + price */}
        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            {shop.owner && (
              <div className="text-[10px] text-text-mute truncate">
                {shop.owner.display_name}
              </div>
            )}
            <div className="text-xs font-bold text-accent truncate">
              {shop.is_trial
                ? "0円〜"
                : shop.price_jpy != null
                ? `¥${shop.price_jpy.toLocaleString()}`
                : shop.price_text ?? ""}
            </div>
          </div>
          <div className="flex gap-0.5 text-[11px] flex-shrink-0">
            {shop.accepts_barter && <span title="物々交換可">🔄</span>}
            {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
