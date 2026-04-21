"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const [status, setStatus] = useState("ログイン処理中...");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let done = false;

    const log = (msg: string) => {
      setDebug((prev) => [...prev, `${new Date().toISOString().slice(14, 19)} ${msg}`]);
    };

    // Error param from Google/Supabase
    const url = new URL(window.location.href);
    const errorParam =
      url.searchParams.get("error_description") ||
      url.searchParams.get("error");
    if (errorParam) {
      setStatus("ログインに失敗しました");
      setDetailError(decodeURIComponent(errorParam));
      return;
    }

    const goToFeed = async () => {
      if (done) return;
      // Double-check session really exists before navigating
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        log("goToFeed called but no session yet");
        return;
      }
      done = true;
      log(`session OK, navigating. user=${session.user.email}`);
      // Short delay to ensure cookies are flushed to document.cookie
      setTimeout(() => {
        window.location.href = "/feed";
      }, 200);
    };

    // 1. Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log(`authEvent=${event} hasSession=${!!session}`);
        if (session) await goToFeed();
      }
    );

    // 2. Immediate session check (maybe already set)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      log(`initial getSession hasSession=${!!session}`);
      if (session) await goToFeed();
    });

    // 3. Try explicit exchange
    const code = url.searchParams.get("code");
    if (code) {
      log(`has code, will exchange in 500ms`);
      setTimeout(async () => {
        if (done) return;
        try {
          log("calling exchangeCodeForSession");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          log(
            error
              ? `exchange error: ${error.message}`
              : `exchange OK: ${data.session?.user?.email ?? "?"}`
          );
          if (data.session) await goToFeed();
        } catch (e) {
          log(`exchange throw: ${e instanceof Error ? e.message : String(e)}`);
        }
      }, 500);
    }

    // 4. Final timeout
    const timeout = setTimeout(() => {
      if (!done) {
        log("timeout 30s reached");
        setStatus("ログインに失敗しました");
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
        {debug.length > 0 && (
          <div className="mt-6 p-2 bg-bg border border-border rounded-lg text-left">
            <div className="text-[9px] text-text-mute mb-1">デバッグ:</div>
            {debug.map((line, i) => (
              <div key={i} className="text-[9px] font-mono text-text-sub break-all">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
