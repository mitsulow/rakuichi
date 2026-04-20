"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Profile, Shop, RecommendedShop } from "@/lib/types";
import { getCategoryByKey } from "@/lib/utils";

// Fix Leaflet default marker icons
const villageIcon = new L.DivIcon({
  html: '<div style="background:#c94d3a;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🏡</div>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const recommendedIcon = new L.DivIcon({
  html: '<div style="background:#b48a3d;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🌟</div>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface MapViewProps {
  villageShops: { profile: Profile; shops: Shop[] }[];
  recommendedShops: RecommendedShop[];
  showVillage: boolean;
  showRecommended: boolean;
  categoryFilter: string | null;
}

export function MapView({
  villageShops,
  recommendedShops,
  showVillage,
  showRecommended,
  categoryFilter,
}: MapViewProps) {
  return (
    <MapContainer
      center={[36.5, 138]}
      zoom={5}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: "400px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Village shops (paid member shops) */}
      {showVillage &&
        villageShops
          .filter((vs) => vs.profile.latitude && vs.profile.longitude)
          .filter(
            (vs) =>
              !categoryFilter ||
              vs.shops.some((s) => s.category === categoryFilter)
          )
          .map((vs) => (
            <Marker
              key={vs.profile.id}
              position={[vs.profile.latitude!, vs.profile.longitude!]}
              icon={villageIcon}
            >
              <Popup>
                <div className="text-center min-w-[150px]">
                  <p className="font-bold text-sm mb-1">
                    {vs.profile.display_name}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {vs.shops.map((shop) => {
                      const cat = getCategoryByKey(shop.category);
                      return (
                        <span key={shop.id} className="text-xs">
                          {cat?.emoji} {shop.name}
                        </span>
                      );
                    })}
                  </div>
                  <Link
                    href={`/u/${vs.profile.username}`}
                    className="text-xs text-accent"
                  >
                    詳しく見る →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

      {/* Recommended shops */}
      {showRecommended &&
        recommendedShops
          .filter(
            (rs) =>
              !categoryFilter || rs.category === categoryFilter
          )
          .map((rs) => (
            <Marker
              key={rs.id}
              position={[rs.latitude, rs.longitude]}
              icon={recommendedIcon}
            >
              <Popup>
                <div className="text-center min-w-[150px]">
                  <p className="font-bold text-sm mb-1">{rs.name}</p>
                  {rs.description && (
                    <p className="text-xs text-gray-600 mb-1">
                      {rs.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    推薦者：{rs.recommendation_count || 0}人
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
    </MapContainer>
  );
}
