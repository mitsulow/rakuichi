"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES } from "@/lib/constants";
import { mockProfiles, mockShops, mockRecommendedShops } from "@/lib/mock-data";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" /> }
);

export default function MapPage() {
  const [showVillage, setShowVillage] = useState(true);
  const [showRecommended, setShowRecommended] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const villageShops = mockProfiles
    .filter((p) => p.is_paid)
    .map((profile) => ({
      profile,
      shops: mockShops.filter((s) => s.owner_id === profile.id),
    }))
    .filter((vs) => vs.shops.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">🗾 楽市楽座マップ</h1>
      <p className="text-xs text-text-sub">
        みんなで育てる自然派マップ
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowVillage(!showVillage)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
            showVillage
              ? "bg-accent text-white"
              : "bg-card text-text-sub border border-border"
          }`}
        >
          🏡 村人の店
        </button>
        <button
          onClick={() => setShowRecommended(!showRecommended)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
            showRecommended
              ? "bg-gold text-white"
              : "bg-card text-text-sub border border-border"
          }`}
        >
          🌟 推薦店
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
            !categoryFilter
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
              setCategoryFilter(
                categoryFilter === cat.id ? null : cat.id
              )
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              categoryFilter === cat.id
                ? "bg-accent text-white"
                : "bg-card text-text-sub border border-border"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-320px)] min-h-[400px] rounded-2xl overflow-hidden border border-border">
        <MapView
          villageShops={villageShops}
          recommendedShops={mockRecommendedShops}
          showVillage={showVillage}
          showRecommended={showRecommended}
          categoryFilter={categoryFilter}
        />
      </div>
    </div>
  );
}
