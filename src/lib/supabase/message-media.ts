import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaTypeFromUrl } from "@/lib/message-thread";

export async function uploadMessageMedia(
  client: SupabaseClient,
  file: File,
  topicId: string,
): Promise<{ url: string; mediaType: "image" | "gif" }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${topicId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

  const { error } = await client.storage.from("tea-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = client.storage.from("tea-media").getPublicUrl(path);
  const mediaType =
    file.type === "image/gif" || safeExt === "gif" ? "gif" : "image";

  return { url: data.publicUrl, mediaType };
}

export function normalizeMediaUrlInput(raw: string): {
  url: string;
  mediaType: "image" | "gif";
} | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url, mediaType: mediaTypeFromUrl(url) };
}
