"use client";

import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import { isGoogleSignedIn } from "@/lib/supabase/auth";

type LandingAuthLinkProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  signedInLabel?: string;
  signedInHref?: string;
};

export function LandingAuthLink({
  href = "/login",
  className = "",
  children,
  signedInLabel = "Open app →",
  signedInHref = "/topics",
}: LandingAuthLinkProps) {
  const { session, authReady } = useSupabase();
  const signedIn = authReady && isGoogleSignedIn(session);
  const target = signedIn ? signedInHref : href;

  return (
    <Link href={target} className={className}>
      {signedIn ? signedInLabel : children}
    </Link>
  );
}
