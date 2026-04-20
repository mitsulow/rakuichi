import { getCategoryByKey } from "@/lib/utils";

interface CategoryTagProps {
  categoryId: string;
  size?: "sm" | "md";
}

export function CategoryTag({ categoryId, size = "md" }: CategoryTagProps) {
  const cat = getCategoryByKey(categoryId);
  if (!cat) return null;

  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 bg-bg rounded-full px-2.5 py-1 border border-border ${textSize}`}
    >
      <span>{cat.emoji}</span>
      <span className="text-text-sub">{cat.label}</span>
    </span>
  );
}
