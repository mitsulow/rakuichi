"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { AuthButton } from "@/components/auth/AuthButton";
import { EdoIcon, type EdoIconName } from "@/components/ui/EdoIcon";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUnreadNotificationCount } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

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
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const n = await fetchUnreadNotificationCount(user.id);
      if (!cancelled) setUnreadCount(n);
    };
    refresh();
    // Realtime: refresh when notifications table changes for this user
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();
    const interval = setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  // Refresh on route change (e.g. user reads /notifications then navigates away)
  useEffect(() => {
    if (!user) return;
    fetchUnreadNotificationCount(user.id).then(setUnreadCount);
  }, [pathname, user]);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[680px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-2">
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
          <div className="flex items-center gap-1.5">
            <Link
              href="/search"
              className="w-9 h-9 rounded-full hover:bg-bg flex items-center justify-center text-base no-underline transition-colors"
              aria-label="検索"
              title="検索"
            >
              🔍
            </Link>
            {user && (
              <Link
                href="/notifications"
                className="relative w-9 h-9 rounded-full hover:bg-bg flex items-center justify-center text-base no-underline transition-colors"
                aria-label="お知らせ"
                title="お知らせ"
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md"
                    style={{ lineHeight: 1 }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
