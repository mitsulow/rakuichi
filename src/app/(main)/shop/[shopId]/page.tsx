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
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchShopById, findOrCreateChat, deleteShop } from "@/lib/data";
import { getCategoryByKey } from "@/lib/utils";
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
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchShopById(shopId);
      if (cancelled) return;
      setShop(s as ShopWithOwner | null);
      setLoading(false);
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

  return (
    <div className="space-y-4 -mx-4 -mt-4">
      {/* Image carousel */}
      <div className="relative">
        {hasImages ? (
          <>
            <div className="aspect-square overflow-hidden bg-bg">
              <img
                src={shop.image_urls[selectedImage]}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            </div>
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

        {/* Back button overlay */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-lg shadow-md"
          aria-label="戻る"
        >
          ←
        </button>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Category + trial badge */}
        <div className="flex items-center gap-2">
          <CategoryTag categoryId={shop.category} size="sm" />
          {shop.is_trial && (
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
              🌱 お試し出品
            </span>
          )}
        </div>

        {/* Name + Price */}
        <div>
          <h1 className="text-xl font-bold">{shop.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-2xl font-bold text-accent">
              {shop.is_trial
                ? "0円〜"
                : shop.price_jpy != null
                ? `¥${shop.price_jpy.toLocaleString()}`
                : shop.price_text ?? "価格未設定"}
            </div>
            <div className="flex gap-1.5 text-sm">
              {shop.accepts_barter && (
                <span className="inline-flex items-center gap-1 text-xs bg-bg rounded-full px-2 py-1 border border-border">
                  🔄 物々交換
                </span>
              )}
              {shop.accepts_tip && (
                <span className="inline-flex items-center gap-1 text-xs bg-bg rounded-full px-2 py-1 border border-border">
                  🪙 投げ銭
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <Card>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {shop.description}
            </p>
          </Card>
        )}

        {/* Owner card */}
        {owner && (
          <Card>
            <div className="flex items-center gap-3">
              <Link href={`/u/${owner.username}`} className="no-underline">
                <Avatar
                  src={owner.avatar_url}
                  alt={owner.display_name}
                  size="md"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/u/${owner.username}`}
                  className="font-medium text-sm no-underline"
                >
                  {owner.display_name}
                </Link>
                {owner.life_work && (
                  <div className="text-xs text-text-sub mt-0.5">
                    {owner.life_work}
                    {owner.life_work_level && `・${owner.life_work_level}`}
                  </div>
                )}
                {owner.prefecture && (
                  <div className="text-xs text-text-mute mt-0.5">
                    📍 {owner.prefecture}
                    {owner.city ? ` ${owner.city}` : ""}
                  </div>
                )}
              </div>
              <Link
                href={`/u/${owner.username}`}
                className="text-xs text-accent no-underline whitespace-nowrap"
              >
                MY座を見る →
              </Link>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        {!isOwner && owner && (
          <div className="sticky bottom-20 md:static z-20">
            <Button
              variant="primary"
              size="lg"
              onClick={handleContact}
              disabled={contacting}
              className="w-full shadow-lg"
            >
              {contacting ? "準備中..." : "💬 この楽座の店主に連絡する"}
            </Button>
          </div>
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
                // Clear the feed cache so the deleted shop doesn't reappear
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
