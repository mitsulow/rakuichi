"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

function WelcomeBannerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("welcome") === "1") {
      setShow(true);
    }
  }, [params]);

  if (!show) return null;

  return (
    <Card className="!p-0 overflow-hidden bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border-2 border-accent/30">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🪧</span>
          <div className="flex-1">
            <h2 className="text-sm font-bold mb-1">マイページが整いました！</h2>
            <p className="text-xs text-text-sub leading-relaxed">
              これで楽座を出したり、情緒を投げたり、
              他の座の民と交流できます。
              <br />
              まずは最初の楽座を出してみよう。
            </p>
          </div>
          <button
            onClick={() => {
              setShow(false);
              router.replace("/feed");
            }}
            className="text-text-mute text-lg -mt-1"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </div>
    </Card>
  );
}

export function WelcomeBanner() {
  return (
    <Suspense fallback={null}>
      <WelcomeBannerInner />
    </Suspense>
  );
}
