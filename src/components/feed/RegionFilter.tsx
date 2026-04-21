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
  return REGIONS.flatMap((r) => [...r.prefectures]);
}

export function scopeLabel(scope: RegionScope): string {
  if (scope.kind === "world") return "🌍 全世界";
  if (scope.kind === "japan") return "🗾 日本全体";
  if (scope.kind === "mine") return `📍 自分の県（${scope.prefecture}）`;
  const r = REGIONS.find((x) => x.id === scope.id);
  return r?.label ?? "地方";
}

interface RegionFilterProps {
  scope: RegionScope;
  onChange: (scope: RegionScope) => void;
  userPrefecture?: string | null;
}

/**
 * Serialize/deserialize scope as a single string for <select> value.
 */
function scopeValue(scope: RegionScope): string {
  if (scope.kind === "world") return "world";
  if (scope.kind === "japan") return "japan";
  if (scope.kind === "mine") return "mine";
  return `region:${scope.id}`;
}
function valueToScope(value: string, userPref: string | null): RegionScope {
  if (value === "world") return { kind: "world" };
  if (value === "japan") return { kind: "japan" };
  if (value === "mine" && userPref)
    return { kind: "mine", prefecture: userPref };
  if (value.startsWith("region:"))
    return { kind: "region", id: value.slice(7) };
  return { kind: "world" };
}

export function RegionFilter({
  scope,
  onChange,
  userPrefecture,
}: RegionFilterProps) {
  return (
    <select
      value={scopeValue(scope)}
      onChange={(e) => onChange(valueToScope(e.target.value, userPrefecture ?? null))}
      className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none appearance-none pr-8 bg-no-repeat bg-right"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
      }}
    >
      <option value="world">🌍 全世界</option>
      <option value="japan">🗾 日本全体</option>
      {userPrefecture && (
        <option value="mine">📍 自分の県（{userPrefecture}）</option>
      )}
      <optgroup label="地方で絞る">
        {REGIONS.map((r) => (
          <option key={r.id} value={`region:${r.id}`}>
            {r.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
