"use client";

interface EdoIconProps {
  name: EdoIconName;
  size?: number;
  color?: string;
  className?: string;
}

export type EdoIconName =
  // Nav
  | "rakuza"
  | "map"
  | "joucho"
  | "fumi"
  | "mypage"
  // Categories
  | "food"
  | "craft"
  | "body"
  | "mind"
  | "expression"
  | "learning"
  | "living"
  | "moon"
  | "kids";

/**
 * Hand-drawn-style inline SVG icons matching the Edo-era aesthetic.
 * Uses currentColor so the icon picks up surrounding text color.
 */
export function EdoIcon({ name, size = 24, color, className = "" }: EdoIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color ?? "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "rakuza":
      // Torii gate (⛩) stylized — the symbol of a market's threshold
      return (
        <svg {...props}>
          <path d="M3 7h18" />
          <path d="M4 5c5 1.5 11 1.5 16 0" />
          <line x1="6" y1="7" x2="6" y2="21" />
          <line x1="18" y1="7" x2="18" y2="21" />
          <line x1="5" y1="11" x2="19" y2="11" />
        </svg>
      );

    case "map":
      // Folded paper map
      return (
        <svg {...props}>
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          <line x1="9" y1="4" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="20" />
        </svg>
      );

    case "joucho":
      // Speech bubble with swirl (emotion)
      return (
        <svg {...props}>
          <path d="M4 5h16a2 2 0 012 2v8a2 2 0 01-2 2h-8l-4 4v-4H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
          <circle cx="9" cy="11" r="0.8" fill={color ?? "currentColor"} />
          <circle cx="12" cy="11" r="0.8" fill={color ?? "currentColor"} />
          <circle cx="15" cy="11" r="0.8" fill={color ?? "currentColor"} />
        </svg>
      );

    case "fumi":
      // Rolled scroll (letter/fumi)
      return (
        <svg {...props}>
          <path d="M5 4h12a2 2 0 012 2v12a2 2 0 01-2 2H7" />
          <path d="M5 4a2 2 0 00-2 2v12a2 2 0 002 2h2V4z" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      );

    case "mypage":
      // Round mirror (鏡) — self reflection
      return (
        <svg {...props}>
          <circle cx="12" cy="11" r="7" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
          <circle cx="10" cy="9" r="1.3" fill={color ?? "currentColor"} stroke="none" />
        </svg>
      );

    case "food":
      // Rice bowl (お茶碗)
      return (
        <svg {...props}>
          <path d="M3 11h18" />
          <path d="M4 11c0 5 3.5 8 8 8s8-3 8-8" />
          <path d="M9 8c0-1 1-2 3-2s3 1 3 2" strokeDasharray="1 2" />
        </svg>
      );

    case "craft":
      // Brush + ink dot
      return (
        <svg {...props}>
          <path d="M4 20l6-6" />
          <path d="M10 14l4-10 5 5-10 4z" />
          <circle cx="19" cy="19" r="1.8" fill={color ?? "currentColor"} stroke="none" />
        </svg>
      );

    case "body":
      // Seated meditation posture
      return (
        <svg {...props}>
          <circle cx="12" cy="6" r="2.2" />
          <path d="M6 19c0-3 3-5 6-5s6 2 6 5" />
          <path d="M4 19h16" />
        </svg>
      );

    case "mind":
      // Lotus flower (蓮)
      return (
        <svg {...props}>
          <path d="M12 20v-8" />
          <path d="M12 12c-3-2-5-2-7 0 2 3 5 4 7 4" />
          <path d="M12 12c3-2 5-2 7 0-2 3-5 4-7 4" />
          <path d="M12 12c-1.5-3-1.5-5 0-7 1.5 2 1.5 4 0 7z" />
        </svg>
      );

    case "expression":
      // Noh mask
      return (
        <svg {...props}>
          <ellipse cx="12" cy="12" rx="6" ry="8" />
          <path d="M9 10c0.5-0.5 1.5-0.5 2 0" />
          <path d="M13 10c0.5-0.5 1.5-0.5 2 0" />
          <path d="M10 16c1 0.5 3 0.5 4 0" />
        </svg>
      );

    case "learning":
      // Open book with string bookmark
      return (
        <svg {...props}>
          <path d="M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3V5z" />
          <path d="M21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7V5z" />
          <line x1="18" y1="8" x2="18" y2="22" strokeDasharray="1 2" />
        </svg>
      );

    case "living":
      // Traditional house with kawara roof
      return (
        <svg {...props}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );

    case "moon":
      // Crescent moon + sakura
      return (
        <svg {...props}>
          <path d="M20 14a8 8 0 11-8-10 6 6 0 008 10z" />
          <circle cx="6" cy="7" r="0.8" fill={color ?? "currentColor"} stroke="none" />
          <circle cx="4" cy="11" r="0.8" fill={color ?? "currentColor"} stroke="none" />
        </svg>
      );

    case "kids":
      // Origami crane (折り鶴)
      return (
        <svg {...props}>
          <path d="M3 12l9-7 3 4 6-1-5 6 2 5-8-2-7-5z" />
          <line x1="12" y1="5" x2="12" y2="14" />
        </svg>
      );
  }
}
