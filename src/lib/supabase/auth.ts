import type { SupabaseClient } from "@supabase/supabase-js";

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

  // linkIdentity() needs "Manual linking" enabled in Supabase. Plain OAuth works everywhere.
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

export async function signOutAndContinueAnonymous(
  client: SupabaseClient,
): Promise<void> {
  await client.auth.signOut();
  await client.auth.signInAnonymously();
}

export function isGoogleSignedIn(session: {
  user: { is_anonymous?: boolean; app_metadata?: { provider?: string } };
} | null): boolean {
  if (!session?.user) return false;
  if (session.user.is_anonymous) return false;
  return true;
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
