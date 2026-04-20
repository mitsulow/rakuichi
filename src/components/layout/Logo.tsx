import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md";
}

export function Logo({ size = "md" }: LogoProps) {
  const circleSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-base" : "text-xl";
  const charSize = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <Link href="/feed" className="flex items-center gap-2 no-underline">
      <div
        className={`${circleSize} rounded-full bg-accent flex items-center justify-center`}
      >
        <span className={`${charSize} text-white font-bold leading-none`}>
          楽
        </span>
      </div>
      <span className={`${textSize} font-bold text-text hidden sm:inline`}>
        楽市楽座
      </span>
    </Link>
  );
}
