import type { SupabaseClient } from "@supabase/supabase-js";
import { imageContentType, isImageFile } from "@/lib/image-file";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadProfileAvatarApi(file: File): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error("Pick an image file for your profile photo.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/profile/avatar", {
    method: "POST",
    body: form,
  });

  let json: { avatarUrl?: string; error?: string } = {};
  try {
    json = (await res.json()) as { avatarUrl?: string; error?: string };
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(json.error || "Could not upload profile photo.");
  }

  if (!json.avatarUrl) {
    throw new Error("Could not upload profile photo.");
  }

  return json.avatarUrl;
}

export async function removeProfileAvatarApi(): Promise<void> {
  const res = await fetch("/api/profile/avatar", { method: "DELETE" });
  let json: { error?: string } = {};
  try {
    json = (await res.json()) as { error?: string };
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(json.error || "Could not remove profile photo.");
  }
}

/** @deprecated Prefer uploadProfileAvatarApi — uses server upload with service role. */
export async function uploadProfileAvatar(
  client: SupabaseClient,
  file: File,
  userId: string,
): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error("Pick an image file for your profile photo.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await client.storage.from("profile-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: imageContentType(file),
  });

  if (error) throw error;

  const { data } = client.storage.from("profile-avatars").getPublicUrl(path);
  return data.publicUrl;
}
