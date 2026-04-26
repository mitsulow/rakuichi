"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rakuichi:install-dismissed-at";
const DISMISS_HOURS = 72; // re-show after 3 days

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const at = window.localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  const elapsed = Date.now() - Number(at);
  return elapsed < DISMISS_HOURS * 60 * 60 * 1000;
}

/**
 * Bottom-attached banner inviting the user to install the PWA.
 * Android/Chrome: triggers native prompt via beforeinstallprompt.
 * iOS Safari: opens an instructional modal (Add to Home Screen).
 */
export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [iosModal, setIosModal] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBefore);

    if (isIOS()) {
      // iOS won't fire beforeinstallprompt — show banner after a short delay
      const t = setTimeout(() => setShow(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBefore);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBefore);
  }, []);

  const dismiss = () => {
    setShow(false);
    setIosModal(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      dismiss();
    } else if (isIOS()) {
      setIosModal(true);
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className="fixed left-3 right-3 bottom-20 md:bottom-4 z-[60] rounded-2xl shadow-lg border-2 px-4 py-3 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          borderColor: "#c94d3a40",
          maxWidth: 420,
          marginInline: "auto",
        }}
      >
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-10 h-10 rounded-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text leading-tight">
            ホーム画面に追加
          </div>
          <div className="text-[11px] text-text-sub mt-0.5 leading-snug">
            アプリみたいに開けて、上のアドレスバーも消えます
          </div>
        </div>
        <button
          onClick={install}
          className="px-3 py-1.5 rounded-full bg-accent text-white text-xs font-bold flex-shrink-0 hover:opacity-90"
        >
          追加
        </button>
        <button
          onClick={dismiss}
          aria-label="閉じる"
          className="text-text-mute text-lg leading-none flex-shrink-0 px-1"
        >
          ✕
        </button>
      </div>

      {iosModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/40 px-3 pb-3"
          onClick={dismiss}
        >
          <div
            className="bg-card rounded-2xl shadow-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/icons/icon-192.png"
                alt=""
                className="w-12 h-12 rounded-xl"
              />
              <div>
                <div className="text-base font-bold">楽市楽座をホーム画面に</div>
                <div className="text-xs text-text-mute">アプリみたいに開けます</div>
              </div>
            </div>
            <ol className="text-sm space-y-2 text-text-sub list-decimal pl-5">
              <li>
                画面下の <span className="inline-block px-1.5 py-0.5 bg-bg rounded border border-border text-xs">⬆ シェア</span> ボタンをタップ
              </li>
              <li>
                「<strong>ホーム画面に追加</strong>」を選ぶ
              </li>
              <li>右上の「追加」をタップ</li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-4 w-full py-2 rounded-full bg-accent text-white text-sm font-bold"
            >
              わかった
            </button>
          </div>
        </div>
      )}
    </>
  );
}
