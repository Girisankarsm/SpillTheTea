import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { AuthMenu } from "@/components/AuthMenu";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { InstallBanner } from "@/components/InstallBanner";
import { SetupBanner } from "@/components/SetupBanner";

const links = [
  { href: "/", label: "Home" },
  { href: "/topics", label: "Tea rooms" },
  { href: "/duties", label: "Duties" },
  { href: "/explore", label: "Map" },
] as const;

export { AppLogo } from "@/components/AppLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="app-site-header"
        className="fixed inset-x-0 top-0 z-[500] border-b border-border bg-surface shadow-sm"
      >
        <InstallBanner />
        <SetupBanner />
        <header>
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 text-[17px] font-semibold tracking-tight text-foreground"
            >
              <AppLogo heightPx={36} priority />
              <span className="truncate">SpillTheTea</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-md px-3 py-2 text-subtle transition hover:bg-brand-soft hover:text-foreground dark:hover:bg-brand-soft"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <AuthMenu />
            </div>
          </div>
        </header>
      </div>
      <HeaderSpacer />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
