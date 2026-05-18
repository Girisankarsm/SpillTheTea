"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", shortLabel: "Home" },
  { href: "/topics", label: "Tea rooms", shortLabel: "Rooms" },
  { href: "/duties", label: "Duties", shortLabel: "Duties" },
  { href: "/rides", label: "Rides", shortLabel: "Rides" },
  { href: "/explore", label: "Map", shortLabel: "Map" },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean, desktop: boolean): string {
  const base = [
    "rounded-md font-semibold transition-all duration-200",
    desktop
      ? "shrink-0 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
      : "flex items-center justify-center px-1 py-2 text-center text-xs",
  ].join(" ");

  if (active) {
    return [
      base,
      "bg-brand text-white shadow-sm opacity-100 scale-[1.02]",
    ].join(" ");
  }

  return [
    base,
    "text-subtle opacity-40 hover:bg-brand-soft/60 hover:text-foreground hover:opacity-80",
  ].join(" ");
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
          ? "hidden items-center gap-0.5 sm:flex"
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
          </Link>
        );
      })}
    </nav>
  );
}
