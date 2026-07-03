"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import { profileDisplayName, useProfileStore } from "@/lib/profile-store";
import type { UserProfile } from "@/lib/types/profile";

export function useUserProfile() {
  const { session, authReady } = useSupabase();
  const local = useProfileStore();
  const signedIn = isGoogleSignedIn(session);

  const [remoteProfile, setRemoteProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const reloadRemote = useCallback(async () => {
    if (!session?.user?.id || !signedIn) {
      setRemoteProfile(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load profile.");
      const data = (await response.json()) as { profile: UserProfile | null };
      setRemoteProfile(data.profile);
    } finally {
      setLoading(false);
    }
  }, [session, signedIn]);

  useEffect(() => {
    if (!signedIn || !authReady) return;
    void reloadRemote();
  }, [signedIn, authReady, reloadRemote]);

  const profile = useMemo((): UserProfile => {
    if (signedIn && remoteProfile) return remoteProfile;
    return {
      displayName: local.displayName,
      avatarUrl: local.avatarUrl,
      chakra: local.chakra ?? 0,
      updatedAt: local.updatedAt,
      paymentUpi: local.paymentUpi,
      paymentPhone: local.paymentPhone,
    };
  }, [signedIn, remoteProfile, local]);

  const defaultDisplayName = profileDisplayName(profile);

  const saveProfile = useCallback(
    async (input: Partial<UserProfile>) => {
      const next: UserProfile = {
        displayName: input.displayName?.trim() ?? profile.displayName,
        avatarUrl:
          input.avatarUrl !== undefined ? input.avatarUrl : profile.avatarUrl,
        chakra: profile.chakra ?? 0,
        paymentUpi:
          input.paymentUpi !== undefined ? input.paymentUpi : profile.paymentUpi,
        paymentPhone:
          input.paymentPhone !== undefined ? input.paymentPhone : profile.paymentPhone,
      };

      if (!next.displayName.trim()) {
        throw new Error("Pick a display name.");
      }

      if (session?.user?.id && signedIn) {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        const data = (await response.json()) as {
          profile?: UserProfile;
          error?: string;
        };
        if (!response.ok || !data.profile) {
          throw new Error(data.error || "Could not save profile.");
        }
        const saved = data.profile;
        setRemoteProfile(saved);
        return saved;
      }

      local.setProfile(next);
      return next;
    },
    [profile, session, signedIn, local],
  );

  return {
    profile,
    defaultDisplayName,
    saveProfile,
    loading,
    signedIn,
    canEdit: true,
  };
}
