"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/data";

/**
 * First-time user onboarding. Redirects to /settings/profile?onboarding=1
 * ONCE per user (persisted in localStorage), only if profile is empty.
 *
 * Users who have filled even one of life_work/status_line/prefecture
 * will never be redirected again. Explicit opt-out via localStorage.
 */
export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip on settings/profile (avoid loops), login, callback, user-profile views
    if (
      pathname.startsWith("/settings") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/callback") ||
      pathname.startsWith("/u/")
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

      // Persistent flag in localStorage — survives reloads & tab closes
      const key = `rakuichi:onboarded:${session.user.id}`;
      try {
        if (localStorage.getItem(key) === "yes") return;
      } catch {
        // storage unavailable — proceed with DB check
      }

      const profile = await fetchProfile(session.user.id);
      if (cancelled) return;
      if (!profile) return; // no profile row; skip rather than loop

      // Any single signal means we don't onboard
      const hasAnyProfileData = !!(
        profile.life_work ||
        profile.status_line ||
        profile.prefecture ||
        profile.bio ||
        profile.story ||
        profile.avatar_url ||
        profile.cover_url
      );

      if (hasAnyProfileData) {
        try {
          localStorage.setItem(key, "yes");
        } catch {}
        return;
      }

      // Truly empty profile → onboard once
      router.replace("/settings/profile?onboarding=1");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
