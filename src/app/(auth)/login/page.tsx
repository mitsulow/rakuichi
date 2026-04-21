"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";

function LoginInner() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const e = params.get("error");
    if (e) setError(decodeURIComponent(e));
  }, [params]);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      console.error("Login error:", error.message);
      alert(`ログインエラー: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">楽市楽座へようこそ</h1>
          <p className="text-sm text-text-sub">
            AIの時代、自分の腕一本で。
          </p>
          <p className="text-[11px] text-text-mute mt-1">
            日本人総フリーランス化計画
          </p>
        </div>

        {/* Browse without login — primary CTA for first-time visitors */}
        <a
          href="/feed"
          className="block text-sm text-accent font-medium underline"
        >
          👀 まず市場を眺めてみる →
        </a>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 break-all text-left">
            <div className="font-medium mb-1">⚠️ ログインに失敗しました</div>
            <div>{error}</div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 text-sm font-medium hover:shadow-md transition-shadow"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Googleアカウントでログイン
        </button>

        <p className="text-xs text-text-mute">
          ログインすることで、
          <span className="text-text-sub">利用規約</span>と
          <span className="text-text-sub">プライバシーポリシー</span>
          に同意したものとみなされます。
        </p>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-mute">
            MMMメンバーの方は、ログイン後に自動的に有料会員として認識されます。
          </p>
        </div>

        {/* Clear stuck session / cache */}
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            try {
              await supabase.auth.signOut();
            } catch {}
            try {
              sessionStorage.clear();
              localStorage.clear();
            } catch {}
            try {
              // delete all cookies for this origin
              document.cookie.split(";").forEach((c) => {
                const name = c.split("=")[0].trim();
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              });
            } catch {}
            window.location.href = "/login";
          }}
          className="text-[10px] text-text-mute underline"
        >
          うまく行かない時：セッションを強制クリア
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}
