"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { AuthButton } from "@/components/auth/AuthButton";

const tabs = [
  { href: "/feed", label: "屋台", emoji: "🏪" },
  { href: "/map", label: "マップ", emoji: "🗾" },
  { href: "/posts", label: "情緒", emoji: "💭" },
  { href: "/rankings", label: "ランキング", emoji: "🏮" },
  { href: "/notifications", label: "お知らせ", emoji: "🔔" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[680px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-text-sub hover:text-text hover:bg-bg"
                  }`}
                >
                  {tab.emoji} {tab.label}
                </Link>
              );
            })}
          </nav>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
