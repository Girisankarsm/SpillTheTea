import { Suspense } from "react";
import { LoginScreen } from "@/components/LoginScreen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-subtle">Loading…</p>
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
