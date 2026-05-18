"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import {
  fetchProfileRemote,
  profileFromGoogleSession,
  upsertProfileRemote,
} from "@/lib/supabase/profile-remote";
import { profileDisplayName, useProfileStore } from "@/lib/profile-store";
import type { UserProfile } from "@/lib/types/profile";

export function useUserProfile() {
  const { supabase, session, remoteReady, authReady } = useSupabase();
  const local = useProfileStore();
  const signedIn = isGoogleSignedIn(session);

  const [remoteProfile, setRemoteProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const reloadRemote = useCallback(async () => {
    if (!supabase || !session?.user?.id || !signedIn) {
      setRemoteProfile(null);
      return;
    }
    setLoading(true);
    try {
      let profile = await fetchProfileRemote(supabase, session.user.id);
      if (!profile) {
        const seed = profileFromGoogleSession(session);
        if (seed) {
          profile = await upsertProfileRemote(supabase, session.user.id, seed);
        }
      }
      setRemoteProfile(profile);
    } finally {
      setLoading(false);
    }
  }, [supabase, session, signedIn]);

  useEffect(() => {
    if (!remoteReady || !authReady) return;
    void reloadRemote();
  }, [remoteReady, authReady, reloadRemote]);

  const profile = useMemo((): UserProfile => {
    if (remoteReady && signedIn && remoteProfile) return remoteProfile;
    return {
      displayName: local.displayName,
      bio: local.bio,
      avatarUrl: local.avatarUrl,
      updatedAt: local.updatedAt,
    };
  }, [remoteReady, signedIn, remoteProfile, local]);

  const defaultDisplayName = profileDisplayName(profile);

  const saveProfile = useCallback(
    async (input: Partial<UserProfile>) => {
      const next: UserProfile = {
        displayName: input.displayName?.trim() ?? profile.displayName,
        bio: input.bio?.trim() ?? profile.bio,
        avatarUrl: input.avatarUrl ?? profile.avatarUrl,
      };

      if (!next.displayName.trim()) {
        throw new Error("Pick a display name.");
      }

      if (remoteReady && supabase && session?.user?.id && signedIn) {
        const saved = await upsertProfileRemote(supabase, session.user.id, next);
        setRemoteProfile(saved);
        return saved;
      }

      local.setProfile(next);
      return next;
    },
    [profile, remoteReady, supabase, session, signedIn, local],
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
