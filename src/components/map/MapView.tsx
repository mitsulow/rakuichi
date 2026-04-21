"use client";

import { MapContainer, TileLayer, Marker, Popup, AttributionControl } from "react-leaflet";
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

function makeRecIcon(emoji: string) {
  return new L.DivIcon({
    html: `<div style="background:#b48a3d;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const recommendedIcons: Record<string, L.DivIcon> = {
  natural_food: makeRecIcon("🌾"),
  alt_medicine: makeRecIcon("🪷"),
  natural_therapy: makeRecIcon("🌿"),
  natural_goods: makeRecIcon("🧺"),
  natural_cafe: makeRecIcon("☕"),
  default: makeRecIcon("🌟"),
};

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
      attributionControl={false}
    >
      <AttributionControl position="bottomleft" prefix={false} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
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
              icon={recommendedIcons[rs.category] ?? recommendedIcons.default}
            >
              <Popup>
                <div className="min-w-[180px]">
                  {rs.image_url && (
                    <img
                      src={rs.image_url}
                      alt={rs.name}
                      className="w-full h-20 object-cover rounded mb-1.5"
                    />
                  )}
                  <p className="font-bold text-sm mb-1">{rs.name}</p>
                  {(rs.prefecture || rs.city) && (
                    <p className="text-xs text-gray-500 mb-1">
                      📍 {rs.prefecture}{rs.city ? ` ${rs.city}` : ""}
                    </p>
                  )}
                  {rs.description && (
                    <p className="text-xs text-gray-600 mb-1">
                      {rs.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      推薦 {rs.recommendation_count || 0}
                    </p>
                    {rs.website && (
                      <a
                        href={rs.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent"
                      >
                        サイト →
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
    </MapContainer>
  );
}
