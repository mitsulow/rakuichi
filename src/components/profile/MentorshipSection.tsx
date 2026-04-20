"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  fetchUserMentorships,
  proposeMentorship,
  respondMentorship,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Mentorship, Profile } from "@/lib/types";

interface MentorshipSectionProps {
  profile: Profile;
  isOwner: boolean;
}

type MentorshipWithProfiles = Mentorship & {
  mentor?: Profile | null;
  apprentice?: Profile | null;
};

export function MentorshipSection({ profile, isOwner }: MentorshipSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [mentorships, setMentorships] = useState<MentorshipWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setCurrentUserProfile(data as Profile | null);
      }

      const ms = await fetchUserMentorships(profile.id);
      setMentorships(ms as MentorshipWithProfiles[]);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  if (loading) return null;

  const asMentor = mentorships.filter(
    (m) => m.mentor_id === profile.id && m.status === "active"
  );
  const asApprentice = mentorships.filter(
    (m) => m.apprentice_id === profile.id && m.status === "active"
  );

  // Pending proposals that the profile owner needs to respond to
  const pendingForOwner = isOwner
    ? mentorships.filter(
        (m) => m.status === "pending" && m.proposed_by !== profile.id
      )
    : [];

  // Existing relationship between viewer and this profile
  const relationship =
    currentUserId && currentUserId !== profile.id
      ? mentorships.find(
          (m) =>
            (m.mentor_id === profile.id && m.apprentice_id === currentUserId) ||
            (m.apprentice_id === profile.id && m.mentor_id === currentUserId)
        )
      : null;

  // Determine who could be mentor / who could be apprentice
  const profileIsIchininmae = profile.life_work_level === "一人前";
  const viewerIsIchininmae = currentUserProfile?.life_work_level === "一人前";
  const viewerIsShugyochu = currentUserProfile?.life_work_level === "修行中";
  const profileIsShugyochu = profile.life_work_level === "修行中";

  // Same life_work craft check (loose)
  const sameCraft =
    currentUserProfile?.life_work &&
    profile.life_work &&
    currentUserProfile.life_work === profile.life_work;

  const canProposeAsMentor =
    !isOwner &&
    !relationship &&
    viewerIsIchininmae &&
    profileIsShugyochu &&
    sameCraft;

  const canProposeAsApprentice =
    !isOwner &&
    !relationship &&
    viewerIsShugyochu &&
    profileIsIchininmae &&
    sameCraft;

  const handleProposeAsMentor = async () => {
    if (!currentUserId || proposing) return;
    setProposing(true);
    await proposeMentorship({
      mentorId: currentUserId,
      apprenticeId: profile.id,
      proposedBy: currentUserId,
      craft: currentUserProfile?.life_work ?? null,
    });
    const ms = await fetchUserMentorships(profile.id);
    setMentorships(ms as MentorshipWithProfiles[]);
    setProposing(false);
  };

  const handleProposeAsApprentice = async () => {
    if (!currentUserId || proposing) return;
    setProposing(true);
    await proposeMentorship({
      mentorId: profile.id,
      apprenticeId: currentUserId,
      proposedBy: currentUserId,
      craft: profile.life_work ?? null,
    });
    const ms = await fetchUserMentorships(profile.id);
    setMentorships(ms as MentorshipWithProfiles[]);
    setProposing(false);
  };

  const handleRespond = async (
    id: string,
    status: "active" | "declined"
  ) => {
    await respondMentorship(id, status);
    const ms = await fetchUserMentorships(profile.id);
    setMentorships(ms as MentorshipWithProfiles[]);
  };

  const nothingToShow =
    asMentor.length === 0 &&
    asApprentice.length === 0 &&
    pendingForOwner.length === 0 &&
    !canProposeAsMentor &&
    !canProposeAsApprentice;

  if (nothingToShow) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-2.5">
      <div className="text-xs text-text-mute">🏫 師弟</div>

      {/* Active mentor of */}
      {asMentor.length > 0 && (
        <div>
          <div className="text-[10px] text-text-mute mb-1">
            弟子（{asMentor.length}人）
          </div>
          <div className="flex flex-wrap gap-2">
            {asMentor.map((m) =>
              m.apprentice ? (
                <Link
                  key={m.id}
                  href={`/u/${m.apprentice.username}`}
                  className="flex items-center gap-1 no-underline bg-bg rounded-full pr-2.5 py-0.5 border border-border"
                >
                  <Avatar
                    src={m.apprentice.avatar_url}
                    alt={m.apprentice.display_name}
                    size="xs"
                  />
                  <span className="text-xs">{m.apprentice.display_name}</span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Active apprentice of */}
      {asApprentice.length > 0 && (
        <div>
          <div className="text-[10px] text-text-mute mb-1">師匠</div>
          <div className="flex flex-wrap gap-2">
            {asApprentice.map((m) =>
              m.mentor ? (
                <Link
                  key={m.id}
                  href={`/u/${m.mentor.username}`}
                  className="flex items-center gap-1 no-underline bg-bg rounded-full pr-2.5 py-0.5 border border-border"
                >
                  <Avatar
                    src={m.mentor.avatar_url}
                    alt={m.mentor.display_name}
                    size="xs"
                  />
                  <span className="text-xs">🎓 {m.mentor.display_name}</span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Pending proposals needing owner's response */}
      {pendingForOwner.map((m) => {
        const other = m.proposed_by === m.mentor_id ? m.mentor : m.apprentice;
        const theyWantToBe = m.proposed_by === m.mentor_id ? "師匠" : "弟子";
        return (
          <div
            key={m.id}
            className="bg-accent/5 border border-accent/30 rounded-xl p-2.5"
          >
            <p className="text-xs mb-2">
              <span className="font-medium">{other?.display_name}</span>
              さんが{theyWantToBe}になりたいそうです
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRespond(m.id, "declined")}
                className="flex-1"
              >
                お断り
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRespond(m.id, "active")}
                className="flex-1"
              >
                ✓ 受ける
              </Button>
            </div>
          </div>
        );
      })}

      {/* Propose buttons */}
      {canProposeAsMentor && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleProposeAsMentor}
          disabled={proposing}
          className="w-full"
        >
          🎓 弟子に迎える
        </Button>
      )}
      {canProposeAsApprentice && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleProposeAsApprentice}
          disabled={proposing}
          className="w-full"
        >
          🎓 師事を申し出る
        </Button>
      )}

      {/* Pending proposed by current viewer */}
      {relationship?.status === "pending" && (
        <p className="text-[10px] text-text-mute text-center">
          申し出は返事待ちです
        </p>
      )}
    </div>
  );
}
