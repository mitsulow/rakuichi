"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/feed", label: "市場", emoji: "🏪" },
  { href: "/search", label: "探す", emoji: "🔍" },
  { href: "/map", label: "マップ", emoji: "🗾" },
  { href: "/chat", label: "チャット", emoji: "💬" },
  { href: "/u/mitsuro", label: "My座", emoji: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 no-underline transition-colors ${
                isActive ? "text-accent" : "text-text-mute"
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
