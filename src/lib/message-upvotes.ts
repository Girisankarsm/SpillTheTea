import type { ChatMessage } from "@/lib/types";

export type TopicSort = "hot" | "new";

export function applyLocalUpvotesToMessages(
  messages: ChatMessage[],
  messageUpvotes: Record<string, string>,
  voterKey: string | null,
): ChatMessage[] {
  const counts = new Map<string, number>();
  const myUpvotes = new Set<string>();

  for (const [key] of Object.entries(messageUpvotes)) {
    const [messageId, keyVoter] = key.split("::");
    if (!messageId) continue;
    counts.set(messageId, (counts.get(messageId) ?? 0) + 1);
    if (voterKey && keyVoter === voterKey) {
      myUpvotes.add(messageId);
    }
  }

  return messages.map((message) => ({
    ...message,
    upvoteCount: counts.get(message.id) ?? 0,
    myUpvote: myUpvotes.has(message.id),
  }));
}

export function hotScore(
  upvoteCount: number,
  replyCount: number,
  createdAt: number,
  now = Date.now(),
): number {
  const ageHours = Math.max(0.5, (now - createdAt) / 3_600_000);
  const points = upvoteCount + replyCount * 0.3;
  return points / ageHours ** 1.2;
}

export function pollHotScore(voteCount: number, createdAt: number, now = Date.now()): number {
  const ageHours = Math.max(0.5, (now - createdAt) / 3_600_000);
  return voteCount / ageHours ** 1.2;
}
