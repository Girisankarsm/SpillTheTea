"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { googleProfile, isGoogleSignedIn } from "@/lib/supabase/auth";

export default function ProfilePage() {
  const { session, configured } = useSupabase();
  const { profile, saveProfile, loading, signedIn } = useUserProfile();
  const google = googleProfile(session);

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
      await saveProfile({ displayName, bio, avatarUrl: profile.avatarUrl });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = profile.avatarUrl ?? google?.avatarUrl ?? null;
  const initial = (displayName || google?.name || "?").slice(0, 1).toUpperCase();

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
          This name shows when you post in tea rooms. Your email stays private.
        </p>
      </header>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-xl font-bold text-brand">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">
            {displayName || google?.name || "Set a display name"}
          </p>
          {signedIn && google?.email ? (
            <p className="truncate text-xs text-subtle">{google.email}</p>
          ) : (
            <p className="text-xs text-subtle">
              {configured
                ? "Sign in with Google to sync across devices."
                : "Saved on this device only."}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSave(e)}
        className="space-y-4 rounded-xl border border-border bg-surface p-4"
      >
        <label className="block text-xs font-semibold text-foreground">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. tea_spiller_42"
            maxLength={40}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="block text-xs font-semibold text-foreground">
          Bio <span className="font-normal text-subtle">(optional)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What's your vibe?"
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

      {!signedIn && configured && !isGoogleSignedIn(session) ? (
        <p className="text-center text-xs text-subtle">
          Tip: sign in with Google in the header to keep your profile everywhere.
        </p>
      ) : null}
    </div>
  );
}
