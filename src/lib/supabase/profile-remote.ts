import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicUserProfile, UserProfile } from "@/lib/types/profile";
import type { PayeePaymentInfo } from "@/lib/payments/upi";

type ProfileRow = {
  display_name: string;
  avatar_url: string | null;
  chakra: number | null;
  updated_at: string;
  payment_upi: string | null;
  payment_phone: string | null;
};

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    chakra: Number(row.chakra ?? 0),
    updatedAt: new Date(row.updated_at).getTime(),
    paymentUpi: row.payment_upi?.trim() || undefined,
    paymentPhone: row.payment_phone?.trim() || undefined,
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
    .select("display_name, avatar_url, chakra, updated_at, payment_upi, payment_phone")
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
        bio: "",
        avatar_url: profile.avatarUrl ?? null,
        payment_upi: profile.paymentUpi?.trim() || null,
        payment_phone: profile.paymentPhone?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("display_name, avatar_url, chakra, updated_at, payment_upi, payment_phone")
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

export async function fetchPayeePaymentRemote(
  client: SupabaseClient,
  userId: string,
): Promise<PayeePaymentInfo> {
  const { data, error } = await client
    .from("profiles")
    .select("payment_upi, payment_phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return {
    paymentUpi: (data?.payment_upi as string | null)?.trim() || undefined,
    paymentPhone: (data?.payment_phone as string | null)?.trim() || undefined,
  };
}

/** Placeholder until the user picks an anonymous public name. */
export function emptyProfileSeed(): UserProfile {
  return {
    displayName: "anon",
    chakra: 0,
  };
}
