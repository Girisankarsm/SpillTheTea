"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBackend } from "@/components/BackendProvider";
import { isGoogleSignedIn } from "@/lib/backend/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, authReady, configured } = useBackend();

  useEffect(() => {
    if (!authReady) return;
    if (!configured) return;
    if (isGoogleSignedIn(session)) return;
    router.replace(`/login?next=${encodeURIComponent(pathname || "/topics")}`);
  }, [authReady, configured, session, pathname, router]);

  if (!authReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  if (configured && !isGoogleSignedIn(session)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-subtle">Redirecting to sign in…</p>
      </div>
    );
  }

  return children;
}
