"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES } from "@/lib/constants";
import { fetchMapVillageShops } from "@/lib/data";
import type { Profile, Shop } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" /> }
);

interface VillageShop {
  profile: Profile;
  shops: Shop[];
}

export default function MapPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [villageShops, setVillageShops] = useState<VillageShop[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchMapVillageShops();
      setVillageShops(data as VillageShop[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">🗾 楽市楽座マップ</h1>
      <p className="text-xs text-text-sub">
        どこで屋台がオープンしているか一目で分かるマップ
      </p>

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
      {loading ? (
        <div className="w-full h-[400px] bg-bg rounded-2xl animate-pulse" />
      ) : villageShops.length === 0 ? (
        <div className="text-center py-12 text-text-mute border border-border rounded-2xl">
          <p className="text-4xl mb-3">🗺</p>
          <p className="text-sm">まだマップに屋台が並んでいません</p>
          <p className="text-xs mt-1">
            MY座で都道府県を設定して、屋台を出すとここに並びます
          </p>
        </div>
      ) : (
        <div className="h-[calc(100vh-320px)] min-h-[400px] rounded-2xl overflow-hidden border border-border">
          <MapView
            villageShops={villageShops}
            recommendedShops={[]}
            showVillage={true}
            showRecommended={false}
            categoryFilter={categoryFilter}
          />
        </div>
      )}
    </div>
  );
}
