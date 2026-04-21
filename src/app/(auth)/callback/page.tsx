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

    const checkAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !done) {
          done = true;
          router.replace("/feed");
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    // 1. Try explicit code exchange first (PKCE flow)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");

    if (errorParam) {
      setStatus("ログインに失敗しました");
      setDetailError(errorParam);
      return;
    }

    const init = async () => {
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // fallthrough; onAuthStateChange may still fire
        }
      }
      await checkAndRedirect();
    };
    init();

    // 2. Listen for auth state change (some flows set session asynchronously)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        await checkAndRedirect();
      }
    });

    // 3. Poll every 500ms for up to 15 seconds
    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 500;
      const ok = await checkAndRedirect();
      if (ok || elapsed >= 15000) {
        clearInterval(interval);
        if (!ok && !done) {
          setStatus("ログインに失敗しました");
        }
      }
    }, 500);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
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
