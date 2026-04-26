"use client";

import Link from "next/link";

const TOKEN = /(#[\p{L}\p{N}_-]+|@[a-zA-Z0-9_-]+|https?:\/\/\S+)/gu;

/**
 * Render plain post text with #hashtags, @mentions, and URLs styled and
 * linked. Plain text otherwise. Preserves whitespace via whitespace-pre-wrap
 * on the parent element.
 */
export function RichBody({ body }: { body: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of body.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(body.slice(last, idx));
    const token = m[0];
    if (token.startsWith("#")) {
      parts.push(
        <span
          key={`t${i}`}
          className="font-medium"
          style={{ color: "#c94d3a" }}
        >
          {token}
        </span>
      );
    } else if (token.startsWith("@")) {
      const username = token.slice(1);
      parts.push(
        <Link
          key={`m${i}`}
          href={`/u/${username}`}
          className="font-medium hover:underline"
          style={{ color: "#c94d3a" }}
        >
          {token}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`u${i}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
          style={{ color: "#c94d3a" }}
        >
          {token}
        </a>
      );
    }
    last = idx + token.length;
    i++;
  }
  if (last < body.length) parts.push(body.slice(last));
  return <>{parts}</>;
}
