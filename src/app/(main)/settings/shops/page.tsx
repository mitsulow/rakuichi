"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fetchShopsByOwner,
  createShop,
  updateShop,
  deleteShop,
} from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import {
  CATEGORIES,
  DELIVERY_METHODS,
  getSubcategoriesFor,
} from "@/lib/constants";
import { getCached, setCached } from "@/lib/cache";
import type { Shop } from "@/lib/types";

type Mode = "list" | "create" | "edit";

export default function ShopsSettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>(() => {
    if (typeof window === "undefined") return [];
    return getCached<Shop[]>("myShops") ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !getCached<Shop[]>("myShops");
  });
  const [mode, setMode] = useState<Mode>("list");
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          router.replace("/login");
          return;
        }
        setUserId(session.user.id);

        const s = await Promise.race([
          fetchShopsByOwner(session.user.id),
          new Promise<Shop[]>((resolve) =>
            setTimeout(() => resolve([]), 6000)
          ),
        ]);
        if (cancelled) return;
        setShops(s as Shop[]);
        setCached("myShops", s);
      } catch (e) {
        console.error("Shops init error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [router]);

  const refresh = async () => {
    if (!userId) return;
    const s = await fetchShopsByOwner(userId);
    setShops(s as Shop[]);
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm("この楽座を閉じますか？")) return;
    await deleteShop(shopId);
    await refresh();
  };

  if (loading) {
    return <LoadingScreen step="MY楽座を読み込み中..." />;
  }

  if (mode === "create" || (mode === "edit" && editingShop)) {
    return (
      <ShopForm
        initial={mode === "edit" ? editingShop : null}
        userId={userId!}
        onCancel={() => {
          setMode("list");
          setEditingShop(null);
        }}
        onSaved={async () => {
          await refresh();
          setMode("list");
          setEditingShop(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-1"
        >
          ←
        </button>
        <h1 className="text-lg font-bold flex-1">🏪 MY楽座</h1>
        <Button variant="primary" size="sm" onClick={() => setMode("create")}>
          + 新しく出す
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-sm text-text-sub mb-1">まだ楽座を出していません</p>
            <p className="text-xs text-text-mute mb-4">
              値段をつける自信がなくても大丈夫。
              <br />
              「お試し出品」で気軽に始めよう
            </p>
            <Button variant="primary" size="md" onClick={() => setMode("create")}>
              🌱 お試しで1つ出してみる
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <div className="flex items-start gap-2">
                {shop.image_urls && shop.image_urls.length > 0 ? (
                  <img
                    src={shop.image_urls[0]}
                    alt={shop.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <CategoryTag categoryId={shop.category} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">{shop.name}</span>
                    {shop.is_trial && (
                      <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                        お試し
                      </span>
                    )}
                  </div>
                  {shop.description && (
                    <p className="text-xs text-text-mute line-clamp-2 mt-0.5">
                      {shop.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    {shop.is_trial ? (
                      <span className="text-accent">0円〜</span>
                    ) : shop.price_jpy != null ? (
                      <span className="text-accent font-medium">
                        ¥{shop.price_jpy.toLocaleString()}
                      </span>
                    ) : shop.price_text ? (
                      <span className="text-accent">{shop.price_text}</span>
                    ) : (
                      <span className="text-text-mute">価格未設定</span>
                    )}
                    {shop.accepts_barter && (
                      <span className="text-text-mute" title="物々交換可">🔄</span>
                    )}
                    {shop.accepts_tip && (
                      <span className="text-text-mute" title="投げ銭可">🪙</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingShop(shop);
                      setMode("edit");
                    }}
                    className="text-xs text-text-sub hover:text-accent p-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="text-xs text-text-sub hover:text-red-500 p-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Shop create/edit form
// ============================================================

interface ShopFormProps {
  initial: Shop | null;
  userId: string;
  onCancel: () => void;
  onSaved: () => void;
}

function ShopForm({ initial, userId, onCancel, onSaved }: ShopFormProps) {
  const [saving, setSaving] = useState(false);
  // Editing existing? auto-open advanced. New? hide advanced for the 3-tap flow.
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initial));
  const [form, setForm] = useState({
    category: initial?.category ?? "craft",
    subcategory: initial?.subcategory ?? null,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    is_trial: initial?.is_trial ?? !initial,
    price_jpy: initial?.price_jpy?.toString() ?? "",
    accepts_barter: initial?.accepts_barter ?? true,
    accepts_tip: initial?.accepts_tip ?? false,
    delivery_methods: initial?.delivery_methods ?? [],
    image_urls: initial?.image_urls ?? [],
  });

  const availableSubcategories = getSubcategoriesFor(
    form.category as (typeof CATEGORIES)[number]["id"]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || saving) return;

    setSaving(true);
    const payload = {
      category: form.category,
      subcategory: form.subcategory,
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_trial: form.is_trial,
      price_jpy: form.is_trial ? null : form.price_jpy ? parseInt(form.price_jpy) : null,
      accepts_barter: form.accepts_barter,
      accepts_tip: form.accepts_tip,
      delivery_methods: form.delivery_methods,
      image_urls: form.image_urls,
    };

    const result = initial
      ? await updateShop(initial.id, payload)
      : await createShop(userId, payload);

    setSaving(false);

    if (result.error) {
      alert(`保存に失敗: ${result.error}`);
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-1"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">
          {initial ? "✏️ 楽座を編集" : "🏪 新しい楽座を出す"}
        </h1>
      </div>

      {!initial && (
        <div
          className="rounded-xl border border-accent/30 px-3 py-2 text-[11px] text-text-sub"
          style={{
            background:
              "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          🌱 3タップで出せます: <strong>ジャンル → 名前 → 出す</strong>。
          値段や物々交換は「詳しく設定」で後から付けてもOK。
        </div>
      )}

      {/* 1. Category */}
      <Card>
        <div className="space-y-2">
          <label className="text-xs text-text-mute block">
            <span className="font-bold text-text-sub">1.</span> ジャンル
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    category: c.id,
                    subcategory: null, // reset when parent changes
                  }))
                }
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

          {/* Subcategory — only shown if the parent has any */}
          {availableSubcategories.length > 0 && (
            <div className="pt-2">
              <label className="text-[11px] text-text-mute block mb-1.5">
                細かいジャンル（任意）
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, subcategory: null }))}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                    form.subcategory === null
                      ? "bg-text-sub text-white border-text-sub"
                      : "bg-card border-border hover:border-accent"
                  }`}
                >
                  指定しない
                </button>
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, subcategory: sub.id }))
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      form.subcategory === sub.id
                        ? "bg-accent text-white border-accent"
                        : "bg-card border-border hover:border-accent"
                    }`}
                    title={sub.description}
                  >
                    {sub.emoji} {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Name (essential, always visible) */}
      <Card>
        <div>
          <label className="text-xs text-text-mute block mb-1">
            <span className="font-bold text-text-sub">2.</span> 楽座の名前
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="例：陶芸体験60分／自家製味噌"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
            required
          />
        </div>
      </Card>

      {/* 3. Photo (optional) */}
      <Card>
        <div className="space-y-2">
          <label className="text-xs text-text-mute block">
            <span className="font-bold text-text-sub">3.</span> 写真（任意・最大4枚）
          </label>
          <ImageUpload
            bucket="shop-images"
            userId={userId}
            values={form.image_urls}
            onChangeMany={(urls) => setForm((p) => ({ ...p, image_urls: urls }))}
            multiple
            maxCount={4}
            placeholder="写真を追加"
            aspect="square"
          />
        </div>
      </Card>

      {/* Advanced settings — collapsed by default for new shops */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-xs text-text-sub hover:text-accent py-2 border-t border-dashed border-border"
      >
        {showAdvanced ? "▲ 詳しい設定を閉じる" : "▼ 詳しく設定する（説明文・価格・物々交換など）"}
      </button>

      {showAdvanced && (
        <>
          {/* Description */}
          <Card>
            <div>
              <label className="text-xs text-text-mute block mb-1">
                内容・想い
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                placeholder="どんなサービス？どんな想いでやってる？"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
              />
            </div>
          </Card>

          {/* Pricing mode */}
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-text-sub">受け取り方</h3>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors border-accent/40 bg-accent/5">
                <input
                  type="radio"
                  name="mode"
                  checked={form.is_trial}
                  onChange={() => setForm((p) => ({ ...p, is_trial: true }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">🌱 お試し出品（0円〜）</div>
                  <div className="text-xs text-text-mute mt-0.5">
                    値段をつける自信がない人はこっち。物々交換や投げ銭で受け取れる。
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors border-border bg-bg">
                <input
                  type="radio"
                  name="mode"
                  checked={!form.is_trial}
                  onChange={() => setForm((p) => ({ ...p, is_trial: false }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">💴 価格を設定する</div>
                  <div className="text-xs text-text-mute mt-0.5">
                    日本円で価格を決めて出品
                  </div>
                  {!form.is_trial && (
                    <div className="mt-2">
                      <input
                        type="number"
                        value={form.price_jpy}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, price_jpy: e.target.value }))
                        }
                        placeholder="3000"
                        min="0"
                        className="w-32 bg-bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
                      />
                      <span className="text-sm text-text-sub ml-2">円</span>
                    </div>
                  )}
                </div>
              </label>

              <div className="pt-2 border-t border-border space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepts_barter}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        accepts_barter: e.target.checked,
                      }))
                    }
                  />
                  <span>🔄 物々交換も受ける</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepts_tip}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, accepts_tip: e.target.checked }))
                    }
                  />
                  <span>🪙 投げ銭（気持ち）も受ける</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Delivery methods — multi-select */}
          <Card>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-text-sub">
                📦 受け渡しの方法
              </h3>
              <p className="text-[11px] text-text-mute">
                どの方法で渡せるか（複数選択可）。発送できる範囲が広いほど、遠くの人とも交換できる。
              </p>
              <div className="space-y-1.5 pt-1">
                {DELIVERY_METHODS.map((d) => {
                  const checked = form.delivery_methods.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? "border-accent bg-accent/5"
                          : "border-border bg-bg hover:border-accent/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            delivery_methods: e.target.checked
                              ? [...p.delivery_methods, d.id]
                              : p.delivery_methods.filter((m) => m !== d.id),
                          }))
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {d.emoji} {d.label}
                        </div>
                        <div className="text-[11px] text-text-mute mt-0.5">
                          {d.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 sticky bottom-20 md:static z-10">
        <Button
          variant="ghost"
          size="md"
          type="button"
          onClick={onCancel}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={!form.name.trim() || saving}
          className="flex-1 shadow-lg"
        >
          {saving
            ? "出店中..."
            : initial
            ? "保存する"
            : form.is_trial
            ? "🌱 お試しで出す"
            : "🏪 楽座を出す"}
        </Button>
      </div>
    </form>
  );
}
