"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

/**
 * Global auth state. Mounted once in the root layout so session is shared
 * across page navigations without re-querying on every mount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to hydrate from localStorage on first render so content matches
  // the user's actual state even before getSession() resolves.
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("rakuichi:cachedUser");
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      try {
        if (u) localStorage.setItem("rakuichi:cachedUser", JSON.stringify(u));
        else localStorage.removeItem("rakuichi:cachedUser");
      } catch {}
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      try {
        if (u) localStorage.setItem("rakuichi:cachedUser", JSON.stringify(u));
        else localStorage.removeItem("rakuichi:cachedUser");
      } catch {}
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
