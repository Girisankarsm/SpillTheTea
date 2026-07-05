"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/topics", label: "Home", icon: "🏠" },
  { href: "/topics/tea", label: "Tea", icon: "💬", showDot: true },
  { href: "/duties", label: "Duties", icon: "✅" },
  { href: "/rides", label: "Rides", icon: "🚗" },
  { href: "/explore", label: "Map", icon: "🗺️" },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/topics/tea") {
    return pathname === "/topics/tea" || pathname.startsWith("/topics/tea/");
  }
  if (href === "/topics") {
    return pathname === "/topics" || (pathname.startsWith("/topics/") && !pathname.startsWith("/topics/tea"));
  }
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type MainNavProps = {
  variant: "desktop" | "mobile";
};

export function MainNav({ variant }: MainNavProps) {
  const pathname = usePathname();
  const desktop = variant === "desktop";

  if (!desktop) return null;

  return (
    <nav
      className="hidden flex-1 items-center gap-0.5 sm:flex"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active = isNavActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13.5px] font-normal transition-all duration-200",
              active
                ? "bg-white font-medium text-black shadow-[0_2px_14px_rgba(255,255,255,0.2)]"
                : "text-subtle hover:bg-surface hover:text-foreground",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
            {link.showDot ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed bottom navigation for mobile — thumb-friendly. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[500] border-t border-border bg-[rgba(8,8,8,0.92)] backdrop-blur-[28px] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 py-1.5">
        {links.map((link) => {
          const active = isNavActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-all duration-200",
                active
                  ? "bg-white/10 text-foreground"
                  : "text-subtle hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-[17px] leading-none" aria-hidden>
                {link.icon}
              </span>
              <span className={["text-[10px] leading-tight", active ? "font-semibold" : "font-medium"].join(" ")}>
                {link.label}
              </span>
              {active ? (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-white" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
