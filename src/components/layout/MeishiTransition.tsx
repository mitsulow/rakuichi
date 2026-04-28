"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";

interface MeishiTransitionProps {
  /** Where to navigate after the animation finishes. */
  destination: string;
  onClose?: () => void;
}

/**
 * Full-screen "your name card is being presented" transition.
 *
 * Sequence (~5.5s total):
 *   - Fade-in dim backdrop                 (200ms)
 *   - Washi card slides up + fades in      (400ms)
 *   - Card content fades in 1 by 1         (avatar → name → life work → city)
 *   - Full fade-in complete                ~1300ms
 *   - Hold for ~3.0s (read time)           1500 → 4500ms
 *   - Whole thing fades out                (800ms)
 *   - router.push(destination)
 */
export function MeishiTransition({
  destination,
  onClose,
}: MeishiTransitionProps) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  // Fallbacks if profile is still loading
  const displayName =
    profile?.display_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    "むらびと";
  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const lifeWork = profile?.life_work ?? null;
  const wantsToDo = profile?.wants_to_do ?? [];
  const city = [profile?.prefecture, profile?.city].filter(Boolean).join(" ");

  useEffect(() => {
    // Animate through phases — give plenty of time to read
    const t1 = setTimeout(() => setPhase("hold"), 1500);
    const t2 = setTimeout(() => setPhase("out"), 4500);
    const t3 = setTimeout(() => {
      router.push(destination);
      onClose?.();
    }, 5300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [destination, router, onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 cursor-pointer"
      style={{
        background:
          phase === "out"
            ? "rgba(26, 20, 16, 0)"
            : "rgba(26, 20, 16, 0.55)",
        backdropFilter: phase === "out" ? "blur(0)" : "blur(2px)",
        WebkitBackdropFilter: phase === "out" ? "blur(0)" : "blur(2px)",
        transition: "background 800ms ease, backdrop-filter 800ms ease",
      }}
      onClick={() => {
        // Tap to skip
        setPhase("out");
        setTimeout(() => {
          router.push(destination);
          onClose?.();
        }, 400);
      }}
    >
      <div
        className="relative w-full max-w-md aspect-[91/55]"
        style={{
          opacity: phase === "out" ? 0 : 1,
          transform:
            phase === "in"
              ? "translateY(20px) scale(0.92)"
              : "translateY(0) scale(1)",
          transition:
            "opacity 800ms ease, transform 700ms cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Washi card background */}
        <img
          src="/icons/meishi-blank.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
        />
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center gap-4 px-6 py-4">
          <div
            style={{
              opacity: phase === "in" ? 0 : 1,
              transform: phase === "in" ? "scale(0.6)" : "scale(1)",
              transition: "opacity 400ms 200ms ease, transform 600ms 200ms cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <div className="ring-2 ring-white rounded-full">
              <Avatar src={avatarUrl} alt={displayName} size="xl" />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div
              className="text-xl font-bold text-text leading-tight truncate"
              style={{
                fontFamily: "serif",
                opacity: phase === "in" ? 0 : 1,
                transition: "opacity 400ms 450ms ease",
              }}
            >
              {displayName}
            </div>
            {lifeWork && (
              <div
                className="text-sm font-bold leading-tight truncate"
                style={{
                  color: "#c94d3a",
                  opacity: phase === "in" ? 0 : 1,
                  transition: "opacity 400ms 650ms ease",
                }}
              >
                🌱 {lifeWork}
              </div>
            )}
            {wantsToDo.length > 0 && (
              <div
                className="text-[11px] truncate"
                style={{
                  color: "#2b3a67",
                  opacity: phase === "in" ? 0 : 1,
                  transition: "opacity 400ms 800ms ease",
                }}
              >
                やりたい: {wantsToDo.slice(0, 3).join(" / ")}
              </div>
            )}
            {city && (
              <div
                className="text-[11px] text-text-mute truncate"
                style={{
                  opacity: phase === "in" ? 0 : 1,
                  transition: "opacity 400ms 950ms ease",
                }}
              >
                📍 {city}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
