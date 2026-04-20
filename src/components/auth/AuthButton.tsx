"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-bg animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm text-accent font-medium no-underline hover:underline"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="relative group">
      <Link href="/settings/profile" className="block">
        <Avatar
          src={user.user_metadata?.avatar_url || null}
          alt={user.user_metadata?.full_name || "ユーザー"}
          size="sm"
        />
      </Link>
      {/* Dropdown on hover */}
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-card border border-border rounded-xl shadow-lg py-2 min-w-[140px] z-50">
        <Link
          href="/settings/profile"
          className="block px-4 py-2 text-sm text-text hover:bg-bg no-underline"
        >
          プロフィール編集
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-sm text-accent hover:bg-bg"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
