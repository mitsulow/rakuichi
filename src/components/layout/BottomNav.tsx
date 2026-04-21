"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

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

  useEffect(() => {
    if (!user) {
      setMyHref("/login");
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
