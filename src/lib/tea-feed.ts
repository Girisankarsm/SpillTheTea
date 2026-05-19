import type { ChatMessage, Topic } from "@/lib/types";
import type { TopicSort } from "@/lib/message-upvotes";

export type TopicPreview = {
  authorName: string;
  body: string;
  mediaUrl?: string;
  mediaType?: "image" | "gif";
};

export function sortTopicsForFeed(
  topics: Topic[],
  topicActivity: Record<string, number>,
  sort: TopicSort,
): Topic[] {
  if (sort === "new") {
    return [...topics].sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...topics].sort(
    (a, b) => (topicActivity[b.id] ?? 0) - (topicActivity[a.id] ?? 0),
  );
}

export function buildLocalTopicPreviews(
  messages: ChatMessage[],
  topicIds: string[],
): Record<string, TopicPreview> {
  const out: Record<string, TopicPreview> = {};
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
  for (const topicId of topicIds) {
    const first = sorted.find((m) => m.topicId === topicId);
    if (!first) continue;
    out[topicId] = {
      authorName: first.authorName,
      body: first.body,
      mediaUrl: first.mediaUrl,
      mediaType: first.mediaType,
    };
  }
  return out;
}

export function truncatePreview(text: string, max = 280): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
