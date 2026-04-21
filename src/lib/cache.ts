"use client";

/**
 * Lightweight localStorage cache for page data.
 * Shows stale-while-revalidate: render cached instantly, refresh in background.
 */

const PREFIX = "rakuichi:cache:";

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — ignore
  }
}
