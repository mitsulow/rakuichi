"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/data";
import { useAuth } from "@/components/auth/AuthProvider";

const SKIPPED_KEY = "rakuichi:emailConsent:skipped";

/**
 * Modal asking the user for explicit consent to share their email address
 * with other むらびと via the contact button. Shown once per user (until
 * they answer Yes or No). Skipping is saved in localStorage to avoid
 * spamming, and persisted to DB on decision so it works across devices.
 */
export function EmailConsentGate() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // Localstorage skip — quick path
      try {
        if (localStorage.getItem(SKIPPED_KEY) === "yes") return;
      } catch {
        /* storage blocked */
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("email_share_consent")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      // null = not decided yet → show modal
      if (
        !data ||
        (data as { email_share_consent: boolean | null })
          .email_share_consent === null
      ) {
        setShow(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const decide = async (consent: boolean) => {
    if (!user || busy) return;
    setBusy(true);
    await updateProfile(user.id, { email_share_consent: consent });
    try {
      localStorage.setItem(SKIPPED_KEY, "yes");
    } catch {
      /* storage blocked */
    }
    setBusy(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-3 pb-3 md:pb-0">
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
        }}
      >
        <div
          className="text-center py-2.5 px-4 text-white text-sm font-bold tracking-widest"
          style={{
            background:
              "linear-gradient(90deg, #c94d3a 0%, #d4612e 50%, #c94d3a 100%)",
          }}
        >
          📋 楽市楽座へようこそ
        </div>
        <div className="p-5 space-y-3">
          <h2
            className="text-base font-bold leading-snug"
            style={{ color: "#c94d3a" }}
          >
            メールアドレスでの連絡について
          </h2>
          <p className="text-sm text-text-sub leading-relaxed">
            あなたが Google でログインに使ったメールアドレスを、
            他のむらびとが あなたへの連絡手段として
            「名刺」の連絡画面に表示することに了承しますか？
          </p>
          <div
            className="rounded-xl border border-border bg-white/60 p-3 text-[11px] text-text-sub space-y-1"
          >
            <p>
              <strong>了承する場合</strong>：
              他のむらびとがあなたに「メールで連絡」できるようになります。
            </p>
            <p>
              <strong>了承しない場合</strong>：
              メールでの連絡は表示されません（楽市楽座内チャット・LINE QR・
              Instagram DM などの別経路は利用できます）。
            </p>
            <p className="text-text-mute pt-1">
              ※ あとから「設定」でいつでも変更できます。
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 py-2.5 rounded-xl border-2 border-border bg-card text-sm font-bold hover:border-text-mute transition disabled:opacity-50"
            >
              同意しない
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition shadow-sm disabled:opacity-50"
              style={{ background: "#c94d3a" }}
            >
              {busy ? "..." : "了承する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
