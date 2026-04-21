import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * 楽市楽座 — each of the four characters rendered as a distinct shape:
 *   楽 (1st) = 丸（円）
 *   市     = 三角（上向き）
 *   楽 (2nd) = 四角（角丸）
 *   座     = 六角形
 * Colors rotate through the brand palette for rhythm.
 */
export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const cell = size === "sm" ? 26 : size === "lg" ? 44 : 32;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 22 : 16;
  const gap = size === "sm" ? 1 : 2;

  return (
    <Link
      href="/feed"
      className="no-underline inline-flex items-center select-none"
      aria-label="楽市楽座 ── 日本人総フリーランス化計画"
      style={{ gap }}
    >
      {/* 楽 — 丸 (vermilion) */}
      <span
        className="inline-flex items-center justify-center font-bold text-white"
        style={{
          width: cell,
          height: cell,
          fontSize,
          background: "#c94d3a",
          borderRadius: "50%",
        }}
      >
        楽
      </span>

      {/* 市 — 三角 (gold/sun) */}
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: cell, height: cell }}
      >
        <svg
          width={cell}
          height={cell}
          viewBox="0 0 40 40"
          className="absolute inset-0"
          aria-hidden
        >
          <polygon points="20,3 37,36 3,36" fill="#d4a043" />
        </svg>
        <span
          className="relative font-bold text-white"
          style={{ fontSize: fontSize - 2, marginTop: cell * 0.12 }}
        >
          市
        </span>
      </span>

      {/* 楽 — 角丸四角 (deep indigo) */}
      <span
        className="inline-flex items-center justify-center font-bold text-white"
        style={{
          width: cell,
          height: cell,
          fontSize,
          background: "#2b3a67",
          borderRadius: cell * 0.2,
        }}
      >
        楽
      </span>

      {/* 座 — 六角形 (sage green) */}
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: cell, height: cell }}
      >
        <svg
          width={cell}
          height={cell}
          viewBox="0 0 40 40"
          className="absolute inset-0"
          aria-hidden
        >
          <polygon
            points="20,3 36,12 36,28 20,37 4,28 4,12"
            fill="#5a7d4a"
          />
        </svg>
        <span
          className="relative font-bold text-white"
          style={{ fontSize: fontSize - 1 }}
        >
          座
        </span>
      </span>

      {/* Tagline — 日本人総フリーランス化計画 (never wraps) */}
      {showTagline && (
        <span
          className="font-semibold whitespace-nowrap"
          style={{
            fontSize: size === "sm" ? 10 : 12,
            marginLeft: 7,
            letterSpacing: "-0.03em",
            color: "#c94d3a",
          }}
        >
          日本人総フリーランス化計画
        </span>
      )}
    </Link>
  );
}
