"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const staticTabs = [
  { href: "/feed", label: "市場", emoji: "🏪" },
  { href: "/search", label: "屋台", emoji: "🔍" },
  { href: "/map", label: "マップ", emoji: "🗾" },
  { href: "/chat", label: "文", emoji: "💬" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [myHref, setMyHref] = useState<string>("/login");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setMyHref("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      setMyHref(data?.username ? `/u/${data.username}` : "/settings/profile");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session) {
        setMyHref("/login");
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        setMyHref(data?.username ? `/u/${data.username}` : "/settings/profile");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const tabs = [...staticTabs, { href: myHref, label: "MY座", emoji: "🪞" }];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/login" && pathname.startsWith(tab.href + "/"));
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 no-underline transition-colors min-w-[56px] ${
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
