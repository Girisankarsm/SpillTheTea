"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";

export function AppShellOrPlain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
