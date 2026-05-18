"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { readFileAsDataUrl } from "@/lib/message-thread";
import { isImageFile } from "@/lib/image-file";
import { normalizePaymentPhone } from "@/lib/payments/upi";
import { useProfileStore } from "@/lib/profile-store";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import { uploadProfileAvatar } from "@/lib/supabase/profile-media";
import { getVisitorId } from "@/lib/visitor";

export default function ProfilePage() {
  const { session, configured, supabase, remoteReady } = useSupabase();
  const { profile, saveProfile, loading, signedIn } = useUserProfile();
  const upsertLocalPublicProfile = useProfileStore((s) => s.upsertLocalPublicProfile);

  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [paymentUpi, setPaymentUpi] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (dirty || pendingFile) return;
    setDisplayName(profile.displayName);
    setAvatarUrl(profile.avatarUrl);
    setPaymentUpi(profile.paymentUpi ?? "");
    setPaymentPhone(profile.paymentPhone ?? "");
  }, [profile.displayName, profile.avatarUrl, profile.paymentUpi, profile.paymentPhone, dirty, pendingFile]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function handleFilePick(file: File | null) {
    if (!file) return;
    if (!isImageFile(file)) {
      alert("Pick an image file for your profile photo.");
      return;
    }
    setDirty(true);
    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto() {
    setDirty(true);
    setPendingFile(null);
    setAvatarUrl(undefined);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const trimmedName = displayName.trim();
      const trimmedUpi = paymentUpi.trim();
      const trimmedPhone = paymentPhone.trim();

      if (trimmedPhone && !normalizePaymentPhone(trimmedPhone)) {
        throw new Error("Phone must be 10 digits.");
      }

      let nextAvatarUrl = avatarUrl;

      if (pendingFile) {
        setPhotoBusy(true);
        if (remoteReady && supabase && session?.user?.id && signedIn) {
          nextAvatarUrl = await uploadProfileAvatar(
            supabase,
            pendingFile,
            session.user.id,
          );
        } else {
          nextAvatarUrl = await readFileAsDataUrl(pendingFile);
        }
      }

      await saveProfile({
        displayName: trimmedName,
        avatarUrl: nextAvatarUrl,
        paymentUpi: trimmedUpi || undefined,
        paymentPhone: trimmedPhone || undefined,
      });

      setAvatarUrl(nextAvatarUrl);
      setPendingFile(null);
      setDirty(false);

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
      setPhotoBusy(false);
    }
  }

  const shownAvatar = previewUrl ?? avatarUrl;
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
          Set your anonymous name and photo. Others see your name and chakra
          only — not your email or Google account.
        </p>
      </header>

      <form
        onSubmit={(e) => void handleSave(e)}
        className="space-y-5 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {shownAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownAvatar}
                alt=""
                className="h-24 w-24 rounded-full border-2 border-border object-cover"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-brand-soft text-2xl font-bold text-brand">
                {initial}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {profile.chakra ?? 0} chakra
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">Profile photo</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/*"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-brand-soft"
              >
                {shownAvatar ? "Change photo" : "Add photo"}
              </button>
              {shownAvatar ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-subtle hover:text-danger-text"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-subtle">
              JPG, PNG, GIF, or HEIC · max 5 MB · tap Save profile after picking
            </p>
          </div>
        </div>

        <label className="block text-xs font-semibold text-foreground">
          Anonymous public name
          <input
            value={displayName}
            onChange={(e) => {
              setDirty(true);
              setDisplayName(e.target.value);
            }}
            placeholder="e.g. tea_spiller_42"
            maxLength={40}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="space-y-3 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-bold text-foreground">Get paid (duties & rides)</p>
          <p className="text-[11px] text-subtle">
            UPI & phone stay hidden. Only the duty or ride poster sees them after
            they pick you — then they can pay via GPay/UPI, call, or cash.
          </p>
          <label className="block text-xs font-semibold text-foreground">
            UPI ID
            <input
              value={paymentUpi}
              onChange={(e) => {
                setDirty(true);
                setPaymentUpi(e.target.value);
              }}
              placeholder="e.g. name@paytm or 98xxxx@ybl"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="block text-xs font-semibold text-foreground">
            Phone (10 digits)
            <input
              value={paymentPhone}
              onChange={(e) => {
                setDirty(true);
                setPaymentPhone(e.target.value);
              }}
              placeholder="e.g. 9876543210"
              inputMode="tel"
              maxLength={15}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>

        <p className="text-[11px] text-subtle">
          {signedIn && isGoogleSignedIn(session)
            ? "Signed in — email stays private."
            : configured
              ? "Sign in with Google to sync across devices."
              : "Saved on this device only."}
        </p>

        <button
          type="submit"
          disabled={saving || loading || photoBusy}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving || photoBusy ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>

      <p className="text-center text-xs text-subtle">
        Earn chakra by completing duties — +1 base, more for bigger rewards.
      </p>
    </div>
  );
}
