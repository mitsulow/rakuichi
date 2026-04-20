"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Handle the OAuth callback
    // Supabase may return tokens via hash fragment (implicit) or code via query param (PKCE)
    const handleCallback = async () => {
      try {
        // First, try to get session from URL (handles both hash and query params)
        const { data, error: authError } =
          await supabase.auth.getSession();

        if (authError) {
          console.error("Auth callback error:", authError);
          setError(authError.message);
          return;
        }

        if (data.session) {
          // Session exists, redirect to feed
          router.replace("/feed");
          return;
        }

        // If no session yet, check for code in URL params (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            setError(exchangeError.message);
            return;
          }

          router.replace("/feed");
          return;
        }

        // Check hash fragment for implicit flow
        const hash = window.location.hash;
        if (hash) {
          // Supabase client auto-detects hash tokens via onAuthStateChange
          // Wait a moment for it to process
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            router.replace("/feed");
            return;
          }
        }

        // No code, no hash, no session - something went wrong
        setError("認証情報が見つかりません。もう一度ログインしてください。");
      } catch (err) {
        console.error("Callback error:", err);
        setError("認証処理中にエラーが発生しました。");
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
        <div className="text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <p className="text-sm text-accent">{error}</p>
          <a
            href="/login"
            className="inline-block bg-accent text-white rounded-full px-6 py-2 text-sm"
          >
            ログインに戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-sub">ログイン処理中...</p>
      </div>
    </div>
  );
}
