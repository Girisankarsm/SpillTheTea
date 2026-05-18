import Image from "next/image";

const LOGO_SRC = "/spillthetea-logo.png";
const LOGO_SIZE = 1024;

type AppLogoProps = {
  /** Approximate rendered height in CSS px */
  heightPx?: number;
  /** Extra classes on the wrapper */
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  heightPx = 36,
  className = "",
  priority = false,
}: AppLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ height: heightPx, width: heightPx }}
    >
      <Image
        src={LOGO_SRC}
        alt="SpillTheTea"
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        priority={priority}
        sizes={`${heightPx}px`}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
