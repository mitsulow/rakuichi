"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LoadingScreenProps {
  page?: string;
  step?: string;
}

/**
 * Shows a spinner + current URL + "stuck? clear and relogin" escape hatch.
 * After 10 seconds of loading, reveals the escape button automatically.
 */
export function LoadingScreen({ page, step }: LoadingScreenProps) {
  const [showEscape, setShowEscape] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.pathname + window.location.search);
    }
    const t = setTimeout(() => setShowEscape(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleEscape = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch {}
    window.location.href = "/feed";
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-text-mute">{step ?? "読み込み中..."}</p>
      <p className="text-[10px] text-text-mute font-mono break-all px-4 text-center">
        {page ?? currentUrl}
      </p>
      {showEscape && (
        <button
          type="button"
          onClick={handleEscape}
          className="text-xs text-accent underline mt-4"
        >
          🔧 セッションをクリアしてログインしなおす
        </button>
      )}
    </div>
  );
}
