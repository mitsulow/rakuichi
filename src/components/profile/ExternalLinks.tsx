import { SOCIAL_PLATFORMS } from "@/lib/constants";
import type { ExternalLink } from "@/lib/types";

interface ExternalLinksProps {
  links: ExternalLink[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (!links.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">外部リンク</h3>
      <div className="flex gap-3 flex-wrap">
        {links.map((link) => {
          const platform = SOCIAL_PLATFORMS.find(
            (p) => p.id === link.platform
          );
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-sub hover:text-accent transition-colors no-underline bg-bg rounded-full px-3 py-1.5"
              title={platform?.label}
            >
              <span className="text-sm">{platform?.icon || "🔗"}</span>
              <span className="text-xs">{platform?.label || "リンク"}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
