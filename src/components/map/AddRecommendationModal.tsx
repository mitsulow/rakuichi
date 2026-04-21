"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { createRecommendedShop } from "@/lib/data";
import { geocodeAddress } from "@/lib/geocoding";
import { NATURAL_CATEGORIES, PREFECTURES } from "@/lib/constants";
import type { RecommendedShop } from "@/lib/types";

interface AddRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreated: (shop: RecommendedShop) => void;
}

export function AddRecommendationModal({
  isOpen,
  onClose,
  userId,
  onCreated,
}: AddRecommendationModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "natural_food",
    prefecture: "",
    city: "",
    address: "",
    description: "",
    phone: "",
    website: "",
    image_url: null as string | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim() || !form.prefecture) {
      setError("店名と都道府県は必須です");
      return;
    }

    setSubmitting(true);

    // Geocode: prefecture + city + address
    const fullAddress = [form.prefecture, form.city, form.address]
      .filter(Boolean)
      .join("");
    let coords = await geocodeAddress(fullAddress);
    if (!coords) {
      // fallback: prefecture only
      coords = await geocodeAddress(form.prefecture);
    }
    if (!coords) {
      setError("住所が見つかりませんでした。都道府県だけでもOKです");
      setSubmitting(false);
      return;
    }

    const result = await createRecommendedShop(
      {
        name: form.name.trim(),
        category: form.category,
        prefecture: form.prefecture,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        latitude: coords.lat,
        longitude: coords.lng,
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        image_url: form.image_url,
      },
      userId
    );

    setSubmitting(false);

    if (result.error || !result.data) {
      setError(result.error ?? "保存に失敗しました");
      return;
    }

    onCreated(result.data as RecommendedShop);
    setForm({
      name: "",
      category: "natural_food",
      prefecture: "",
      city: "",
      address: "",
      description: "",
      phone: "",
      website: "",
      image_url: null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-end sm:items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">🌟 おすすめの店を追加</h2>
          <button onClick={onClose} className="text-text-mute text-lg w-9 h-9">
            ✕
          </button>
        </div>

        <p className="text-xs text-text-mute bg-accent/5 rounded-lg p-2.5">
          あなたが知ってる自然派のお店を、みんなに教えよう。
        </p>

        <div>
          <label className="text-xs text-text-mute block mb-1">店名</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="例：自然食カフェ◯◯"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-2">カテゴリ</label>
          <div className="grid grid-cols-2 gap-1.5">
            {NATURAL_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm((p) => ({ ...p, category: c.id }))}
                className={`px-2 py-2 rounded-xl text-xs border transition-colors ${
                  form.category === c.id
                    ? "bg-accent text-white border-accent"
                    : "bg-bg border-border hover:bg-bg-card"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-mute block mb-1">都道府県</label>
            <select
              value={form.prefecture}
              onChange={(e) => setForm((p) => ({ ...p, prefecture: e.target.value }))}
              className="w-full bg-bg border border-border rounded-xl px-2 py-2.5 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">選択</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-mute block mb-1">市区町村</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="市区町村"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">番地など</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="1-2-3"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            ひとこと（何が良い？）
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="自然栽培野菜がすごく美味しい、とか"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:border-accent focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-mute block mb-1">電話（任意）</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-mute block mb-1">サイト（任意）</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">写真（任意）</label>
          <ImageUpload
            bucket="rec-shops"
            userId={userId}
            value={form.image_url}
            onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
            placeholder="お店の外観など"
            aspect="wide"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !form.prefecture}
            className="flex-1"
          >
            {submitting ? "位置を確認中..." : "🌟 おすすめ登録"}
          </Button>
        </div>
      </div>
    </div>
  );
}
