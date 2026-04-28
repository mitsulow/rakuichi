"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAspirationCount,
  hasAspired,
  toggleAspiration,
  fetchAspirers,
} from "@/lib/data";
import type { Profile } from "@/lib/types";

interface AspireButtonProps {
  profile: Profile;
  isOwner: boolean;
}

export function AspireButton({ profile, isOwner }: AspireButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [aspired, setAspired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aspirers, setAspirers] = useState<Profile[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUserId(session?.user.id ?? null);

      const [c, list] = await Promise.all([
        fetchAspirationCount(profile.id),
        fetchAspirers(profile.id),
      ]);
      setCount(c);
      setAspirers(list);

      if (session && session.user.id !== profile.id) {
        const did = await hasAspired(profile.id, session.user.id);
        setAspired(did);
      }
    }
    load();
  }, [profile.id]);

  const handleClick = async () => {
    if (!currentUserId || busy || isOwner) return;
    setBusy(true);
    const result = await toggleAspiration(
      profile.id,
      currentUserId,
      profile.life_work
    );
    setAspired(result.aspired);
    setCount((c) => c + (result.aspired ? 1 : -1));
    setBusy(false);
  };

  if (!profile.life_work) return null;
  if (count === 0 && !currentUserId) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🌱</span>
        <span className="text-xs text-text-mute">
          このライフワークに憧れるむらびと
        </span>
        {count > 0 && (
          <span className="text-xs font-bold text-accent ml-auto">{count}人</span>
        )}
      </div>

      {aspirers.length > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {aspirers.map((a) => (
            <Link
              key={a.id}
              href={`/u/${a.username}`}
              className="no-underline"
              title={a.display_name}
            >
              <Avatar src={a.avatar_url} alt={a.display_name} size="xs" />
            </Link>
          ))}
        </div>
      )}

      {!isOwner && currentUserId && (
        <button
          onClick={handleClick}
          disabled={busy}
          className={`w-full py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
            aspired
              ? "bg-accent text-white border-accent"
              : "bg-bg border-accent/30 text-accent hover:bg-accent/5"
          }`}
        >
          {aspired
            ? "🌱 目指す仲間になりました"
            : `🌱 「${profile.life_work}」私も目指したい`}
        </button>
      )}
    </div>
  );
}
