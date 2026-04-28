"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchKomeFields } from "@/lib/data";
import { PREFECTURES } from "@/lib/constants";
import { AddKomeFieldModal } from "@/components/kome/AddKomeFieldModal";
import type { KomeField } from "@/lib/types";

const KomeMapView = dynamic(
  () =>
    import("@/components/kome/KomeMapView").then((mod) => mod.KomeMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-bg rounded-2xl animate-pulse" />
    ),
  }
);

export default function KomePage() {
  const { user } = useAuth();
  const [fields, setFields] = useState<KomeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefecture, setPrefecture] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await fetchKomeFields({
      prefecture: prefecture || null,
      status: "open",
      limit: 200,
    });
    setFields(list as KomeField[]);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchKomeFields({
        prefecture: prefecture || null,
        status: "open",
        limit: 200,
      });
      if (!cancelled) {
        setFields(list as KomeField[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefecture]);

  const prefectureCounts = fields.reduce(
    (acc, f) => {
      acc[f.prefecture] = (acc[f.prefecture] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-3 relative">
      {/* Hero */}
      <div
        className="rounded-2xl border-2 px-4 py-3"
        style={{
          borderColor: "#5a7d4a40",
          background:
            "linear-gradient(135deg, #f5e8d5 0%, #e8e6c8 50%, #f5e8d5 100%)",
        }}
      >
        <h1
          className="text-xl font-bold tracking-wide leading-tight"
          style={{ color: "#5a7d4a" }}
        >
          🌾 米 部
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          手伝ってほしい農家 と お米作りをしたい人をつなぐ
          ・ 全国47都道府県
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8"
        >
          <option value="">🗾 全国の田んぼ</option>
          {PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>
              📍 {pref}
              {prefectureCounts[pref]
                ? ` (${prefectureCounts[pref]})`
                : ""}
            </option>
          ))}
        </select>
        <div className="text-[11px] text-text-mute flex items-center justify-end px-1">
          {loading ? "読み込み中..." : `${fields.length}枚 の田んぼ`}
        </div>
      </div>

      {/* Map */}
      <div className="h-[400px] rounded-2xl overflow-hidden border-2 border-border shadow-md">
        <KomeMapView fields={fields} />
      </div>

      {/* CTA — for farmers to register their field */}
      <button
        onClick={() => {
          if (!user) {
            window.location.href = "/login";
            return;
          }
          setShowAdd(true);
        }}
        className="w-full rounded-2xl border-2 px-4 py-3 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
        style={{
          borderColor: "#5a7d4a40",
          background:
            "linear-gradient(135deg, #f5e8d5 0%, #ffffff 50%, #f5e8d5 100%)",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0"
          style={{ background: "#5a7d4a" }}
        >
          🌾
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: "#5a7d4a" }}>
            田んぼを提供する農家さんへ
          </div>
          <div className="text-[11px] text-text-sub mt-0.5">
            あなたの田んぼを米部に登録して、手伝いに来てくれる
            むらびとを募集できます。
          </div>
        </div>
        <span className="text-text-sub flex-shrink-0">＋</span>
      </button>

      {/* List */}
      <div className="pt-2">
        <h2
          className="text-sm font-bold mb-2 px-1"
          style={{ color: "#5a7d4a" }}
        >
          🌾 田んぼ一覧（{fields.length}枚）
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-bg animate-pulse"
              />
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div
            className="text-center py-12 px-6 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: "#5a7d4a40",
              background:
                "linear-gradient(135deg, #f5e8d5 0%, #ffffff 100%)",
            }}
          >
            <p className="text-5xl mb-3">🌾</p>
            <p className="text-sm font-bold" style={{ color: "#5a7d4a" }}>
              この地域にはまだ田んぼがありません
            </p>
            <p className="text-xs text-text-sub mt-1.5">
              {user
                ? "あなたの田んぼを最初に登録してみよう"
                : "登録してあなたの田んぼを募集しよう"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <FieldCard key={f.id} field={f} />
            ))}
          </div>
        )}
      </div>

      {user && showAdd && (
        <AddKomeFieldModal
          isOpen={showAdd}
          userId={user.id}
          onClose={() => setShowAdd(false)}
          onCreated={(field) => {
            setFields((prev) => [field, ...prev]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function FieldCard({ field }: { field: KomeField }) {
  return (
    <Link href={`/kome/${field.id}`} className="no-underline block">
      <div
        className="rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden relative"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "#5a7d4a" }}
        />
        <div className="flex">
          {field.image_urls && field.image_urls.length > 0 ? (
            <img
              src={field.image_urls[0]}
              alt={field.name}
              className="w-24 h-24 object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-24 h-24 flex items-center justify-center text-3xl text-white flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #5a7d4a 0%, #7d9b5d 50%, #5a7d4a 100%)",
              }}
            >
              🌾
            </div>
          )}
          <div className="flex-1 min-w-0 p-3">
            <h3 className="text-sm font-bold leading-snug line-clamp-1">
              {field.name}
            </h3>
            <div className="text-[11px] text-text-mute mt-0.5">
              📍 {field.prefecture}
              {field.city ? ` ${field.city}` : ""}
            </div>
            {field.owner && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Avatar
                  src={field.owner.avatar_url}
                  alt={field.owner.display_name}
                  size="xs"
                />
                <span className="text-[11px] text-text-sub truncate">
                  {field.owner.display_name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-text-sub">
                🤝 MY農家 {field.helper_count ?? 0} 人
                {field.max_helpers ? ` / ${field.max_helpers}` : ""}
              </span>
              <span
                className="text-[11px] font-bold"
                style={{ color: "#5a7d4a" }}
              >
                詳細 →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
