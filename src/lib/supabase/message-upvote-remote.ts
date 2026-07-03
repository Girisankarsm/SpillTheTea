import type { ChatMessage } from "@/lib/types";

export function applyUpvotesToMessages(
  messages: ChatMessage[],
  counts: Record<string, number>,
  mine: Record<string, boolean>,
): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    upvoteCount: counts[message.id] ?? message.upvoteCount ?? 0,
    myUpvote: mine[message.id] ?? message.myUpvote ?? false,
  }));
}

export async function fetchMessageUpvotes(..._args: unknown[]): Promise<{
  counts: Record<string, number>;
  mine: Record<string, boolean>;
}> {
  return { counts: {}, mine: {} };
}

export async function toggleMessageUpvoteRemote(..._args: unknown[]): Promise<void> {
  // TODO: back this with /api/messages/:id/upvote after message voting is moved to MongoDB.
}
