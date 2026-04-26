import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * Inline SVG so the emblem inherits the same #c94d3a as the text exactly.
 * Torii inside a circle, with a young sprout (二葉) on top.
 */
function LogoEmblem({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="42" strokeWidth="4.5" />
      {/* Sprout — stem + two leaves */}
      <line x1="50" y1="20" x2="50" y2="32" strokeWidth="2.6" />
      <ellipse
        cx="44"
        cy="20"
        rx="5.5"
        ry="3"
        fill="currentColor"
        stroke="none"
        transform="rotate(-30 44 20)"
      />
      <ellipse
        cx="56"
        cy="20"
        rx="5.5"
        ry="3"
        fill="currentColor"
        stroke="none"
        transform="rotate(30 56 20)"
      />
      {/* Torii: top beam (kasagi) */}
      <line x1="20" y1="38" x2="80" y2="38" strokeWidth="7" />
      {/* Through-beam (nuki) */}
      <line x1="28" y1="50" x2="72" y2="50" strokeWidth="4" />
      {/* Pillars (slight outward flare) */}
      <line x1="34" y1="38" x2="32" y2="80" strokeWidth="5.5" />
      <line x1="66" y1="38" x2="68" y2="80" strokeWidth="5.5" />
    </svg>
  );
}

/**
 * Layout: [emblem] 楽市楽座  日本人総フリーランス化計画
 * All on one row, all the same #c94d3a so the brand reads as one unit.
 */
export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const emblem = size === "sm" ? 30 : size === "lg" ? 52 : 40;
  const title = size === "sm" ? 17 : size === "lg" ? 28 : 22;
  const tagline = size === "sm" ? 9 : size === "lg" ? 12 : 10;

  return (
    <Link
      href="/feed"
      className="no-underline inline-flex items-center select-none"
      style={{ color: "#c94d3a", gap: 8 }}
      aria-label="楽市楽座 ── 日本人総フリーランス化計画"
    >
      <LogoEmblem size={emblem} />
      <span
        className="font-bold whitespace-nowrap"
        style={{ fontSize: title, letterSpacing: "0.06em", lineHeight: 1 }}
      >
        楽市楽座
      </span>
      {showTagline && (
        <span
          className="font-semibold whitespace-nowrap"
          style={{
            fontSize: tagline,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginLeft: 2,
            opacity: 0.85,
          }}
        >
          日本人総フリーランス化計画
        </span>
      )}
    </Link>
  );
}
