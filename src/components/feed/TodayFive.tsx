import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeList } from "@/components/ui/Badge";
import type { Profile, Badge } from "@/lib/types";

interface TodayFiveProps {
  profiles: Profile[];
  badges: Badge[];
}

export function TodayFive({ profiles, badges }: TodayFiveProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-text-sub px-1">
        🌅 今日の5人
      </h2>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {profiles.map((profile) => {
          const userBadges = badges.filter((b) => b.user_id === profile.id);
          return (
            <Link
              key={profile.id}
              href={`/u/${profile.username}`}
              className="flex-shrink-0 w-28 bg-card rounded-2xl border border-border p-3 flex flex-col items-center text-center no-underline hover:shadow-md transition-shadow"
            >
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
              <p className="text-xs font-medium mt-2 line-clamp-1">
                {profile.display_name}
              </p>
              <BadgeList badges={userBadges.slice(0, 3)} />
              {profile.prefecture && (
                <p className="text-[10px] text-text-mute mt-0.5">
                  📍{profile.prefecture}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
