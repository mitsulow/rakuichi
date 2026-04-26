"use client";

import { useEffect, useState } from "react";

const PHRASE = "踊る阿呆に、見る阿呆。同じ阿呆なら、踊らにゃ損々";

/**
 * 江戸っぽい祭のお囃子フェイク。
 * 30秒ごとに「踊る阿呆に〜」が画面を大きく横切る。タップで即消し。
 */
export function AhouDansu() {
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    // First show after 8 seconds so the page can render first
    const firstTimer = setTimeout(() => setShowing(true), 8000);

    // Then once every 10 minutes — easter egg, not interruption
    const loop = setInterval(() => {
      setShowing(true);
    }, 600000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(loop);
    };
  }, []);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (!showing) return;
    const t = setTimeout(() => setShowing(false), 4000);
    return () => clearTimeout(t);
  }, [showing]);

  if (!showing) return null;

  return (
    <>
      <div
        onClick={() => setShowing(false)}
        className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-auto cursor-pointer"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,77,58,0.25) 0%, rgba(26,20,16,0.55) 70%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        aria-label="タップで閉じる"
      >
        {/* Lanterns */}
        <div
          className="absolute left-[8%] top-[18%] text-5xl"
          style={{ animation: "lantern-sway 2.2s ease-in-out infinite", transformOrigin: "top center" }}
        >
          🏮
        </div>
        <div
          className="absolute right-[10%] top-[14%] text-5xl"
          style={{
            animation: "lantern-sway 2.2s ease-in-out infinite reverse",
            transformOrigin: "top center",
            animationDelay: "0.3s",
          }}
        >
          🏮
        </div>

        {/* The banner */}
        <div
          className="relative px-6 py-8 mx-4 max-w-[92vw] text-center"
          style={{
            animation: "ahou-sweep 5s ease-in-out forwards",
            background:
              "linear-gradient(180deg, #c94d3a 0%, #b33c2b 100%)",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Top notch (nobori tip) */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-6"
            style={{
              background: "#c94d3a",
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
            }}
          />

          <p
            className="text-white font-bold text-xl sm:text-2xl leading-relaxed"
            style={{
              textShadow: "0 2px 6px rgba(0,0,0,0.5)",
              letterSpacing: "0.05em",
              animation: "ahou-float 2.5s ease-in-out infinite",
            }}
          >
            踊る阿呆に、見る阿呆。
            <br />
            同じ阿呆なら、踊らにゃ損々
          </p>

          <div
            className="mt-3 text-xs font-medium"
            style={{ color: "#fde8d0" }}
          >
            🎋 ── 楽市楽座 ── 🎋
          </div>

          {/* bottom fringe */}
          <div className="absolute -bottom-2 left-0 right-0 flex justify-around pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-3"
                style={{
                  background: "#c94d3a",
                  clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Visual hint */}
        <p className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-white/70">
          タップで閉じる
        </p>
      </div>
      <span className="sr-only">{PHRASE}</span>
    </>
  );
}
