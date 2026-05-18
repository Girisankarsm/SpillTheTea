import Image from "next/image";
import Link from "next/link";
import { AuthMenu } from "@/components/AuthMenu";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { SetupBanner } from "@/components/SetupBanner";

const LOGO_SRC = "/spillthetea-logo.png";
const LOGO_SIZE = 1024;

type AppLogoProps = {
  /** Approximate rendered height in CSS px */
  heightPx?: number;
  /** Extra classes on the wrapper */
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  heightPx = 36,
  className = "",
  priority = false,
}: AppLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ height: heightPx, width: heightPx }}
    >
      <Image
        src={LOGO_SRC}
        alt="SpillTheTea"
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        priority={priority}
        sizes={`${heightPx}px`}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

const links = [
  { href: "/", label: "Home" },
  { href: "/topics", label: "Tea rooms" },
  { href: "/duties", label: "Duties" },
  { href: "/explore", label: "Map" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="app-site-header"
        className="fixed inset-x-0 top-0 z-[500] border-b border-border bg-surface shadow-sm"
      >
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
