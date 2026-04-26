"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type TouchEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { AhouDansu } from "@/components/feed/AhouDansu";
import { ProfileSuggestions } from "@/components/feed/ProfileSuggestions";
import {
  RegionFilter,
  regionToPrefectures,
  type RegionScope,
} from "@/components/feed/RegionFilter";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAllShops, SHOPS_PAGE_SIZE } from "@/lib/data";
import { EdoIcon } from "@/components/ui/EdoIcon";
import { getCached, setCached } from "@/lib/cache";
import { CATEGORIES, SUBCATEGORIES, getSubcategory } from "@/lib/constants";
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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
          prefectures,
          selectedSubcategory
        );
        if (cancelled) return;
        setShops(list as ShopWithOwner[]);
        setTotal(total);
        if (!selectedCategory && !selectedSubcategory && scope.kind === "japan") {
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
  }, [scope, selectedCategory, selectedSubcategory]);

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
      prefectures,
      selectedSubcategory
    );
    setShops((prev) => [...prev, ...(more as ShopWithOwner[])]);
    setPage(nextPage);
    setLoadingMore(false);
  }, [loadingMore, canLoadMore, page, selectedCategory, selectedSubcategory, scope]);

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

  // 本日のパワープッシュ楽座 — daily-rotating set (max 6) of shops with images.
  // The grid below shows ALL shops (carousel and grid intentionally overlap)
  // so users still see every 楽座 even if one is being featured up top.
  const featured = useMemo(() => {
    const withImage = shops.filter(
      (s) => s.image_urls && s.image_urls.length > 0
    );
    if (withImage.length === 0) return [] as ShopWithOwner[];
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const start = dayOfYear % withImage.length;
    const count = Math.min(6, withImage.length);
    const picks: ShopWithOwner[] = [];
    for (let i = 0; i < count; i++) {
      picks.push(withImage[(start + i) % withImage.length]);
    }
    return picks;
  }, [shops]);

  return (
    <div className="space-y-4">
      <AhouDansu />
      <WelcomeBanner />
      <WeeklyMarket />

      {/* Village functions — quick links discoverable on mobile */}
      <div className="grid grid-cols-4 gap-1.5">
        <Link
          href="/skills"
          className="rounded-xl border border-border hover:border-accent transition-colors px-2 py-2.5 flex flex-col items-center gap-0.5 no-underline bg-card text-center"
        >
          <span className="text-lg">🛠</span>
          <span className="text-[10px] font-bold leading-tight">
            SKILL
          </span>
        </Link>
        <Link
          href="/callouts"
          className="rounded-xl border border-border hover:border-accent transition-colors px-2 py-2.5 flex flex-col items-center gap-0.5 no-underline bg-card text-center"
        >
          <span className="text-lg">🤚</span>
          <span className="text-[10px] font-bold leading-tight">
            この指
          </span>
        </Link>
        <Link
          href="/search"
          className="rounded-xl border border-border hover:border-accent transition-colors px-2 py-2.5 flex flex-col items-center gap-0.5 no-underline bg-card text-center"
        >
          <span className="text-lg">🔍</span>
          <span className="text-[10px] font-bold leading-tight">検索</span>
        </Link>
        <Link
          href="/rankings"
          className="rounded-xl border border-border hover:border-accent transition-colors px-2 py-2.5 flex flex-col items-center gap-0.5 no-underline bg-card text-center"
        >
          <span className="text-lg">🏮</span>
          <span className="text-[10px] font-bold leading-tight">
            ランキング
          </span>
        </Link>
      </div>

      {/* 本日のパワープッシュ楽座 — auto-rotating carousel, swipeable */}
      {!loading && featured.length > 0 && (
        <FeaturedCarousel shops={featured} />
      )}

      {/* おすすめの座の民 — discover new villagers to follow */}
      <ProfileSuggestions />

      {/* Subcategory quick-chips — お米とやさい・お魚とお肉 etc. front and center */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
        <button
          onClick={() => {
            setSelectedSubcategory(null);
          }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
            selectedSubcategory === null
              ? "bg-accent text-white border-accent"
              : "bg-card border-border hover:border-accent/40"
          }`}
        >
          全部
        </button>
        {SUBCATEGORIES.map((sub) => {
          const active = selectedSubcategory === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedCategory(sub.category);
                setSelectedSubcategory(sub.id);
              }}
              className={`flex-shrink-0 pl-1.5 pr-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors flex items-center gap-1 ${
                active
                  ? "bg-accent text-white border-accent"
                  : "bg-card border-border hover:border-accent/40"
              }`}
            >
              <img
                src={sub.icon}
                alt=""
                className="w-7 h-7 object-contain flex-shrink-0"
              />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters: single row (region + category) — labels live inside the dropdowns themselves */}
      <div className="grid grid-cols-2 gap-2">
        <RegionFilter
          scope={scope}
          onChange={setScope}
          userPrefecture={profile?.prefecture ?? null}
        />
        <select
          value={selectedCategory ?? ""}
          onChange={(e) => {
            const next = e.target.value || null;
            setSelectedCategory(next);
            // Changing the parent invalidates any active subcategory
            setSelectedSubcategory(null);
          }}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 0.75rem center",
          }}
        >
          <option value="">🏷 すべてのジャンル</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Compact CTA: あなたも楽座を出しましょう */}
      <Link
        href={user ? "/settings/shops" : "/login"}
        className="block no-underline group"
      >
        <div
          className="relative overflow-hidden rounded-xl border border-accent/40 hover:shadow-md transition-all"
          style={{
            background:
              "linear-gradient(135deg, #f5e8d5 0%, #ffffff 50%, #f5e8d5 100%)",
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: "#c94d3a" }}
            >
              <EdoIcon name="rakuza" size={18} color="#ffffff" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text leading-tight">
                あなたも楽座を出しましょう
              </div>
              <div className="text-[10px] text-text-sub leading-tight">
                {user
                  ? "お試し出品（0円）も物々交換もOK"
                  : "登録して、あなたの才能を並べてみよう"}
              </div>
            </div>
            <div className="text-accent text-base flex-shrink-0">→</div>
          </div>
        </div>
      </Link>

      {/* Count line — placed right above the grid */}
      <p className="text-[11px] text-text-mute text-center">
        今 {total}座 並んでいます
      </p>

      {/* Shops showcase — 2-column grid */}
      {loading ? (
        <LoadingScreen step="楽座を読み込み中..." />
      ) : shops.length === 0 ? (
        <div
          className="text-center py-8 px-6 rounded-2xl border-2 border-dashed"
          style={{
            borderColor: "#c94d3a40",
            background:
              "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          <img
            src="/icons/empty-feed.png"
            alt=""
            className="w-36 h-36 mx-auto mb-3 rounded-xl"
          />
          <p className="text-sm font-bold" style={{ color: "#c94d3a" }}>
            このエリア・ジャンルの楽座はまだありません
          </p>
          <p className="text-xs text-text-sub mt-1.5">
            {user
              ? "最初の楽座を出して、市場を始めよう"
              : "登録して最初の楽座を出そう"}
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

/**
 * 本日のパワープッシュ楽座 — auto-rotating, swipeable carousel
 * of featured shops. The ribbon stays in place; only the body slides.
 */
function FeaturedCarousel({ shops }: { shops: ShopWithOwner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Auto-rotate every 4.5s
  useEffect(() => {
    if (shops.length <= 1 || paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % shops.length);
    }, 4500);
    return () => clearInterval(t);
  }, [shops.length, paused]);

  // Reset if the underlying list shrinks
  useEffect(() => {
    if (index >= shops.length) setIndex(0);
  }, [shops.length, index]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStart.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) {
      setIndex((i) => (i + (dx > 0 ? -1 : 1) + shops.length) % shops.length);
    }
    touchStart.current = null;
    setTimeout(() => setPaused(false), 1000);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 shadow-md"
      style={{
        borderColor: "#c94d3a",
        background: "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top ribbon — labels the section */}
      <div
        className="text-center py-1 px-3 text-[11px] font-bold text-white tracking-widest"
        style={{
          background:
            "linear-gradient(90deg, #c94d3a 0%, #d4612e 50%, #c94d3a 100%)",
        }}
      >
        🌟 本日のパワープッシュ楽座 🌟
      </div>

      {/* Sliding track */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {shops.map((shop) => (
            <div key={shop.id} className="w-full flex-shrink-0">
              <FeaturedShopBody shop={shop} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {shops.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-1.5">
          {shops.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 4000);
              }}
              aria-label={`楽座 ${i + 1} を表示`}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 14 : 5,
                height: 5,
                background: i === index ? "#c94d3a" : "#c94d3a40",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Body of one carousel slide (no ribbon, no border — those live on the wrapper).
 * Slimmer than before: w-24 image, tighter padding.
 */
function FeaturedShopBody({ shop }: { shop: ShopWithOwner }) {
  const router = useRouter();
  const image = shop.image_urls?.[0];

  return (
    <Link href={`/shop/${shop.id}`} className="no-underline block">
      <div className="flex">
        <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-bg">
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
              <EdoIcon name="rakuza" size={28} color="#ffffff" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              {shop.is_trial && (
                <span className="text-[9px] bg-accent text-white px-1 py-0.5 rounded-sm font-bold flex-shrink-0">
                  お試し
                </span>
              )}
              {shop.owner?.prefecture && (
                <span className="text-[10px] text-text-mute truncate">
                  📍 {shop.owner.prefecture}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-text leading-snug line-clamp-2">
              {shop.name}
            </h2>
          </div>
          <div className="flex items-end justify-between gap-2 mt-1">
            {shop.owner && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/u/${shop.owner!.username}`);
                }}
                className="flex items-center gap-1 min-w-0 hover:opacity-80 transition"
              >
                <Avatar
                  src={shop.owner.avatar_url}
                  alt={shop.owner.display_name}
                  size="sm"
                />
                <span className="text-[10px] text-text-sub truncate">
                  {shop.owner.display_name}
                </span>
              </button>
            )}
            <div className="text-sm font-bold text-accent flex-shrink-0">
              {shop.is_trial
                ? "0円〜"
                : shop.price_jpy != null
                ? `¥${shop.price_jpy.toLocaleString()}`
                : shop.price_text ?? ""}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * 和風 shop card — washi-paper background, thin vermilion top accent line
 * (the "笠木" hint without a literal roof), name + price share a single tight
 * info bar so the card stays compact.
 */
function ShopCard({ shop }: { shop: ShopWithOwner }) {
  const router = useRouter();
  const image = shop.image_urls?.[0];
  const sub = getSubcategory(shop.subcategory);

  return (
    <Link href={`/shop/${shop.id}`} className="no-underline block group">
      <div
        className="relative rounded-md border border-border/80 shadow-sm group-hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #fffaf0 0%, #fdf6e9 100%)",
        }}
      >
        {/* Thin vermilion top line — laid over the very top edge of the card */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] z-10 pointer-events-none"
          style={{ background: "#c94d3a" }}
        />

        {/* Image */}
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
              <EdoIcon name="rakuza" size={40} color="#ffffff" />
            </div>
          )}

          {/* Subcategory badge top-left (e.g. 🌾 お米とやさい) */}
          {sub && (
            <div className="absolute top-1.5 left-1.5 pointer-events-none">
              <div className="text-[9px] font-bold bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                {sub.emoji} {sub.label}
              </div>
            </div>
          )}

          {/* Nobori-style お試し flag */}
          {shop.is_trial && (
            <div className="absolute top-1.5 right-1.5 pointer-events-none">
              <div
                className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm shadow-sm"
                style={{ background: "#c94d3a", letterSpacing: "0.05em" }}
              >
                お試し
              </div>
            </div>
          )}

          {/* Owner avatar */}
          {shop.owner && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/u/${shop.owner!.username}`);
              }}
              className="absolute bottom-1 left-1 ring-2 ring-white rounded-full hover:scale-110 transition-transform shadow-md"
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

        {/* Tight info row: name + price + payment glyphs all on one strip */}
        <div className="px-2 py-1.5 flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <h3
              className="text-[12px] font-bold text-text leading-tight line-clamp-1"
              style={{ letterSpacing: "0.02em" }}
            >
              {shop.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] font-bold text-accent truncate">
                {shop.is_trial
                  ? "0円〜"
                  : shop.price_jpy != null
                  ? `¥${shop.price_jpy.toLocaleString()}`
                  : shop.price_text ?? ""}
              </span>
              <span className="flex gap-0.5 text-[10px] flex-shrink-0 text-text-mute">
                {shop.accepts_barter && <span title="物々交換可">🔄</span>}
                {shop.accepts_tip && <span title="投げ銭可">🪙</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
