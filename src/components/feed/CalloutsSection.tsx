"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { fetchCallouts } from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import type { Callout } from "@/lib/types";

/**
 * Bottom-of-feed section showing recent open callouts (この指とまれ).
 * Displays up to 5 latest, with a "もっと見る" link to /callouts.
 */
export function CalloutsSection() {
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchCallouts({ status: "open", limit: 5 });
      if (!cancelled) {
        setCallouts(list as Callout[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-6 mt-2 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <h2
          className="text-base font-bold tracking-wide"
          style={{ color: "#c94d3a" }}
        >
          🤚 この指とまれ
        </h2>
        <Link
          href="/callouts"
          className="text-xs text-accent no-underline hover:underline"
        >
          全部見る →
        </Link>
      </div>
      <p className="text-[11px] text-text-mute mb-3">
        やりたいことを掲げて仲間を集める ・ 誰かの指にとまる
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-bg animate-pulse" />
          ))}
        </div>
      ) : callouts.length === 0 ? (
        <Link href="/callouts" className="no-underline block">
          <div
            className="text-center py-6 px-4 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: "#c94d3a40",
              background:
                "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
            }}
          >
            <p className="text-3xl mb-1">🤚</p>
            <p className="text-xs font-bold" style={{ color: "#c94d3a" }}>
              まだ呼びかけはありません
            </p>
            <p className="text-[11px] text-text-sub mt-1">
              最初の指をあげて、仲間を集めよう →
            </p>
          </div>
        </Link>
      ) : (
        <div className="space-y-2">
          {callouts.map((c) => (
            <Link
              key={c.id}
              href={`/callouts/${c.id}`}
              className="no-underline block"
            >
              <div className="rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: "#c94d3a" }}
                />
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    {c.author && (
                      <Avatar
                        src={c.author.avatar_url}
                        alt={c.author.display_name}
                        size="sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold leading-snug line-clamp-2">
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-mute mt-0.5">
                        {c.author && <span>{c.author.display_name}</span>}
                        {c.prefecture && (
                          <>
                            <span className="text-text-mute/40">／</span>
                            <span>📍 {c.prefecture}</span>
                          </>
                        )}
                        <span className="text-text-mute/40">／</span>
                        <span>{formatRelativeTime(c.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-text-sub flex-shrink-0">
                      🤚 {c.participant_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <Link
            href="/callouts"
            className="block text-center text-xs font-bold text-accent bg-accent/10 hover:bg-accent/15 rounded-full py-2 no-underline"
          >
            🤚 呼びかけをもっと見る・自分も投げる →
          </Link>
        </div>
      )}
    </div>
  );
}
