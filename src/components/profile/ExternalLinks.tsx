import { SnsIcon, getPlatformLabel } from "@/components/ui/SnsIcon";
import type { ExternalLink } from "@/lib/types";

interface ExternalLinksProps {
  links: ExternalLink[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (!links.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">🔗 外部リンク</h3>
      <div className="flex gap-2 flex-wrap">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-text-sub hover:text-accent transition-colors no-underline bg-bg rounded-full px-3 py-1.5 border border-border"
            title={getPlatformLabel(link.platform)}
          >
            <SnsIcon platform={link.platform} size={16} />
            <span className="text-xs">{getPlatformLabel(link.platform)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
