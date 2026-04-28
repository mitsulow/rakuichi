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
 * Vertical washi business card. Sequence (~7.6s total):
 *   - Fade-in dim backdrop                 (200ms)
 *   - Card slides up + fades in            (700ms)
 *   - Content cascades in 1 by 1           (~1000ms)
 *   - Hold ~5.0s for reading
 *   - Whole thing fades out                (900ms)
 *   - router.push(destination)
 */
export function MeishiTransition({
  destination,
  onClose,
}: MeishiTransitionProps) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    "むらびと";
  const username = profile?.username ?? null;
  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const lifeWork = profile?.life_work ?? null;
  const lifeWorkLevel = profile?.life_work_level ?? null;
  const wantsToDo = profile?.wants_to_do ?? [];
  const skills = profile?.skills ?? [];
  const city = [profile?.prefecture, profile?.city].filter(Boolean).join(" ");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 1700);
    const t2 = setTimeout(() => setPhase("out"), 6700);
    const t3 = setTimeout(() => {
      router.push(destination);
      onClose?.();
    }, 7600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [destination, router, onClose]);

  // Stagger config for content
  const fadeFor = (delay: number) => ({
    opacity: phase === "in" ? 0 : 1,
    transition: `opacity 500ms ${delay}ms ease`,
  });

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6 cursor-pointer overflow-y-auto"
      style={{
        background:
          phase === "out"
            ? "rgba(26, 20, 16, 0)"
            : "rgba(26, 20, 16, 0.6)",
        backdropFilter: phase === "out" ? "blur(0)" : "blur(3px)",
        WebkitBackdropFilter: phase === "out" ? "blur(0)" : "blur(3px)",
        transition: "background 900ms ease, backdrop-filter 900ms ease",
      }}
      onClick={() => {
        // Tap to skip
        setPhase("out");
        setTimeout(() => {
          router.push(destination);
          onClose?.();
        }, 500);
      }}
    >
      <div
        className="relative w-full max-w-[300px] aspect-[55/91]"
        style={{
          opacity: phase === "out" ? 0 : 1,
          transform:
            phase === "in"
              ? "translateY(40px) scale(0.88)"
              : "translateY(0) scale(1)",
          transition:
            "opacity 700ms ease, transform 900ms cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Washi card background */}
        <img
          src="/icons/meishi-blank-vertical.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
        />

        {/* Content overlay — vertical layout inside the red border */}
        <div className="absolute inset-0 flex flex-col items-center text-center px-7 py-9">
          {/* Avatar */}
          <div style={fadeFor(200)}>
            <div className="ring-2 ring-white rounded-full">
              <Avatar src={avatarUrl} alt={displayName} size="lg" />
            </div>
          </div>

          {/* Name + username */}
          <div className="mt-2.5" style={fadeFor(450)}>
            <div
              className="text-base font-bold text-text leading-tight"
              style={{ fontFamily: "serif" }}
            >
              {displayName}
            </div>
            {username && (
              <div className="text-[10px] text-text-mute mt-0.5">
                @{username}
              </div>
            )}
            {lifeWorkLevel && (
              <div
                className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "#c94d3a",
                  color: "white",
                }}
              >
                {lifeWorkLevel}
              </div>
            )}
          </div>

          {/* Decorative line */}
          <div
            className="my-3 w-12 h-px"
            style={{ background: "#c94d3a40" }}
          />

          {/* Life work */}
          {lifeWork && (
            <div className="mb-2.5 px-2" style={fadeFor(700)}>
              <div className="text-[8px] tracking-widest text-text-mute mb-0.5">
                ライフワーク
              </div>
              <div
                className="text-sm font-bold leading-snug"
                style={{ color: "#c94d3a" }}
              >
                🌱 {lifeWork}
              </div>
            </div>
          )}

          {/* Skills (やれること) */}
          {skills.length > 0 && (
            <div className="mb-2 px-2 w-full" style={fadeFor(900)}>
              <div className="text-[8px] tracking-widest text-text-mute mb-1">
                🛠 やれること
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {skills.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
                    style={{
                      background: "#c94d3a15",
                      color: "#c94d3a",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wants to do (やりたいこと) */}
          {wantsToDo.length > 0 && (
            <div className="mb-2 px-2 w-full" style={fadeFor(1100)}>
              <div className="text-[8px] tracking-widest text-text-mute mb-1">
                ✨ やりたいこと
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {wantsToDo.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
                    style={{
                      background: "#2b3a6715",
                      color: "#2b3a67",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Spacer to push city to bottom */}
          <div className="flex-1" />

          {/* City */}
          {city && (
            <div style={fadeFor(1300)}>
              <div className="text-[8px] tracking-widest text-text-mute">
                住んでいる場所
              </div>
              <div className="text-[11px] font-medium text-text-sub mt-0.5">
                📍 {city}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
