import { mediaTypeFromUrl } from "@/lib/message-thread";

export async function uploadMessageMedia(
  _client: unknown,
  file: File,
  _topicId: string,
): Promise<{ url: string; mediaType: "image" | "gif" }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read media file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const mediaType =
    file.type === "image/gif" || safeExt === "gif" ? "gif" : "image";

  return { url, mediaType };
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
