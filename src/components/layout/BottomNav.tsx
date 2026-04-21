"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUnreadMessageCount } from "@/lib/data";

const staticTabs = [
  { href: "/feed", label: "楽座", emoji: "🏪" },
  { href: "/map", label: "マップ", emoji: "🗾" },
  { href: "/posts", label: "情緒", emoji: "💭" },
  { href: "/chat", label: "文", emoji: "💬" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [myHref, setMyHref] = useState<string>("/login");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setMyHref("/login");
      setUnreadCount(0);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setMyHref(data?.username ? `/u/${data.username}` : "/settings/profile");
      });
  }, [user]);

  // Poll unread count every 30 seconds + listen to realtime new messages
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function refresh() {
      if (cancelled || !user) return;
      const count = await fetchUnreadMessageCount(user.id);
      if (!cancelled) setUnreadCount(count);
    }
    refresh();

    const interval = setInterval(refresh, 30000);

    // Realtime: new messages arriving
    const supabase = createClient();
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => refresh()
      )
      .subscribe();

    // Refresh whenever route changes (cheap way to re-check after reading a chat)
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
    };
  }, [user]);

  // Also refresh when pathname changes (user navigated away from /chat/[id])
  useEffect(() => {
    if (!user) return;
    fetchUnreadMessageCount(user.id).then(setUnreadCount);
  }, [pathname, user]);

  const tabs = [...staticTabs, { href: myHref, label: "マイページ", emoji: "🪞" }];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/login" && pathname.startsWith(tab.href + "/"));
          const showBadge =
            tab.href === "/chat" && unreadCount > 0 && !!user;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 no-underline transition-colors min-w-[56px] relative ${
                isActive ? "text-accent" : "text-text-mute"
              }`}
            >
              <span className="text-lg relative">
                {tab.emoji}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md"
                    style={{ lineHeight: 1 }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
