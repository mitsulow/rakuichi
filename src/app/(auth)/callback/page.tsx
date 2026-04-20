"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("ログイン処理中...");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const fullUrl = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    setDebugInfo(`URL: ${fullUrl}\nHash: ${hash}\nSearch: ${search}`);

    // Listen for auth state changes - this catches tokens from URL hash
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session?.user?.email);
      if (event === "SIGNED_IN" && session) {
        setStatus("ログイン成功！リダイレクト中...");
        subscription.unsubscribe();
        router.replace("/feed");
      }
    });

    // Also try manual code exchange for PKCE flow
    const params = new URLSearchParams(search);
    const code = params.get("code");

    if (code) {
      setStatus("認証コードを処理中...");
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error("Exchange error:", error);
          setStatus(`エラー: ${error.message}`);
        } else if (data.session) {
          setStatus("ログイン成功！リダイレクト中...");
          router.replace("/feed");
        }
      });
    }

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/feed");
        } else {
          setStatus("セッションが見つかりません");
        }
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-sub">{status}</p>
        {debugInfo && (
          <pre className="text-[10px] text-text-mute text-left bg-card p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all border border-border">
            {debugInfo}
          </pre>
        )}
        <a
          href="/login"
          className="inline-block text-sm text-accent hover:underline mt-4"
        >
          ログインに戻る
        </a>
      </div>
    </div>
  );
}
