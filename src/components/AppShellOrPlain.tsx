"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { InstallBanner } from "@/components/InstallBanner";

export function AppShellOrPlain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="sticky top-0 z-[600] shrink-0">
          <InstallBanner />
        </div>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
