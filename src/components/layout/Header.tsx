"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { AuthButton } from "@/components/auth/AuthButton";
import { EdoIcon, type EdoIconName } from "@/components/ui/EdoIcon";

const tabs: Array<{ href: string; label: string; icon: EdoIconName | null; emoji?: string }> = [
  { href: "/feed", label: "楽座", icon: "rakuza" },
  { href: "/map", label: "地図", icon: "map" },
  { href: "/posts", label: "情緒", icon: null, emoji: "💭" },
  { href: "/skills", label: "SKILL", icon: null, emoji: "🛠" },
  { href: "/callouts", label: "この指", icon: null, emoji: "🤚" },
  { href: "/rankings", label: "ランキング", icon: null, emoji: "🏮" },
  { href: "/notifications", label: "お知らせ", icon: null, emoji: "🔔" },
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline inline-flex items-center gap-1.5 ${
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-text-sub hover:text-text hover:bg-bg"
                  }`}
                >
                  {tab.icon ? (
                    <EdoIcon name={tab.icon} size={16} />
                  ) : (
                    <span>{tab.emoji}</span>
                  )}
                  {tab.label}
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
