import Link from "next/link";
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal";

type LegalFooterLinksProps = {
  className?: string;
  centered?: boolean;
};

export function LegalFooterLinks({
  className = "",
  centered = false,
}: LegalFooterLinksProps) {
  return (
    <nav
      className={[
        "flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle",
        centered ? "justify-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Legal"
    >
      <Link href={PRIVACY_POLICY_PATH} className="font-semibold hover:text-brand hover:underline">
        Privacy Policy
      </Link>
      <Link href={TERMS_OF_SERVICE_PATH} className="font-semibold hover:text-brand hover:underline">
        Terms of Service
      </Link>
    </nav>
  );
}
