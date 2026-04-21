"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface QuickActionsProps {
  isLoggedIn: boolean;
}

export function QuickActions({ isLoggedIn }: QuickActionsProps) {
  if (!isLoggedIn) return null;

  return (
    <Card className="!p-3">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/search"
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-accent/5 hover:bg-accent/10 border border-accent/20 no-underline transition-colors"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-[11px] font-medium text-text">屋台を探す</span>
        </Link>
        <Link
          href="/map"
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-accent/5 hover:bg-accent/10 border border-accent/20 no-underline transition-colors"
        >
          <span className="text-2xl">🌟</span>
          <span className="text-[11px] font-medium text-text">おすすめ店を追加</span>
        </Link>
      </div>
    </Card>
  );
}
