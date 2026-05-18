"use client";

import Link from "next/link";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { publicPersonPath } from "@/lib/chakra";

type PublicPersonNameProps = {
  userId?: string;
  visitorId?: string;
  fallbackName: string;
};

export function PublicPersonName({
  userId,
  visitorId,
  fallbackName,
}: PublicPersonNameProps) {
  const { displayName, chakra, loading } = usePublicProfile({
    userId,
    visitorId,
    fallbackName,
  });
  const href = publicPersonPath(userId, visitorId);

  const label = (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-bold text-foreground">
        {loading ? fallbackName : displayName}
      </span>
      {!loading ? (
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
          {chakra} chakra
        </span>
      ) : null}
    </span>
  );

  if (!href) return label;

  return (
    <Link href={href} className="hover:underline">
      {label}
    </Link>
  );
}
