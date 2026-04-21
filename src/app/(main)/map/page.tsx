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

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        <TabButton
          active={tab === "all"}
          onClick={() => {
            setTab("all");
            setCategoryFilter(null);
          }}
          label="すべて"
          emoji="🗺"
        />
        <TabButton
          active={tab === "village"}
          onClick={() => {
            setTab("village");
            setCategoryFilter(null);
          }}
          label="座の民の楽座"
          emoji="🏡"
        />
        <TabButton
          active={tab === "recommended"}
          onClick={() => {
            setTab("recommended");
            setCategoryFilter(null);
          }}
          label="みんなの推薦店"
          emoji="🌟"
        />
      </div>

      {/* Category filter - hidden on "all" tab since categories differ */}
      {tab !== "all" && (
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              !categoryFilter
                ? "bg-accent text-white"
                : "bg-card text-text-sub border border-border"
            }`}
          >
            すべてのジャンル
          </button>
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setCategoryFilter(categoryFilter === cat.id ? null : cat.id)
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? "bg-accent text-white"
                  : "bg-card text-text-sub border border-border"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

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

function TabButton({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-colors font-medium ${
        active
          ? "bg-accent text-white"
          : "bg-card text-text-sub border border-border hover:bg-bg"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
