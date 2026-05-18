"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useSupabase } from "@/components/SupabaseProvider";
import { APP_DISCLAIMER } from "@/lib/disclaimer";
import { isGoogleSignedIn, signInWithGoogle } from "@/lib/supabase/auth";

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

export function LoginGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { supabase, session, authReady, configured } = useSupabase();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const signedIn = isGoogleSignedIn(session);

  if (pathname.startsWith("/auth/callback")) {
    return children;
  }

  if (signedIn) {
    return children;
  }

  if (configured && !authReady) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4">
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  async function handleGoogleSignIn() {
    if (!supabase || !accepted || busy) return;
    setBusy(true);
    try {
      const { error } = await signInWithGoogle(supabase, pathname || "/");
      if (error) alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <AppLogo heightPx={112} priority className="shadow-md" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            SpillTheTea
          </h1>
          <p className="text-sm text-subtle">Sign in to start using the app.</p>
        </div>

        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-xs leading-relaxed text-subtle">
          {APP_DISCLAIMER}
        </p>

        <label className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
          />
          <span className="text-foreground">
            I have read the disclaimer and agree to use SpillTheTea responsibly.
          </span>
        </label>

        {configured && supabase ? (
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={!accepted || busy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface dark:text-foreground dark:hover:bg-background"
          >
            <GoogleMark />
            {busy ? "Redirecting…" : "Sign in with Google"}
          </button>
        ) : (
          <p className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-xs text-danger-text">
            Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono">.env.local</code>, then restart the app. Google
            sign-in must be enabled in Supabase.
          </p>
        )}
      </div>
    </div>
  );
}
