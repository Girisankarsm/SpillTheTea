export type PushMessageKind = "duty_chat" | "ride_chat" | "dm";

export function chatMessagePreview(
  body: string,
  messageType?: string,
): string {
  switch (messageType) {
    case "voice":
      return "Voice message";
    case "image":
      return "Image";
    case "gif":
      return "GIF";
    case "file":
      return "File attachment";
    default:
      return body.trim().slice(0, 120) || "New message";
  }
}

export async function notifyMessageRecipient(payload: {
  kind: PushMessageKind;
  messageId: string;
}): Promise<void> {
  try {
    await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* push is best-effort */
  }
}

export function maybeShowLocalMessageNotification(opts: {
  title: string;
  body: string;
  url: string;
  senderId: string;
  currentUserId: string;
}): void {
  if (opts.senderId === opts.currentUserId) return;
  if (typeof document === "undefined" || document.visibilityState === "visible") {
    return;
  }
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(opts.title, {
      body: opts.body,
      icon: "/icon.png",
      tag: opts.url,
    });
  } catch {
    /* ignore */
  }
}
