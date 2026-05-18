"use client";

import { useSupabase } from "@/components/SupabaseProvider";

export function SetupBanner() {
  const { configured, remoteReady, supabase, authReady } = useSupabase();

  if (!configured) {
    return (
      <div className="border-b border-border bg-accent-soft px-4 py-2.5 text-center text-xs leading-snug text-foreground">
        <span className="font-semibold">Demo mode</span>
        {" · "}
        Add Supabase URL + anon key, run{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-[11px] ring-1 ring-border">
          001_initial.sql
        </code>
        , enable anonymous sign-in.
      </div>
    );
  }

  if (!supabase || !authReady) {
    return (
      <div className="border-b border-border bg-background px-4 py-2 text-center text-xs text-subtle">
        Connecting…
      </div>
    );
  }

  if (remoteReady) {
    return null;
  }

  return (
    <div className="border-b border-danger-border bg-danger-bg px-4 py-2 text-center text-xs text-danger-text">
      Sign-in didn&apos;t work. Check the browser console.
    </div>
  );
}
