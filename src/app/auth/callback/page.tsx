"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function CallbackRunner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?auth=failed");
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <p className="text-sm text-subtle">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
          <p className="text-sm text-subtle">Loading…</p>
        </div>
      }
    >
      <CallbackRunner />
    </Suspense>
  );
}
