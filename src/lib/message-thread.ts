import type { ChatMessage } from "@/lib/types";

export type ThreadNode = {
  message: ChatMessage;
  replies: ThreadNode[];
};

export function buildMessageThread(messages: ChatMessage[]): ThreadNode[] {
  const byId = new Map<string, ThreadNode>();
  const roots: ThreadNode[] = [];

  for (const message of messages) {
    byId.set(message.id, { message, replies: [] });
  }

  for (const message of messages) {
    const node = byId.get(message.id);
    if (!node) continue;

    if (message.replyToId && byId.has(message.replyToId)) {
      byId.get(message.replyToId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: ThreadNode[]) => {
    nodes.sort((a, b) => a.message.createdAt - b.message.createdAt);
    for (const node of nodes) sortNodes(node.replies);
  };

  sortNodes(roots);
  return roots;
}

export function countReplies(messages: ChatMessage[], messageId: string): number {
  return messages.filter((m) => m.replyToId === messageId).length;
}

const GIF_HOSTS = ["giphy.com", "tenor.com", "media.tenor.com"];

export function mediaTypeFromUrl(url: string): "gif" | "image" {
  const lower = url.toLowerCase();
  if (lower.endsWith(".gif") || GIF_HOSTS.some((h) => lower.includes(h))) {
    return "gif";
  }
  return "image";
}

export function isAllowedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
