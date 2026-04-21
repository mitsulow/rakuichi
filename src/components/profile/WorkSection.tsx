import type { Profile } from "@/lib/types";

interface WorkSectionProps {
  profile: Profile;
}

export function WorkSection({ profile }: WorkSectionProps) {
  if (!profile.rice_work && !profile.life_work) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">ワーク</h3>
      {profile.rice_work && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-text-mute bg-bg rounded px-2 py-0.5 shrink-0">
            ライスワーク
          </span>
          <span className="text-sm">{profile.rice_work}</span>
        </div>
      )}
      {profile.life_work && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-accent bg-accent-soft rounded px-2 py-0.5 shrink-0">
            ライフワーク
          </span>
          <span className="text-sm">
            {profile.life_work}
            {profile.life_work_level && (
              <span className="text-text-mute">
                （{profile.life_work_level}
                {profile.life_work_years
                  ? `・移行${profile.life_work_years}年目`
                  : ""}
                ）
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
