"use client";

import { getMigrationLabel } from "@/lib/constants";

interface MigrationBarProps {
  percent: number;
  riceWork?: string | null;
  lifeWork?: string | null;
  editable?: boolean;
  onChange?: (percent: number) => void;
  compact?: boolean;
}

export function MigrationBar({
  percent,
  riceWork,
  lifeWork,
  editable = false,
  onChange,
  compact = false,
}: MigrationBarProps) {
  const label = getMigrationLabel(percent);
  const riceLabel = riceWork || "ライスワーク";
  const lifeLabel = lifeWork || "ライフワーク";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {!compact && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-sub font-medium">{label}</span>
          <span className="text-accent font-bold">{percent}%</span>
        </div>
      )}

      {/* Bar */}
      <div className="relative">
        <div className="flex items-center gap-0 h-7 rounded-full overflow-hidden bg-bg border border-border">
          <div
            className="h-full bg-gradient-to-r from-zinc-300 to-zinc-200 transition-all duration-500"
            style={{ width: `${100 - percent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {editable && (
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent}
            onChange={(e) => onChange?.(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="移行度"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-mute">🍚 {riceLabel}</span>
        {compact && (
          <span className="text-accent font-medium">{percent}%</span>
        )}
        <span className="text-text-mute">🌾 {lifeLabel}</span>
      </div>
    </div>
  );
}
