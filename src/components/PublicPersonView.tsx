"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChakraBadge } from "@/components/ChakraBadge";
import { useSupabase } from "@/components/SupabaseProvider";
import { fetchPublicProfileRemote } from "@/lib/supabase/profile-remote";
import { useProfileStore } from "@/lib/profile-store";
import type { PublicUserProfile } from "@/lib/types/profile";

type PublicPersonViewProps = {
  userId?: string;
  visitorId?: string;
};

export function PublicPersonView({ userId, visitorId }: PublicPersonViewProps) {
  const { supabase, remoteReady } = useSupabase();
  const getLocalPublicProfile = useProfileStore((s) => s.getLocalPublicProfile);
  const [remote, setRemote] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(userId && remoteReady));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !remoteReady || !supabase) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const profile = await fetchPublicProfileRemote(supabase, userId);
        if (!cancelled) {
          setRemote(profile);
          setError(profile ? null : "This person has not set up a public name yet.");
        }
      } catch {
        if (!cancelled) setError("Could not load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, remoteReady, supabase]);

  const local =
    visitorId && !userId ? getLocalPublicProfile(visitorId) : null;
  const profile = userId && remoteReady ? remote : local;

  if (loading) {
    return <p className="text-sm text-subtle">Loading…</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-subtle">{error ?? "Profile not found."}</p>
        <Link href="/duties" className="text-sm font-bold text-brand hover:underline">
          ← Duties
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <ChakraBadge chakra={profile.chakra} size="lg" />
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-subtle">
          Anonymous name
        </p>
        <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
        <p className="text-sm text-subtle">
          Only this name and chakra are public — no email, no real name.
        </p>
      </div>
      <Link href="/duties" className="text-sm font-bold text-brand hover:underline">
        ← Duties
      </Link>
    </div>
  );
}
