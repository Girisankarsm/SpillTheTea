import { isAuthenticatedUser } from "@/lib/supabase/session";

/** Match sign-up and login; avoids "wrong password" confusion from casing. */
export function normalizeEmailForAuth(email: string): string {
  return email.trim().toLowerCase();
}

export function authCallbackUrl(nextPath = "/topics"): string {
  if (typeof window === "undefined") return "/api/auth/verify";
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${window.location.origin}/api/auth/verify?next=${encodeURIComponent(next)}`;
}

async function postAuth<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    return { data: null, error: new Error(data.error || "Authentication request failed.") };
  }
  return { data, error: null };
}

function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("spill-auth-changed"));
  }
}

export async function signInWithGoogle(..._args: unknown[]): Promise<{ error: Error | null }> {
  return {
    error: new Error("Google sign-in is not enabled on the MongoDB auth backend yet. Use email and password."),
  };
}

export async function signInWithEmail(
  _client: unknown,
  email: string,
  password: string,
): Promise<{ error: Error | null }> {
  const normalized = normalizeEmailForAuth(email);
  const { error } = await postAuth("/api/auth/login", {
    email: normalized,
    password,
  });
  if (error) return { error };
  notifyAuthChanged();
  return { error: null };
}

/** Magic link / OTP email — user completes sign-in from inbox link. */
export async function signInWithMagicLink(
  _client: unknown,
  email: string,
  _nextPath = "/topics",
): Promise<{ error: Error | null }> {
  const normalized = normalizeEmailForAuth(email);
  const { error } = await postAuth("/api/auth/magic", {
    email: normalized,
  });
  if (error) return { error };
  return { error: null };
}

export async function signUpWithEmail(
  _client: unknown,
  email: string,
  password: string,
): Promise<{ error: Error | null; needsEmailConfirmation: boolean }> {
  const normalized = normalizeEmailForAuth(email);
  const { data, error } = await postAuth<{ pendingVerification: boolean }>(
    "/api/auth/register",
    {
      email: normalized,
      password,
      legalAccepted: true,
    },
  );
  if (error) return { error, needsEmailConfirmation: false };
  return { error: null, needsEmailConfirmation: data?.pendingVerification ?? true };
}

export async function resendSignupConfirmationEmail(
  _client: unknown,
  email: string,
): Promise<{ error: Error | null }> {
  const normalized = normalizeEmailForAuth(email);
  const { error } = await postAuth("/api/auth/resend-verification", {
    email: normalized,
  });
  if (error) return { error };
  return { error: null };
}

export async function signOutUser(_client?: unknown): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  notifyAuthChanged();
}

/** @deprecated Use signOutUser — anonymous sessions are no longer used. */
export async function signOutAndContinueAnonymous(
  client?: unknown,
): Promise<void> {
  await signOutUser(client);
}

export function isGoogleSignedIn(session: {
  user: { is_anonymous?: boolean; app_metadata?: { provider?: string } };
} | null): boolean {
  return isAuthenticatedUser(session?.user ?? null);
}

export function googleProfile(session: {
  user: {
    is_anonymous?: boolean;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
      picture?: string;
    };
  };
} | null): { name: string; email: string | null; avatarUrl: string | null } | null {
  if (!session?.user || session.user.is_anonymous) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "You",
    email: session.user.email ?? null,
    avatarUrl: meta.avatar_url || meta.picture || null,
  };
}
