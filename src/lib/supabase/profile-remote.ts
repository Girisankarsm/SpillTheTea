import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicUserProfile, UserProfile } from "@/lib/types/profile";

type ProfileRow = {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  chakra: number | null;
  updated_at: string;
};

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    displayName: row.display_name,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    chakra: Number(row.chakra ?? 0),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function rowToPublic(row: Pick<ProfileRow, "display_name" | "chakra">): PublicUserProfile {
  return {
    displayName: row.display_name,
    chakra: Number(row.chakra ?? 0),
  };
}

export async function fetchProfileRemote(
  client: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("display_name, bio, avatar_url, chakra, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function fetchPublicProfileRemote(
  client: SupabaseClient,
  userId: string,
): Promise<PublicUserProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("display_name, chakra")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToPublic(data as ProfileRow);
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
    .select("display_name, bio, avatar_url, chakra, updated_at")
    .single();

  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export async function awardChakraRemote(
  client: SupabaseClient,
  userId: string,
  points: number,
): Promise<void> {
  const { error } = await client.rpc("award_duty_chakra", {
    p_user_id: userId,
    p_points: points,
  });
  if (error) throw error;
}

/** Placeholder until the user picks an anonymous public name. */
export function emptyProfileSeed(): UserProfile {
  return {
    displayName: "anon",
    bio: "",
    chakra: 0,
  };
}
