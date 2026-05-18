import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadDutyVoice(
  client: SupabaseClient,
  dutyId: string,
  blob: Blob,
): Promise<string> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to send voice messages.");

  const path = `${user.id}/${dutyId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webm`;

  const { error } = await client.storage.from("duty-voice").upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: blob.type || "audio/webm",
  });

  if (error) throw error;

  const { data } = client.storage.from("duty-voice").getPublicUrl(path);
  return data.publicUrl;
}
