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

  const selectChevron =
    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

  return (
    <div className="space-y-3 relative">
      {/* Hero — bold tagline only, FAB handles the action */}
      <div
        className="text-center py-3 px-4 rounded-2xl border-2"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
        }}
      >
        <h1
          className="text-xl font-bold tracking-wide leading-tight"
          style={{ color: "#c94d3a" }}
        >
          自然派・本格派・ナチュラル
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          全国の自然食 ・ 代替医療 ・ 自然療法 ・ ナチュラルな店
        </p>
      </div>

      {/* Single-row filter — type + category */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={tab}
          onChange={(e) => {
            setTab(e.target.value as Tab);
            setCategoryFilter(null);
          }}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat"
          style={{
            backgroundImage: selectChevron,
            backgroundPosition: "right 0.75rem center",
          }}
        >
          <option value="all">🗺 すべて表示</option>
          <option value="village">🏡 村人の楽座</option>
          <option value="recommended">🌟 みんなの推薦店</option>
        </select>
        <select
          value={categoryFilter ?? ""}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          disabled={tab === "all"}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat disabled:opacity-50"
          style={{
            backgroundImage: selectChevron,
            backgroundPosition: "right 0.75rem center",
          }}
        >
          <option value="">
            {tab === "all" ? "🏷 種類を選んでから" : "🏷 すべてのジャンル"}
          </option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Counts row */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-text-mute">
        <span className="inline-flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#c94d3a" }}
          />
          村人 {villageShops.length}座
        </span>
        <span className="text-text-mute/40">／</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#5a7d4a" }}
          />
          推薦 {recommendedShops.length}店
        </span>
        {categoryFilter && (
          <>
            <span className="text-text-mute/40">／</span>
            <button
              onClick={() => setCategoryFilter(null)}
              className="text-accent underline"
            >
              絞り込み解除
            </button>
          </>
        )}
      </div>

      {/* Map */}
      {loading ? (
        <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" />
      ) : (
        <div className="h-[calc(100vh-330px)] min-h-[420px] rounded-2xl overflow-hidden border-2 border-border shadow-md">
          <MapView
            villageShops={villageShops}
            recommendedShops={recommendedShops}
            showVillage={showVillage}
            showRecommended={showRecommended}
            categoryFilter={categoryFilter}
          />
        </div>
      )}

      {/* Floating action button — above bottom nav and Leaflet attribution */}
      {userId && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-4 text-white rounded-full shadow-xl px-4 py-3 text-sm font-bold hover:opacity-90 transition z-[1000] flex items-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, #c94d3a 0%, #d4612e 100%)",
            boxShadow: "0 4px 14px rgba(201, 77, 58, 0.4)",
          }}
        >
          <span className="text-lg leading-none">＋</span>
          <span>おすすめの店を追加</span>
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

