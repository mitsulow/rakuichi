"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchProfileSuggestions, followUser } from "@/lib/data";
import type { Profile } from "@/lib/types";

/**
 * Compact horizontal carousel of profile cards the current user doesn't follow.
 * Shown on /feed when there are suggestions to surface.
 */
export function ProfileSuggestions() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchProfileSuggestions(user?.id ?? null, 6);
      if (!cancelled) {
        setProfiles(list as Profile[]);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleFollow = async (target: Profile) => {
    if (!user || followed.has(target.id)) return;
    setFollowed((prev) => new Set(prev).add(target.id));
    const result = await followUser(user.id, target.id);
    if (result.error) {
      // Roll back on error
      setFollowed((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  };

  if (!loaded || profiles.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-text-sub mb-2 px-1">
        ✨ おすすめの座の民
      </p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
        {profiles.map((p) => {
          const isFollowed = followed.has(p.id);
          return (
            <div
              key={p.id}
              className="flex-shrink-0 w-36 rounded-xl border border-border bg-card overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #fffaf0 0%, #fdf6e9 100%)",
              }}
            >
              <Link
                href={`/u/${p.username}`}
                className="block p-2.5 no-underline text-center"
              >
                <div className="flex justify-center">
                  <Avatar
                    src={p.avatar_url}
                    alt={p.display_name}
                    size="md"
                  />
                </div>
                <div className="text-xs font-bold mt-1.5 truncate">
                  {p.display_name}
                </div>
                {p.life_work && (
                  <div className="text-[10px] text-text-mute truncate mt-0.5">
                    🌱 {p.life_work}
                  </div>
                )}
                {p.prefecture && (
                  <div className="text-[10px] text-text-mute truncate">
                    📍 {p.prefecture}
                  </div>
                )}
              </Link>
              {user && (
                <button
                  onClick={() => handleFollow(p)}
                  disabled={isFollowed}
                  className={`w-full text-[11px] font-bold py-1.5 transition-colors ${
                    isFollowed
                      ? "bg-accent/15 text-accent"
                      : "bg-accent text-white hover:opacity-90"
                  }`}
                >
                  {isFollowed ? "🏮 のれん中" : "🏮 のれんをくぐる"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
