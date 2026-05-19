"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  googleProfile,
  isGoogleSignedIn,
  signInWithGoogle,
  signOutUser,
} from "@/lib/supabase/auth";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, session, authReady, configured } = useSupabase();
  const { profile, defaultDisplayName } = useUserProfile();
  const [busy, setBusy] = useState(false);

  if (!configured || !supabase) return null;

  const signedIn = isGoogleSignedIn(session);
  const google = googleProfile(session);
  const showName = defaultDisplayName || "You";
  const avatarUrl = profile.avatarUrl?.trim() || null;

  async function handleGoogleSignIn() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await signInWithGoogle(supabase, pathname || "/");
      if (error) alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      await signOutUser(supabase);
      router.replace("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return (
      <span className="hidden text-xs text-subtle sm:inline">…</span>
    );
  }

  if (signedIn) {
    return (
      <div className="group relative">
        <Link
          href="/profile"
          title="Your profile"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface shadow-sm transition hover:border-brand hover:ring-2 hover:ring-brand/30"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-brand">
              {showName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="pointer-events-none invisible absolute right-0 top-[calc(100%+10px)] z-[600] w-52 scale-95 rounded-xl border border-border bg-surface p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:scale-100 group-hover:opacity-100">
          <p className="truncate text-sm font-bold text-foreground">{showName}</p>
          {signedIn && google?.email ? (
            <p className="mt-0.5 truncate text-xs text-subtle">{google.email}</p>
          ) : null}
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              href="/profile"
              className="rounded-lg bg-brand-soft px-3 py-1.5 text-center text-xs font-bold text-brand hover:opacity-90"
            >
              Edit profile
            </Link>
            {signedIn ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={busy}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-background disabled:opacity-50"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleGoogleSignIn()}
      disabled={busy}
      className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50 dark:bg-surface dark:text-foreground dark:hover:bg-background"
    >
      <GoogleMark />
      <span className="hidden sm:inline">Sign in with Google</span>
      <span className="sm:hidden">Google</span>
    </button>
  );
}
