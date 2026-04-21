"use client";

import { useEffect, useState } from "react";

/**
 * Detects in-app browsers (LINE / Instagram / Facebook / TikTok etc.)
 * that Google OAuth blocks. Shows a banner telling the user to open in
 * Chrome / Safari instead.
 */
export function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const inApp =
      /Line\//i.test(ua) ||
      /FBAN|FBAV|FB_IAB/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /TikTok/i.test(ua) ||
      /X\/[\d.]+$/i.test(ua) ||
      /Twitter/i.test(ua);
    setIsInApp(inApp);
  }, []);

  if (!isInApp) return null;

  const url =
    typeof window !== "undefined" ? window.location.href : "";

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("URLをコピーしました。Chrome/Safariを開いて貼り付けてください。");
    } catch {
      alert(url);
    }
  };

  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 p-3 text-xs text-amber-900 space-y-2">
      <div className="font-bold flex items-center gap-1">
        ⚠️ アプリ内ブラウザでは Google ログインができません
      </div>
      <p className="leading-relaxed">
        LINE／Instagram／X 等のアプリから開いているため、Googleの仕様でログインがブロックされます。
        <b>Chrome や Safari で開き直してください。</b>
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={copyUrl}
          className="bg-amber-600 text-white px-3 py-1.5 rounded-full font-medium"
        >
          URLをコピー
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-amber-300 text-amber-900 px-3 py-1.5 rounded-full font-medium no-underline"
        >
          外部ブラウザで開く
        </a>
      </div>
    </div>
  );
}
