"use client";

interface AvatarProps {
  src: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

export function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
  const initials = alt.slice(0, 1);

  return (
    <div
      className={`${sizeMap[size]} rounded-full overflow-hidden bg-accent-soft flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-accent font-bold text-lg">{initials}</span>
      )}
    </div>
  );
}
