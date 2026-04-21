"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { WeeklyMarket } from "@/components/feed/WeeklyMarket";
import { WelcomeBanner } from "@/components/feed/WelcomeBanner";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAllShops, deleteShop } from "@/lib/data";
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

      {/* Edo-style noren header */}
      <div className="relative">
        <div
          className="text-center py-3 px-4"
          style={{
            background:
              "linear-gradient(180deg, #c94d3a 0%, #c94d3a 75%, transparent 100%)",
            clipPath:
              "polygon(0 0, 100% 0, 100% 75%, 95% 85%, 85% 75%, 75% 85%, 65% 75%, 55% 85%, 45% 75%, 35% 85%, 25% 75%, 15% 85%, 5% 75%, 0 85%)",
          }}
        >
          <h1
            className="text-lg font-bold text-white tracking-widest"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          >
            🏮 屋 台 🏮
          </h1>
        </div>
        <p className="text-[11px] text-text-mute text-center mt-1">
          今 {shops.length}軒 並んでいます
        </p>
      </div>

      {/* Prominent "自分も出店" CTA — always visible */}
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
                自分も屋台を出す
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
            <ShopCard
              key={shop.id}
              shop={shop}
              currentUserId={user?.id}
              onDeleted={(shopId) => {
                setShops((prev) => {
                  const next = prev.filter((s) => s.id !== shopId);
                  setCached("feed:shops", next);
                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({
  shop,
  currentUserId,
  onDeleted,
}: {
  shop: ShopWithOwner;
  currentUserId?: string | null;
  onDeleted?: (shopId: string) => void;
}) {
  const router = useRouter();
  const image = shop.image_urls?.[0];
  const isOwner = currentUserId === shop.owner_id;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const startLongPress = () => {
    if (!isOwner) return;
    longPressed.current = false;
    longPressTimer.current = setTimeout(async () => {
      longPressed.current = true;
      // Haptic (if supported)
      try {
        (navigator as Navigator & { vibrate?: (n: number) => void }).vibrate?.(
          20
        );
      } catch {}
      const ok = confirm(`「${shop.name}」を閉じますか？`);
      if (!ok) return;
      const result = await deleteShop(shop.id);
      if (result.error) {
        alert(`削除に失敗: ${result.error}`);
        return;
      }
      onDeleted?.(shop.id);
    }, 550);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (longPressed.current) {
      // Swallow the click that follows a long-press
      e.preventDefault();
      e.stopPropagation();
      longPressed.current = false;
    }
  };

  return (
    <Link
      href={`/shop/${shop.id}`}
      className="no-underline block select-none"
      onClick={handleClick}
      onContextMenu={(e) => isOwner && e.preventDefault()}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
    >
      <Card className="!p-0 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col relative">
        {/* Image with title overlay on top */}
        <div className="relative aspect-square overflow-hidden bg-bg">
          {image ? (
            <img
              src={image}
              alt={shop.name}
              className="w-full h-full object-cover"
              draggable={false}
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

          {/* Dark gradient at top for title legibility */}
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

          {/* Mine hint (faint) — shows for owner */}
          {isOwner && (
            <div className="absolute top-1.5 right-1.5 bg-white/80 text-[9px] text-text-sub px-1.5 py-0.5 rounded-full pointer-events-none">
              長押しで削除
            </div>
          )}

          {/* Owner avatar — separate tap target in corner */}
          {shop.owner && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/u/${shop.owner!.username}`);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-1.5 left-1.5 ring-2 ring-white/80 rounded-full hover:scale-110 transition-transform"
              title={`${shop.owner.display_name}のMY座`}
              aria-label={`${shop.owner.display_name}のMY座へ`}
            >
              <Avatar
                src={shop.owner.avatar_url}
                alt={shop.owner.display_name}
                size="sm"
              />
            </button>
          )}
        </div>

        {/* Compact info strip */}
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
