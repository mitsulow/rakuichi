"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { NATURAL_CATEGORIES, CATEGORIES } from "@/lib/constants";
import {
  fetchMapVillageShops,
  fetchRecommendedShops,
} from "@/lib/data";
import { AddRecommendationModal } from "@/components/map/AddRecommendationModal";
import { getCached, setCached } from "@/lib/cache";
import type { Profile, Shop, RecommendedShop } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" />
    ),
  }
);

interface VillageShop {
  profile: Profile;
  shops: Shop[];
}

type Tab = "all" | "village" | "recommended";

export default function MapPage() {
  const [tab, setTab] = useState<Tab>("recommended");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [villageShops, setVillageShops] = useState<VillageShop[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<VillageShop[]>("map:village") ?? [];
  });
  const [recommendedShops, setRecommendedShops] = useState<RecommendedShop[]>(
    () => {
      if (typeof window === "undefined") return [];
      return getCached<RecommendedShop[]>("map:recommended") ?? [];
    }
  );
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached("map:recommended");
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadAll() {
    try {
      const [village, rec] = await Promise.all([
        fetchMapVillageShops().catch(() => []),
        fetchRecommendedShops().catch(() => []),
      ]);
      setVillageShops(village as VillageShop[]);
      setRecommendedShops(rec as RecommendedShop[]);
      setCached("map:village", village);
      setCached("map:recommended", rec);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        setUserId(session?.user.id ?? null);
        await loadAll();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, []);

  const showVillage = tab === "all" || tab === "village";
  const showRecommended = tab === "all" || tab === "recommended";

  // Which category set to show depends on tab
  const categoryOptions =
    tab === "village" ? CATEGORIES : NATURAL_CATEGORIES;

  return (
    <div className="space-y-4 relative">
      {/* Hero */}
      <div className="text-center py-2 space-y-2">
        <h1 className="text-xl font-bold tracking-wide">
          自然派 ・ 本格派 ・ ナチュラル
        </h1>
        <p className="text-xs text-text-mute">
          全国の自然食・代替医療・自然療法がここに集まる
        </p>
        {userId && (
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <span>🌟</span>
            <span>おすすめの店を登録する</span>
          </button>
        )}
      </div>

      {/* Filters as dropdowns */}
      <div>
        <div className="text-[11px] text-text-sub font-medium mb-1.5 px-1">
          🔍 絞り込み検索
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-text-mute mb-1 px-1">種類</div>
            <select
              value={tab}
              onChange={(e) => {
                setTab(e.target.value as Tab);
                setCategoryFilter(null);
              }}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
              }}
            >
              <option value="all">🗺 すべて</option>
              <option value="village">🏡 村人の楽座</option>
              <option value="recommended">🌟 みんなの推薦店</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] text-text-mute mb-1 px-1">ジャンル</div>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              disabled={tab === "all"}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat disabled:opacity-50"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
              }}
            >
              <option value="">
                {tab === "all" ? "種類を選んでから" : "すべてのジャンル"}
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center justify-between text-xs text-text-mute px-1">
        <span>
          🏡 {villageShops.length}件 ・ 🌟 {recommendedShops.length}件
        </span>
        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter(null)}
            className="text-accent"
          >
            絞り込み解除
          </button>
        )}
      </div>

      {/* Map */}
      {loading ? (
        <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" />
      ) : (
        <div className="h-[calc(100vh-360px)] min-h-[400px] rounded-2xl overflow-hidden border border-border">
          <MapView
            villageShops={villageShops}
            recommendedShops={recommendedShops}
            showVillage={showVillage}
            showRecommended={showRecommended}
            categoryFilter={categoryFilter}
          />
        </div>
      )}

      {/* Floating action button - above bottom nav and Leaflet attribution */}
      {userId && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-4 bg-accent text-white rounded-full shadow-xl px-4 py-3 text-sm font-medium hover:bg-accent/90 transition-colors z-[1000] flex items-center gap-1.5"
        >
          <span className="text-base">＋</span>
          <span>おすすめを追加</span>
        </button>
      )}

      {userId && (
        <AddRecommendationModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={userId}
          onCreated={(shop) => {
            setRecommendedShops((prev) => [shop, ...prev]);
          }}
        />
      )}
    </div>
  );
}

