import type { SupabaseClient } from "@supabase/supabase-js";
import { isAuthenticatedUser } from "@/lib/supabase/session";

export function authCallbackUrl(nextPath = "/"): string {
  if (typeof window === "undefined") return "/auth/callback";
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithGoogle(
  client: SupabaseClient,
  nextPath = "/",
): Promise<{ error: Error | null }> {
  const redirectTo = authCallbackUrl(nextPath);

  const {
    data: { session },
  } = await client.auth.getSession();

  // Google OAuth replaces any stale anonymous session from older app versions.
  if (session?.user?.is_anonymous) {
    await client.auth.signOut();
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) return { error: new Error(error.message) };
  if (data.url) window.location.assign(data.url);
  return { error: null };
}

export async function signOutUser(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

/** @deprecated Use signOutUser — anonymous sessions are no longer used. */
export async function signOutAndContinueAnonymous(
  client: SupabaseClient,
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
