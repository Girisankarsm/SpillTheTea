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

type MainNavProps = {
  variant: "desktop" | "mobile";
};

export function MainNav({ variant }: MainNavProps) {
  const pathname = usePathname();

  if (variant === "desktop") {
    return (
      <nav
        className="hidden items-center gap-0.5 sm:flex"
        aria-label="Main navigation"
      >
        {links.map((link) => {
          const active = isNavActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 sm:text-sm",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-subtle hover:bg-brand-soft hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="grid grid-cols-5 gap-0.5 border-t border-border px-1 py-1.5 sm:hidden"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active = isNavActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "flex items-center justify-center rounded-md px-1 py-2 text-center text-xs font-semibold transition",
              active
                ? "bg-brand-soft text-brand"
                : "text-subtle hover:bg-brand-soft hover:text-foreground",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {link.shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
