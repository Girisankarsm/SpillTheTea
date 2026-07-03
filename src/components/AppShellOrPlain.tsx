"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { InstallBanner } from "@/components/InstallBanner";

export function AppShellOrPlain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    return (
      <div className="flex min-h-dvh flex-col">
        <InstallBanner />
        <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
