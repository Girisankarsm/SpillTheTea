import Link from "next/link";
import { chakraTier } from "@/lib/chakra";

type ChakraBadgeProps = {
  chakra: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const sizeClasses = {
  sm: { ring: "h-10 w-10 text-xs", count: "text-[10px]" },
  md: { ring: "h-16 w-16 text-sm", count: "text-xs" },
  lg: { ring: "h-24 w-24 text-lg", count: "text-sm" },
} as const;

export function ChakraBadge({
  chakra,
  size = "md",
  showLabel = true,
}: ChakraBadgeProps) {
  const tier = chakraTier(chakra);
  const sizes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`relative flex ${sizes.ring} items-center justify-center rounded-full bg-gradient-to-br p-[3px] ${tier.ringClass}`}
      >
        <span className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface">
          <span className={`font-bold leading-none text-foreground ${sizes.count}`}>
            {chakra}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-subtle">
            chakra
          </span>
        </span>
      </div>
      {showLabel ? (
        <span className="text-xs font-semibold text-subtle">{tier.label}</span>
      ) : null}
    </div>
  );
}

type PersonLinkProps = {
  displayName: string;
  chakra?: number;
  href: string | null;
  className?: string;
};

export function PersonLink({
  displayName,
  chakra,
  href,
  className = "",
}: PersonLinkProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="font-bold text-foreground">{displayName}</span>
      {chakra != null ? (
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
          {chakra} chakra
        </span>
      ) : null}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="hover:underline">
      {inner}
    </Link>
  );
}
