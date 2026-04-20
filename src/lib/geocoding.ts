"use client";

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key).
 * Rate-limited to 1 req/sec — use sparingly.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&limit=1&countrycodes=jp`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "ja",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
