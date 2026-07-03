import type { PublicUserProfile, UserProfile } from "@/lib/types/profile";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function fetchProfileRemote(..._args: unknown[]): Promise<UserProfile | null> {
  const data = await jsonFetch<{ profile: UserProfile | null }>("/api/profile");
  return data.profile;
}

export async function fetchPublicProfileRemote(
  _client: unknown,
  userId: string,
): Promise<PublicUserProfile | null> {
  const data = await jsonFetch<{ profile: PublicUserProfile }>(
    `/api/profile/public/${encodeURIComponent(userId)}`,
  );
  return data.profile;
}

export async function upsertProfileRemote(
  _client: unknown,
  _userId: string,
  profile: UserProfile,
): Promise<UserProfile> {
  const data = await jsonFetch<{ profile: UserProfile }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return data.profile;
}

export async function awardChakraRemote(..._args: unknown[]): Promise<void> {
  console.warn("Mongo chakra award flow is not implemented yet.");
}

export async function fetchPayeePaymentRemote(..._args: unknown[]): Promise<{
  paymentUpi?: string;
  paymentPhone?: string;
} | null> {
  return null;
}

export function emptyProfileSeed(): UserProfile {
  return {
    displayName: "anon",
    chakra: 0,
  };
}
