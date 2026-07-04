import type { RideChatMessageType } from "@/lib/types/ride-chat";

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

export function classifyRideAttachment(file: File): RideChatMessageType {
  if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
    return "gif";
  }
  if (IMAGE_TYPES.has(file.type) || file.type.startsWith("image/")) {
    return "image";
  }
  return "file";
}

export function validateRideAttachment(file: File): void {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File is too large — max 10 MB.");
  }

  const kind = classifyRideAttachment(file);
  if (kind === "file" && !FILE_TYPES.has(file.type) && file.type !== "") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = new Set(["pdf", "doc", "docx", "txt", "zip"]);
    if (!ext || !allowedExt.has(ext)) {
      throw new Error("Use images, GIFs, PDF, DOC, TXT, or ZIP.");
    }
  }
}

export async function uploadRideAttachment(
  _client: unknown,
  _rideId: string,
  file: File,
): Promise<{ url: string; messageType: RideChatMessageType; fileName: string }> {
  validateRideAttachment(file);

  const messageType = classifyRideAttachment(file);
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read attachment."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  return { url, messageType, fileName: file.name };
}

export async function uploadRideVoice(
  _client: unknown,
  _rideId: string,
  blob: Blob,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read voice message."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
