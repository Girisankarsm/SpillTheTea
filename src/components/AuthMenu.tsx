"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  googleProfile,
  isGoogleSignedIn,
  signOutUser,
} from "@/lib/backend/auth";

export function AuthMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { backend, session, authReady, configured } = useBackend();
  const { profile, defaultDisplayName } = useUserProfile();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!configured || !backend) return null;

  const signedIn = isGoogleSignedIn(session);
  const google = googleProfile(session);
  const showName = defaultDisplayName || "You";
  const avatarUrl = profile.avatarUrl?.trim() || null;

  const loginHref =
    pathname && pathname !== "/login"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  async function handleSignOut() {
    if (!backend || busy) return;
    setMenuOpen(false);
    setBusy(true);
    try {
      await signOutUser(backend);
      router.replace("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return (
      <span className="hidden text-xs text-subtle sm:inline">…</span>
    );
  }

  if (signedIn) {
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          title="Your profile"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-brand-border bg-brand-soft shadow-[0_0_12px_var(--brand-glow)] transition hover:border-brand-bright hover:ring-2 hover:ring-brand/30"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-foreground">
              {showName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-[600] w-52 rounded-xl border border-border bg-surface p-3 shadow-lg"
          >
            <p className="truncate text-sm font-bold text-foreground">{showName}</p>
            {google?.email ? (
              <p className="mt-0.5 truncate text-xs text-subtle">{google.email}</p>
            ) : null}
            <div className="mt-3 flex flex-col gap-1.5">
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-brand-soft px-3 py-1.5 text-center text-xs font-bold text-brand hover:opacity-90"
              >
                Edit profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                disabled={busy}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-background disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={loginHref}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition hover:border-brand-border hover:bg-surface-hover"
    >
      <span aria-hidden className="text-sm">✉️</span>
      <span>Sign in</span>
    </Link>
  );
}
