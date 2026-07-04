"use client";

import { useEffect, useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { fetchPublicProfileRemote } from "@/lib/backend/profile-remote";
import { useProfileStore } from "@/lib/profile-store";
import type { PublicUserProfile } from "@/lib/types/profile";

export function usePublicProfile(input: {
  userId?: string;
  visitorId?: string;
  fallbackName?: string;
}) {
  const { backend, remoteReady } = useBackend();
  const getLocalPublicProfile = useProfileStore((s) => s.getLocalPublicProfile);
  const [remote, setRemote] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (input.userId && remoteReady && backend) {
      let cancelled = false;
      setLoading(true);
      void (async () => {
        try {
          const profile = await fetchPublicProfileRemote(backend, input.userId!);
          if (!cancelled) setRemote(profile);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setRemote(null);
    setLoading(false);
  }, [input.userId, remoteReady, backend]);

  if (input.userId && remoteReady) {
    return {
      profile: remote,
      loading,
      displayName: remote?.displayName ?? input.fallbackName ?? "anon",
      chakra: remote?.chakra ?? 0,
    };
  }

  if (input.visitorId) {
    const local = getLocalPublicProfile(input.visitorId);
    return {
      profile: local,
      loading: false,
      displayName: local?.displayName ?? input.fallbackName ?? "anon",
      chakra: local?.chakra ?? 0,
    };
  }

  return {
    profile: null,
    loading: false,
    displayName: input.fallbackName ?? "anon",
    chakra: 0,
  };
}
