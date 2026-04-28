"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface MiniProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  prefecture: string | null;
  city: string | null;
  life_work: string | null;
  life_work_level: string | null;
  wants_to_do: string[] | null;
  skills: string[] | null;
}

interface AuthContextValue {
  user: User | null;
  profile: MiniProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("rakuichi:cachedUser");
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<MiniProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("rakuichi:cachedProfile");
      return cached ? (JSON.parse(cached) as MiniProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchAndSetProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      try {
        localStorage.removeItem("rakuichi:cachedProfile");
      } catch {}
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, prefecture, city, life_work, life_work_level, wants_to_do, skills"
      )
      .eq("id", u.id)
      .single();
    if (data) {
      const p = data as MiniProfile;
      setProfile(p);
      try {
        localStorage.setItem("rakuichi:cachedProfile", JSON.stringify(p));
      } catch {}
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchAndSetProfile(user);
  }, [user, fetchAndSetProfile]);

  useEffect(() => {
    const supabase = createClient();

    async function apply(u: User | null) {
      setUser(u);
      setLoading(false);
      try {
        if (u) localStorage.setItem("rakuichi:cachedUser", JSON.stringify(u));
        else localStorage.removeItem("rakuichi:cachedUser");
      } catch {}
      await fetchAndSetProfile(u);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      apply(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchAndSetProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
