import { Card } from "@/components/ui/Card";
import { CategoryTag } from "@/components/ui/CategoryTag";
import type { Shop } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

interface ShopListProps {
  shops: Shop[];
}

export function ShopList({ shops }: ShopListProps) {
  if (!shops.length) return null;

  // Group by category
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = shops.filter((s) => s.category === cat.id);
      if (items.length > 0) acc.push({ category: cat, items });
      return acc;
    },
    [] as { category: (typeof CATEGORIES)[number]; items: Shop[] }[]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text-sub">売っているもの</h3>
      {grouped.map(({ category, items }) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span>{category.emoji}</span>
            <span className="text-xs font-medium text-text-sub">
              {category.label}
            </span>
          </div>
          {items.map((shop) => (
            <Card key={shop.id} className="!p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{shop.name}</h4>
                  {shop.description && (
                    <p className="text-xs text-text-sub mt-0.5 line-clamp-2">
                      {shop.description}
                    </p>
                  )}
                </div>
                {shop.price_text && (
                  <span className="text-sm font-medium text-accent ml-3 shrink-0">
                    {shop.price_text}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
