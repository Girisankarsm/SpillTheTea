import type { SupabaseClient } from "@supabase/supabase-js";
import type { DutyChatMessageType } from "@/lib/types/duty-chat";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

export function classifyDutyAttachment(file: File): DutyChatMessageType {
  if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
    return "gif";
  }
  if (IMAGE_TYPES.has(file.type) || file.type.startsWith("image/")) {
    return "image";
  }
  return "file";
}

export function validateDutyAttachment(file: File): void {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File is too large — max 10 MB.");
  }

  const kind = classifyDutyAttachment(file);
  if (kind === "file" && !FILE_TYPES.has(file.type) && file.type !== "") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = new Set(["pdf", "doc", "docx", "txt", "zip"]);
    if (!ext || !allowedExt.has(ext)) {
      throw new Error("Use images, GIFs, PDF, DOC, TXT, or ZIP.");
    }
  }
}

export async function uploadDutyAttachment(
  client: SupabaseClient,
  dutyId: string,
  file: File,
): Promise<{ url: string; messageType: DutyChatMessageType; fileName: string }> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to send attachments.");

  validateDutyAttachment(file);

  const messageType = classifyDutyAttachment(file);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${user.id}/${dutyId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await client.storage.from("duty-attachments").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = client.storage.from("duty-attachments").getPublicUrl(path);
  return { url: data.publicUrl, messageType, fileName: file.name };
}

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
