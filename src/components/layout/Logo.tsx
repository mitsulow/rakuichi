import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * 楽市楽座 logo: torii+sprout emblem (vermilion seal) on the left,
 * "楽市楽座" wordmark on the right with the "日本人総フリーランス化計画"
 * tagline beneath. Sizes scale together so the lockup stays balanced.
 */
export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const emblem = size === "sm" ? 26 : size === "lg" ? 46 : 34;
  const title = size === "sm" ? 15 : size === "lg" ? 24 : 19;
  const tagline = size === "sm" ? 9 : size === "lg" ? 12 : 10;

  return (
    <Link
      href="/feed"
      className="no-underline inline-flex items-center gap-2 select-none"
      aria-label="楽市楽座 ── 日本人総フリーランス化計画"
    >
      <img
        src="/icons/logo-emblem.png"
        alt=""
        width={emblem}
        height={emblem}
        className="flex-shrink-0"
        style={{ width: emblem, height: emblem }}
      />
      <div className="flex flex-col leading-none">
        <span
          className="font-bold whitespace-nowrap"
          style={{
            fontSize: title,
            color: "#c94d3a",
            letterSpacing: "0.08em",
          }}
        >
          楽市楽座
        </span>
        {showTagline && (
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              fontSize: tagline,
              color: "#8a6d4a",
              letterSpacing: "-0.02em",
              marginTop: 3,
            }}
          >
            日本人総フリーランス化計画
          </span>
        )}
      </div>
    </Link>
  );
}
