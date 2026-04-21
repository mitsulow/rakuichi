"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 *
 * Uses BOTH localStorage and cookies for session persistence — maximally
 * robust across mobile browsers that have quirky cookie behavior.
 */
export function createClient() {
  // Custom storage that mirrors to localStorage AND cookies.
  // Cookies keep middleware working for server-side refresh;
  // localStorage keeps the client session reliable even if cookies are
  // dropped by mobile browsers on reload.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Explicit attributes so mobile browsers persist cookies across reloads
        maxAge: 60 * 60 * 24 * 400, // 400 days
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
      },
    }
  );
}
