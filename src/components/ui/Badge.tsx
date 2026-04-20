import { getBadgeTypeByKey } from "@/lib/utils";
import type { Badge as BadgeType } from "@/lib/types";

interface BadgeProps {
  badge: BadgeType;
  showLabel?: boolean;
}

export function BadgeDisplay({ badge, showLabel = false }: BadgeProps) {
  const badgeInfo = getBadgeTypeByKey(badge.badge_type);
  if (!badgeInfo) return null;

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={badgeInfo.label}
    >
      <span className="text-sm">{badgeInfo.emoji}</span>
      {showLabel && (
        <span className="text-xs text-text-sub">{badgeInfo.label}</span>
      )}
    </span>
  );
}

interface BadgeListProps {
  badges: BadgeType[];
  showLabels?: boolean;
}

export function BadgeList({ badges, showLabels = false }: BadgeListProps) {
  if (!badges.length) return null;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {badges.map((b) => (
        <BadgeDisplay key={b.id} badge={b} showLabel={showLabels} />
      ))}
    </span>
  );
}
