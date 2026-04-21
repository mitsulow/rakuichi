"use client";

import { REGIONS } from "@/lib/constants";

export type RegionScope =
  | { kind: "world" }
  | { kind: "japan" }
  | { kind: "mine"; prefecture: string }
  | { kind: "region"; id: string };

export function regionToPrefectures(
  scope: RegionScope
): string[] | null {
  if (scope.kind === "world") return null; // no filter
  if (scope.kind === "mine") return [scope.prefecture];
  if (scope.kind === "region") {
    const r = REGIONS.find((x) => x.id === scope.id);
    return r ? [...r.prefectures] : null;
  }
  // japan: all prefectures listed in REGIONS (anyone with a pref = in Japan)
  return REGIONS.flatMap((r) => [...r.prefectures]);
}

export function scopeLabel(scope: RegionScope): string {
  if (scope.kind === "world") return "🌍 全世界";
  if (scope.kind === "japan") return "🗾 日本全体";
  if (scope.kind === "mine") return `📍 自分の県（${scope.prefecture}）`;
  const r = REGIONS.find((x) => x.id === scope.id);
  return `${r?.label ?? "地方"}`;
}

interface RegionFilterProps {
  scope: RegionScope;
  onChange: (scope: RegionScope) => void;
  userPrefecture?: string | null;
}

export function RegionFilter({
  scope,
  onChange,
  userPrefecture,
}: RegionFilterProps) {
  const isActive = (test: (s: RegionScope) => boolean) => test(scope);

  const pill = (active: boolean, extra = "") =>
    `flex-shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
      active
        ? "bg-accent text-white"
        : "bg-card text-text-sub border border-border hover:bg-bg"
    } ${extra}`;

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
      {userPrefecture && (
        <button
          onClick={() => onChange({ kind: "mine", prefecture: userPrefecture })}
          className={pill(isActive((s) => s.kind === "mine"), "font-bold")}
        >
          📍 自分の県
        </button>
      )}
      <button
        onClick={() => onChange({ kind: "japan" })}
        className={pill(isActive((s) => s.kind === "japan"))}
      >
        🗾 日本全体
      </button>
      <button
        onClick={() => onChange({ kind: "world" })}
        className={pill(isActive((s) => s.kind === "world"))}
      >
        🌍 全世界
      </button>
      {REGIONS.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange({ kind: "region", id: r.id })}
          className={pill(
            isActive((s) => s.kind === "region" && s.id === r.id)
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
