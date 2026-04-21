import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 *
 * We pass explicit auth options so session storage works reliably on all
 * devices (esp. mobile Chrome / Safari): session persisted in cookies,
 * auto-refresh tokens, PKCE flow.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}
