import { isImageFile } from "@/lib/image-file";

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
  _client: unknown,
  file: File,
  _userId: string,
): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error("Pick an image file for your profile photo.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read profile photo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
