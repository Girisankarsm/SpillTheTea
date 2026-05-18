"use client";

import Link from "next/link";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { publicPersonPath } from "@/lib/chakra";

type DutyPersonLabelProps = {
  name: string;
  userId?: string;
  visitorId?: string;
};

/** Always shows the duty posting alias; chakra comes from the linked profile. */
export function DutyPersonLabel({ name, userId, visitorId }: DutyPersonLabelProps) {
  const { chakra, loading } = usePublicProfile({
    userId,
    visitorId,
    fallbackName: name,
  });
  const href = publicPersonPath(userId, visitorId);

  const label = (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-bold text-foreground">{name}</span>
      {!loading && (userId || visitorId) ? (
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
