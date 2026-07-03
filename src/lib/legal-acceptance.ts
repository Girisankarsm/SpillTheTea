/** Bump when Terms or Privacy Policy change materially — users must re-accept. */
export const LEGAL_ACCEPTANCE_VERSION = "2026-05-19";
export const LEGAL_ACCEPT_COOKIE = "stt_legal_accept";

export function setLegalAcceptanceCookie(): void {
  if (typeof document === "undefined") return;
  /** Long enough that “confirm email” clicks still pass the legal gate after signup. */
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LEGAL_ACCEPT_COOKIE}=${LEGAL_ACCEPTANCE_VERSION}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function clearLegalAcceptanceCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LEGAL_ACCEPT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasValidLegalAcceptanceCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${LEGAL_ACCEPT_COOKIE}=([^;]+)`),
  );
  return match?.[1] === LEGAL_ACCEPTANCE_VERSION;
}
