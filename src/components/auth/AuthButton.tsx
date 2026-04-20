"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@supabase/supabase-js";

interface ProfileMini {
  username: string;
  avatar_url: string | null;
  display_name: string;
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileMini | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(u: User | null) {
      if (!u) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, display_name")
        .eq("id", u.id)
        .single();
      setProfile((data as ProfileMini) ?? null);
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
      if (_event === "SIGNED_IN") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = () => setMenuOpen(false);
    const timer = setTimeout(() => {
      window.addEventListener("click", onClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", onClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-bg animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm text-accent font-medium no-underline hover:underline px-3 py-2"
      >
        ログイン
      </Link>
    );
  }

  const avatarUrl =
    profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const name =
    profile?.display_name || user.user_metadata?.full_name || "ユーザー";
  const myzaHref = profile?.username ? `/u/${profile.username}` : "/settings/profile";

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="block w-10 h-10 rounded-full hover:ring-2 hover:ring-accent/20 transition-all"
        aria-label="メニュー"
      >
        <Avatar src={avatarUrl} alt={name} size="sm" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[180px] z-50">
          <Link
            href={myzaHref}
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-text hover:bg-bg no-underline"
          >
            🪞 MY座を見る
          </Link>
          <Link
            href="/settings/profile"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-text hover:bg-bg no-underline"
          >
            ✏️ プロフィール編集
          </Link>
          <Link
            href="/settings/shops"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-text hover:bg-bg no-underline"
          >
            🏪 MY屋台
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-bg"
          >
            🚪 ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
