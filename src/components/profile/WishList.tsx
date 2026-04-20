import type { Wish } from "@/lib/types";

interface WishListProps {
  wishes: Wish[];
}

export function WishList({ wishes }: WishListProps) {
  if (!wishes.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">欲しいものリスト</h3>
      <div className="flex flex-wrap gap-2">
        {wishes.map((wish) => (
          <span
            key={wish.id}
            className="inline-flex items-center gap-1 bg-accent-soft text-accent rounded-full px-3 py-1.5 text-sm"
            title={wish.note || undefined}
          >
            {wish.item_name}
            {wish.note && (
              <span className="text-accent/60 text-xs">({wish.note})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
