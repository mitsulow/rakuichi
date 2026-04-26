"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchShopById,
  findOrCreateChat,
  deleteShop,
  fetchShopsByOwner,
} from "@/lib/data";
import { getCategoryByKey } from "@/lib/utils";
import { getSubcategory, getDeliveryMethod } from "@/lib/constants";
import type { Shop, Profile } from "@/lib/types";

type ShopWithOwner = Shop & { owner?: Profile | null };

export default function ShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [shop, setShop] = useState<ShopWithOwner | null>(null);
  const [otherShops, setOtherShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchShopById(shopId);
      if (cancelled) return;
      setShop(s as ShopWithOwner | null);
      if (s?.owner_id) {
        const others = await fetchShopsByOwner(s.owner_id);
        if (!cancelled) {
          setOtherShops(others.filter((o) => o.id !== shopId));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (loading) {
    return <LoadingScreen step="楽座の詳細を読み込み中..." />;
  }

  if (!shop) {
    notFound();
  }

  const owner = shop.owner;
  const isOwner = user?.id === shop.owner_id;
  const hasImages = shop.image_urls && shop.image_urls.length > 0;
  const category = getCategoryByKey(shop.category);

  const handleContact = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!owner || contacting) return;
    setContacting(true);
    const chatId = await findOrCreateChat(owner.id);
    setContacting(false);
    if (chatId) router.push(`/chat/${chatId}`);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `楽市楽座: ${shop.name}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      // last resort: nothing
    }
  };

  return (
    <div className="space-y-4 -mx-4 -mt-4 pb-4">
      {/* Hero image carousel */}
      <div className="relative">
        {hasImages ? (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full aspect-square overflow-hidden bg-bg cursor-zoom-in"
            >
              <img
                src={shop.image_urls[selectedImage]}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            </button>
            {shop.image_urls.length > 1 && (
              <div className="flex gap-1.5 px-4 py-2 overflow-x-auto hide-scrollbar">
                {shop.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className="aspect-square flex items-center justify-center text-6xl"
            style={{
              background:
                "linear-gradient(135deg, #c94d3a 0%, #d4a043 50%, #5a7d4a 100%)",
            }}
          >
            {category?.emoji ?? "🏪"}
          </div>
        )}

        {/* Top overlay buttons */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-lg shadow-md"
          aria-label="戻る"
        >
          ←
        </button>
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-lg shadow-md"
          aria-label="シェア"
        >
          📤
        </button>
        {shareToast && (
          <div className="absolute top-16 right-3 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full">
            URLをコピーしました
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Category + subcategory + trial badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryTag categoryId={shop.category} size="sm" />
          {(() => {
            const sub = getSubcategory(shop.subcategory);
            return sub ? (
              <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                {sub.emoji} {sub.label}
              </span>
            ) : null;
          })()}
          {shop.is_trial && (
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
              🌱 お試し出品
            </span>
          )}
          {owner?.prefecture && (
            <span className="text-[10px] text-text-mute">
              📍 {owner.prefecture}
              {owner.city ? ` ${owner.city}` : ""}
            </span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-xl font-bold leading-tight">{shop.name}</h1>

        {/* Price + accepted methods — prominent action card */}
        <div
          className="rounded-2xl border-2 p-4"
          style={{
            borderColor: "#c94d3a40",
            background: "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] text-text-mute font-medium tracking-widest mb-0.5">
                値 段
              </div>
              <div className="text-3xl font-bold text-accent leading-none">
                {shop.is_trial
                  ? "0円〜"
                  : shop.price_jpy != null
                  ? `¥${shop.price_jpy.toLocaleString()}`
                  : shop.price_text ?? "応相談"}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {shop.accepts_barter && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-white rounded-full px-2.5 py-1 border border-border">
                  🔄 物々交換OK
                </span>
              )}
              {shop.accepts_tip && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-white rounded-full px-2.5 py-1 border border-border">
                  🪙 投げ銭歓迎
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delivery methods */}
        {shop.delivery_methods && shop.delivery_methods.length > 0 && (
          <div className="rounded-xl border border-border bg-card px-3 py-2">
            <div className="text-[10px] text-text-mute font-medium tracking-widest mb-1">
              受 け 渡 し
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shop.delivery_methods.map((id) => {
                const d = getDeliveryMethod(id);
                if (!d) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-[11px] bg-bg rounded-full px-2.5 py-1 border border-border"
                    title={d.description}
                  >
                    {d.emoji} {d.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {shop.description && (
          <Card>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {shop.description}
            </p>
          </Card>
        )}

        {/* Owner card — magazine-style with skills + migration */}
        {owner && (
          <Link href={`/u/${owner.username}`} className="block no-underline">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar
                  src={owner.avatar_url}
                  alt={owner.display_name}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-text">
                      {owner.display_name}
                    </span>
                    {owner.life_work_level && (
                      <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-medium">
                        {owner.life_work_level}
                      </span>
                    )}
                  </div>
                  {owner.life_work && (
                    <div className="text-xs text-text-sub mt-0.5">
                      🌱 ライフワーク: {owner.life_work}
                    </div>
                  )}
                  {owner.rice_work && (
                    <div className="text-xs text-text-mute mt-0.5">
                      🍚 ライスワーク: {owner.rice_work}
                    </div>
                  )}
                  {owner.skills && owner.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {owner.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-bg border border-border rounded-full px-1.5 py-0.5"
                        >
                          🛠 {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {owner.migration_percent > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-text-mute mb-0.5">
                        <span>🌾 総フリーランス化</span>
                        <span className="font-medium">
                          {owner.migration_percent}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${owner.migration_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-accent mt-2">
                マイページを見る →
              </div>
            </Card>
          </Link>
        )}

        {/* Other shops by the same owner */}
        {otherShops.length > 0 && owner && (
          <div>
            <div className="text-xs font-medium text-text-sub mb-2 px-1">
              この店主の他の楽座（{otherShops.length}座）
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
              {otherShops.map((other) => (
                <Link
                  key={other.id}
                  href={`/shop/${other.id}`}
                  className="no-underline flex-shrink-0 w-32"
                >
                  <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-bg overflow-hidden">
                      {other.image_urls?.[0] ? (
                        <img
                          src={other.image_urls[0]}
                          alt={other.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-2xl"
                          style={{
                            background:
                              "linear-gradient(135deg, #c94d3a 0%, #d4a043 100%)",
                          }}
                        >
                          {getCategoryByKey(other.category)?.emoji ?? "🏪"}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-text line-clamp-2 leading-tight">
                        {other.name}
                      </div>
                      <div className="text-[10px] text-accent mt-1 font-bold">
                        {other.is_trial
                          ? "0円〜"
                          : other.price_jpy != null
                          ? `¥${other.price_jpy.toLocaleString()}`
                          : other.price_text ?? ""}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isOwner && owner && (
          <div className="sticky bottom-20 md:static z-20 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleContact}
              disabled={contacting}
              className="w-full shadow-lg"
            >
              {contacting ? "準備中..." : "💬 この楽座の店主に連絡する"}
            </Button>
            <p className="text-center text-[10px] text-text-mute mt-1.5">
              {shop.accepts_barter && shop.accepts_tip
                ? "値段・物々交換・投げ銭、チャットで相談できます"
                : shop.accepts_barter
                ? "値段交渉や物々交換も、チャットで相談できます"
                : shop.accepts_tip
                ? "投げ銭で気持ちを伝えることもできます"
                : "チャットで詳細を聞いてみよう"}
            </p>
          </div>
        )}

        {lightboxOpen && hasImages && (
          <ImageLightbox
            images={shop.image_urls}
            startIndex={selectedImage}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {isOwner && (
          <div className="space-y-2">
            <Link href="/settings/shops" className="block no-underline">
              <Button variant="secondary" size="lg" className="w-full">
                ✏️ この楽座を編集
              </Button>
            </Link>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`「${shop.name}」を閉じますか？`)) return;
                const result = await deleteShop(shop.id);
                if (result.error) {
                  alert(`削除に失敗: ${result.error}`);
                  return;
                }
                try {
                  localStorage.removeItem("rakuichi:cache:feed:shops");
                  localStorage.removeItem("rakuichi:cache:myShops");
                } catch {}
                router.push("/settings/shops");
              }}
              className="w-full text-center text-xs text-red-500 underline py-2"
            >
              🗑 この楽座を閉じる（削除）
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
