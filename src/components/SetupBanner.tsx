"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { isGoogleSignedIn } from "@/lib/supabase/auth";

export function SetupBanner() {
  const { configured, remoteReady, supabase, authReady, session } = useSupabase();

  if (!configured) {
    return null;
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

  if (!isGoogleSignedIn(session)) {
    return null;
  }

  return (
    <div className="border-b border-danger-border bg-danger-bg px-4 py-2 text-center text-xs text-danger-text">
      Sign-in didn&apos;t work. Check the browser console.
    </div>
  );
}
