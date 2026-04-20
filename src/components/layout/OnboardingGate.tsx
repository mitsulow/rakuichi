"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/data";

/**
 * If the logged-in user's profile is essentially empty (no life_work, no status_line, no prefecture),
 * redirect them once to /settings/profile?onboarding=1.
 * Skipped for paths that are themselves the settings, callback, or auth routes.
 */
export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip on settings/profile itself (to avoid loops), login, callback
    if (
      pathname.startsWith("/settings") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/callback")
    ) {
      return;
    }

    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      // Once per session: skip if flagged
      const key = `onb:${session.user.id}`;
      if (sessionStorage.getItem(key)) return;

      const profile = await fetchProfile(session.user.id);
      if (!profile || cancelled) return;

      const needsOnboarding =
        !profile.life_work && !profile.status_line && !profile.prefecture;

      if (needsOnboarding) {
        sessionStorage.setItem(key, "pending");
        router.replace("/settings/profile?onboarding=1");
      } else {
        sessionStorage.setItem(key, "done");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
