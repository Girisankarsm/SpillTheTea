"use client";

import { useBackend } from "@/components/BackendProvider";
import { isGoogleSignedIn } from "@/lib/backend/auth";

export function SetupBanner() {
  const { configured, remoteReady, backend, authReady, session } = useBackend();

  if (!configured) {
    return null;
  }

  if (!backend || !authReady) {
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
