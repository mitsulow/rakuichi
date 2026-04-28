"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchRecommendedShopById,
  toggleRecommendation,
  fetchUserRecommendations,
} from "@/lib/data";
import { getNaturalCategory } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { RecommendedShop, Profile } from "@/lib/types";

type RecShopWithRecs = RecommendedShop & {
  recommendations?: Array<{
    id: string;
    user_id: string;
    comment: string | null;
    created_at: string;
    profile?: Profile | null;
  }>;
};

export default function RecommendedShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [shop, setShop] = useState<RecShopWithRecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRecommend, setMyRecommend] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchRecommendedShopById(id);
      if (cancelled) return;
      setShop(s as RecShopWithRecs | null);
      setLoading(false);
      if (user) {
        const myRecs = await fetchUserRecommendations(user.id);
        if (!cancelled) setMyRecommend(myRecs.has(id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (loading) {
    return <LoadingScreen step="推薦店の情報を読み込み中..." />;
  }
  if (!shop) {
    notFound();
  }

  const category = getNaturalCategory(shop.category);
  const recs = shop.recommendations ?? [];
  const count = recs.length;

  const handleRecommend = async () => {
    if (!user || busy) {
      if (!user) router.push("/login");
      return;
    }
    setBusy(true);
    const result = await toggleRecommendation(id, user.id);
    setMyRecommend(result.recommended);
    // Refetch to update count
    const s = await fetchRecommendedShopById(id);
    setShop(s as RecShopWithRecs | null);
    setBusy(false);
  };

  return (
    <div className="space-y-4 -mx-4 -mt-4">
      {/* Image / header */}
      <div className="relative">
        {shop.image_url ? (
          <div className="aspect-[16/10] overflow-hidden bg-bg">
            <img
              src={shop.image_url}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="aspect-[16/10] flex items-center justify-center text-6xl"
            style={{
              background:
                "linear-gradient(135deg, #5a7d4a 0%, #d4a043 50%, #c94d3a 100%)",
            }}
          >
            {category?.emoji ?? "🌟"}
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-lg shadow-md"
          aria-label="戻る"
        >
          ←
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Category chip */}
        {category && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-bg rounded-full px-2 py-1 border border-border">
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
            <span className="text-xs text-text-mute">
              🌟 {count}人が推薦
            </span>
          </div>
        )}

        {/* Name */}
        <div>
          <h1 className="text-xl font-bold">{shop.name}</h1>
          {(shop.prefecture || shop.city) && (
            <p className="text-xs text-text-mute mt-1">
              📍 {shop.prefecture}
              {shop.city ? ` ${shop.city}` : ""}
              {shop.address && shop.address !== `${shop.prefecture}${shop.city}`
                ? ` ${shop.address}`
                : ""}
            </p>
          )}
        </div>

        {/* Description */}
        {shop.description && (
          <Card>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {shop.description}
            </p>
          </Card>
        )}

        {/* Contact */}
        {(shop.phone || shop.website) && (
          <Card>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-sub">📞 連絡先</h3>
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="block text-sm text-accent no-underline"
                >
                  📞 {shop.phone}
                </a>
              )}
              {shop.website && (
                <a
                  href={shop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-accent no-underline break-all"
                >
                  🌐 {shop.website}
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Map link — Google Maps directions */}
        {shop.latitude && shop.longitude && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block no-underline"
          >
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗺</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">Googleマップで開く</div>
                  <div className="text-xs text-text-mute">経路案内も使える</div>
                </div>
                <span className="text-accent">→</span>
              </div>
            </Card>
          </a>
        )}

        {/* Recommend button */}
        <Button
          variant={myRecommend ? "secondary" : "primary"}
          size="lg"
          onClick={handleRecommend}
          disabled={busy}
          className="w-full"
        >
          {myRecommend
            ? "✓ 推薦済み（タップで取り消し）"
            : "🌟 この店を推薦する"}
        </Button>

        {/* Recommenders */}
        {recs.length > 0 && (
          <Card>
            <h3 className="text-sm font-bold text-text-sub mb-2">
              🌟 推薦してるむらびと（{recs.length}人）
            </h3>
            <div className="space-y-2">
              {recs.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  {r.profile ? (
                    <Link href={`/u/${r.profile.username}`}>
                      <Avatar
                        src={r.profile.avatar_url}
                        alt={r.profile.display_name}
                        size="xs"
                      />
                    </Link>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-bg" />
                  )}
                  <div className="flex-1 min-w-0">
                    {r.profile && (
                      <Link
                        href={`/u/${r.profile.username}`}
                        className="text-xs font-medium no-underline"
                      >
                        {r.profile.display_name}
                      </Link>
                    )}
                    {r.comment && (
                      <p className="text-xs text-text-sub mt-0.5">
                        「{r.comment}」
                      </p>
                    )}
                    <p className="text-[10px] text-text-mute mt-0.5">
                      {formatRelativeTime(r.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {shop.is_seed && (
          <p className="text-[10px] text-text-mute text-center py-2">
            ※ この店舗情報は運営のスターターデータです。
            正確な情報は店舗に直接ご確認ください。
          </p>
        )}
      </div>
    </div>
  );
}
