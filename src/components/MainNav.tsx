"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/topics", label: "Home", shortLabel: "Home", showDot: false },
  { href: "/topics/tea", label: "Tea", shortLabel: "Tea", showDot: true },
  { href: "/duties", label: "Duties", shortLabel: "Duties", showDot: false },
  { href: "/rides", label: "Rides", shortLabel: "Rides", showDot: false },
  { href: "/explore", label: "Map", shortLabel: "Map", showDot: false },
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

function navLinkClass(active: boolean, desktop: boolean): string {
  const base = [
    "rounded-lg font-normal transition-all duration-200",
    desktop
      ? "flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-[13.5px]"
      : "flex items-center justify-center gap-1 px-1 py-2 text-center text-xs",
  ].join(" ");

  if (active) {
    return [
      base,
      "bg-white font-medium text-black shadow-[0_2px_14px_rgba(255,255,255,0.2)]",
    ].join(" ");
  }

  return [base, "text-subtle hover:bg-surface hover:text-foreground"].join(" ");
}

type MainNavProps = {
  variant: "desktop" | "mobile";
};

export function MainNav({ variant }: MainNavProps) {
  const pathname = usePathname();
  const desktop = variant === "desktop";

  return (
    <nav
      className={
        desktop
          ? "hidden flex-1 items-center gap-0.5 sm:flex"
          : "grid grid-cols-5 gap-0.5 border-t border-border px-1 py-1.5 sm:hidden"
      }
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active = isNavActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={navLinkClass(active, desktop)}
            aria-current={active ? "page" : undefined}
          >
            {desktop ? link.label : link.shortLabel}
            {link.showDot && desktop ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
