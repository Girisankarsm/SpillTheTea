/** Canonical production URL (also set NEXT_PUBLIC_APP_URL in Vercel). */
export const PRODUCTION_APP_URL = "https://spilltheteahere.vercel.app";

export function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || PRODUCTION_APP_URL;
}
