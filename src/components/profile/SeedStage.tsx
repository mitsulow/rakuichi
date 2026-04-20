"use client";

import { getSeedStage, SEED_STAGES } from "@/lib/constants";

interface SeedStageProps {
  count: number;
  showProgress?: boolean;
}

export function SeedStage({ count, showProgress = false }: SeedStageProps) {
  const current = getSeedStage(count);
  const currentIndex = SEED_STAGES.findIndex((s) => s.min === current.min);
  const next = SEED_STAGES[currentIndex + 1];

  const progress = next
    ? Math.min(100, ((count - current.min) / (next.min - current.min)) * 100)
    : 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-lg" aria-label={current.label}>
          {current.emoji}
        </span>
        <span className="font-medium">{current.label}</span>
        <span className="text-xs text-text-mute">（種 {count.toLocaleString()}個）</span>
      </div>

      {showProgress && next && (
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-text-mute whitespace-nowrap">
            {next.emoji} {next.min - count}
          </span>
        </div>
      )}
    </div>
  );
}
