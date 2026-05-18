import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/profile";
import { googleProfile } from "@/lib/supabase/auth";

type ProfileRow = {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  updated_at: string;
};

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    displayName: row.display_name,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function fetchProfileRemote(
  client: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("display_name, bio, avatar_url, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function upsertProfileRemote(
  client: SupabaseClient,
  userId: string,
  profile: UserProfile,
): Promise<UserProfile> {
  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        display_name: profile.displayName.trim(),
        bio: profile.bio.trim(),
        avatar_url: profile.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("display_name, bio, avatar_url, updated_at")
    .single();

  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export function profileFromGoogleSession(session: {
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
} | null): UserProfile | null {
  const google = googleProfile(session);
  if (!google) return null;
  return {
    displayName: google.name,
    bio: "",
    avatarUrl: google.avatarUrl ?? undefined,
  };
}
