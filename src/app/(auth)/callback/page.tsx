"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("ログイン処理中...");
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let done = false;

    // If the URL contains an explicit error from Google/Supabase, show it
    const url = new URL(window.location.href);
    const errorParam =
      url.searchParams.get("error_description") ||
      url.searchParams.get("error");
    if (errorParam) {
      setStatus("ログインに失敗しました");
      setDetailError(decodeURIComponent(errorParam));
    }

    const goToFeed = () => {
      if (done) return;
      done = true;
      // Full-page navigation rather than SPA replace so the server gets the
      // new cookies and middleware re-reads them.
      window.location.replace("/feed");
    };

    // 1. Listen for session established
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goToFeed();
    });

    // 2. Immediate check (may already be set if SDK processed URL on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goToFeed();
    });

    // 3. Fallback: after a bit, try an explicit code exchange
    const code = url.searchParams.get("code");
    if (code) {
      // Give the SDK a moment to auto-process first
      setTimeout(async () => {
        if (done) return;
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // ignore; we may still get session from listener
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session) goToFeed();
      }, 800);
    }

    // 4. Final timeout — 25s to allow slow networks on mobile
    const timeout = setTimeout(() => {
      if (!done) setStatus("ログインに失敗しました");
    }, 25000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-sub">{status}</p>
        {detailError && (
          <p className="text-xs text-red-500 break-all">{detailError}</p>
        )}
        {status.includes("失敗") && (
          <a href="/login" className="text-xs text-accent underline block">
            もう一度ログインする
          </a>
        )}
      </div>
    </div>
  );
}
