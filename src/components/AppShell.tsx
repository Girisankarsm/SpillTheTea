import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { AuthMenu } from "@/components/AuthMenu";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { InstallBanner } from "@/components/InstallBanner";
import { SetupBanner } from "@/components/SetupBanner";

const links = [
  { href: "/", label: "Home", shortLabel: "Home" },
  { href: "/topics", label: "Tea rooms", shortLabel: "Rooms" },
  { href: "/duties", label: "Duties", shortLabel: "Duties" },
  { href: "/explore", label: "Map", shortLabel: "Map" },
] as const;

export { AppLogo } from "@/components/AppLogo";

const navLinkClass =
  "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold text-subtle transition hover:bg-brand-soft hover:text-foreground sm:px-3 sm:py-2 sm:text-sm";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="app-site-header"
        className="fixed inset-x-0 top-0 z-[500] border-b border-border bg-surface shadow-sm"
      >
        <InstallBanner />
        <SetupBanner />
        <header className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex h-12 items-center justify-between gap-3 sm:h-14">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground"
            >
              <AppLogo heightPx={32} priority className="sm:h-9 sm:w-9" />
              <span className="hidden truncate sm:inline">SpillTheTea</span>
            </Link>

            <nav
              className="hidden items-center gap-0.5 sm:flex"
              aria-label="Main navigation"
            >
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={navLinkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <AuthMenu />
          </div>

          <nav
            className="flex gap-0.5 overflow-x-auto border-t border-border py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
            aria-label="Main navigation"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkClass}>
                {l.shortLabel}
              </Link>
            ))}
          </nav>
        </header>
      </div>
      <HeaderSpacer />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
