"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChakraBadge } from "@/components/ChakraBadge";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProfileStore } from "@/lib/profile-store";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import { getVisitorId } from "@/lib/visitor";

export default function ProfilePage() {
  const { session, configured } = useSupabase();
  const { profile, saveProfile, loading, signedIn } = useUserProfile();
  const upsertLocalPublicProfile = useProfileStore((s) => s.upsertLocalPublicProfile);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
  }, [profile.displayName, profile.bio]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const trimmedName = displayName.trim();
      await saveProfile({ displayName: trimmedName, bio, avatarUrl: profile.avatarUrl });
      const vid = getVisitorId();
      if (vid) {
        upsertLocalPublicProfile(vid, {
          displayName: trimmedName,
          chakra: profile.chakra ?? 0,
        });
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const initial = (displayName || "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <Link
          href="/topics"
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your profile
        </h1>
        <p className="text-sm text-subtle">
          Others only see your <strong>anonymous name</strong> and{" "}
          <strong>chakra</strong> — never your email or Google name.
        </p>
      </header>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <ChakraBadge chakra={profile.chakra ?? 0} size="sm" showLabel={false} />
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">
            {displayName || "Pick an anonymous name"}
          </p>
          <p className="text-xs text-subtle">
            {signedIn && isGoogleSignedIn(session)
              ? "Signed in — email stays private."
              : configured
                ? "Sign in with Google to sync across devices."
                : "Saved on this device only."}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSave(e)}
        className="space-y-4 rounded-xl border border-border bg-surface p-4"
      >
        <label className="block text-xs font-semibold text-foreground">
          Anonymous public name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. tea_spiller_42"
            maxLength={40}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <p className="text-[11px] text-subtle">
          This is the only name people see on duties and your public profile.
        </p>

        <label className="block text-xs font-semibold text-foreground">
          Bio <span className="font-normal text-subtle">(private — only you see this)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Notes for yourself…"
            maxLength={200}
            rows={3}
            className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>

      <p className="text-center text-xs text-subtle">
        Earn chakra by completing duties — +1 base, more for bigger rewards.
      </p>
    </div>
  );
}
