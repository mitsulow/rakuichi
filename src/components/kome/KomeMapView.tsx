"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  AttributionControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { KomeField } from "@/lib/types";

// Prefecture-center fallback coordinates (used when a field has no lat/lng).
const PREFECTURE_COORDS: Record<string, [number, number]> = {
  北海道: [43.06, 141.35],
  青森県: [40.82, 140.74],
  岩手県: [39.7, 141.15],
  宮城県: [38.27, 140.87],
  秋田県: [39.72, 140.1],
  山形県: [38.24, 140.36],
  福島県: [37.75, 140.47],
  茨城県: [36.34, 140.45],
  栃木県: [36.57, 139.88],
  群馬県: [36.39, 139.06],
  埼玉県: [35.86, 139.65],
  千葉県: [35.6, 140.12],
  東京都: [35.69, 139.69],
  神奈川県: [35.45, 139.64],
  新潟県: [37.9, 139.02],
  富山県: [36.7, 137.21],
  石川県: [36.59, 136.63],
  福井県: [36.07, 136.22],
  山梨県: [35.66, 138.57],
  長野県: [36.65, 138.18],
  岐阜県: [35.39, 136.72],
  静岡県: [34.98, 138.38],
  愛知県: [35.18, 136.91],
  三重県: [34.73, 136.51],
  滋賀県: [35.0, 135.87],
  京都府: [35.02, 135.76],
  大阪府: [34.69, 135.52],
  兵庫県: [34.69, 135.18],
  奈良県: [34.69, 135.83],
  和歌山県: [34.23, 135.17],
  鳥取県: [35.5, 134.24],
  島根県: [35.47, 133.05],
  岡山県: [34.66, 133.93],
  広島県: [34.4, 132.46],
  山口県: [34.19, 131.47],
  徳島県: [34.07, 134.56],
  香川県: [34.34, 134.04],
  愛媛県: [33.84, 132.77],
  高知県: [33.56, 133.53],
  福岡県: [33.61, 130.42],
  佐賀県: [33.25, 130.3],
  長崎県: [32.74, 129.87],
  熊本県: [32.79, 130.74],
  大分県: [33.24, 131.61],
  宮崎県: [31.91, 131.42],
  鹿児島県: [31.56, 130.56],
  沖縄県: [26.21, 127.68],
};

const riceIcon = new L.DivIcon({
  html: '<div style="background:#5a7d4a;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🌾</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface KomeMapViewProps {
  fields: KomeField[];
}

export function KomeMapView({ fields }: KomeMapViewProps) {
  return (
    <MapContainer
      center={[36.5, 138]}
      zoom={5}
      attributionControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />
      <AttributionControl position="bottomright" prefix={false} />
      {fields.map((f) => {
        let lat = f.latitude;
        let lng = f.longitude;
        if (lat == null || lng == null) {
          const fallback = PREFECTURE_COORDS[f.prefecture];
          if (!fallback) return null;
          // Tiny jitter so multiple fields in the same prefecture don't stack
          const jitter = (f.id.charCodeAt(0) % 20 - 10) / 100;
          lat = fallback[0] + jitter;
          lng = fallback[1] + jitter;
        }
        return (
          <Marker
            key={f.id}
            position={[lat, lng]}
            icon={riceIcon}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  🌾 {f.name}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  📍 {f.prefecture}
                  {f.city ? ` ${f.city}` : ""}
                </div>
                {f.owner && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {f.owner.display_name} さん
                  </div>
                )}
                <Link
                  href={`/kome/${f.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    color: "#c94d3a",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  詳細を見る →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
