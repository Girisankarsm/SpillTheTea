import type { TopicPreview } from "@/lib/tea-feed";
import type { ChatMessage, SendMessageInput, Topic } from "@/lib/types";

type FeedResponse = {
  topics: Topic[];
  topicActivity: Record<string, number>;
  topicJoinCounts: Record<string, number>;
};

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function fetchExploreFeeds(_client?: unknown): Promise<FeedResponse> {
  return jsonFetch<FeedResponse>("/api/topics");
}

export function rankTopicsByMessages(
  topics: Topic[],
  topicActivity: Record<string, number>,
): Topic[] {
  return [...topics].sort(
    (a, b) => (topicActivity[b.id] ?? 0) - (topicActivity[a.id] ?? 0),
  );
}

export async function fetchTopicPreviewsRemote(
  _client: unknown,
  topicIds: string[],
): Promise<Record<string, TopicPreview>> {
  if (topicIds.length === 0) return {};
  const data = await jsonFetch<{ previews: Record<string, TopicPreview> }>(
    "/api/topics/previews",
    {
      method: "POST",
      body: JSON.stringify({ topicIds }),
    },
  );
  return data.previews;
}

export async function createTopicRemote(
  _client: unknown,
  input: { title: string; lat: number; lng: number },
): Promise<string> {
  const data = await jsonFetch<{ id: string }>("/api/topics", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.id;
}

export async function deleteTopicRemote(
  _client: unknown,
  topicId: string,
): Promise<void> {
  await jsonFetch(`/api/topics/${encodeURIComponent(topicId)}`, {
    method: "DELETE",
  });
}

export async function fetchTopicMessages(
  _client: unknown,
  topicId: string,
): Promise<ChatMessage[]> {
  const data = await jsonFetch<{ messages: ChatMessage[] }>(
    `/api/topics/${encodeURIComponent(topicId)}/messages`,
  );
  return data.messages;
}

export async function fetchTopicMeta(
  _client: unknown,
  topicId: string,
): Promise<{
  topic: Topic;
  messageCount: number;
  joinCount: number;
} | null> {
  const feed = await fetchExploreFeeds();
  const topic = feed.topics.find((item) => item.id === topicId);
  if (!topic) return null;
  return {
    topic,
    messageCount: feed.topicActivity[topicId] ?? 0,
    joinCount: feed.topicJoinCounts[topicId] ?? 0,
  };
}

export async function fetchLockedRoomDisplayName(..._args: unknown[]): Promise<string | null> {
  return null;
}

export async function sendMessageRemote(
  _client: unknown,
  input: SendMessageInput,
): Promise<string> {
  const data = await jsonFetch<{ id: string }>(
    `/api/topics/${encodeURIComponent(input.topicId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.id;
}

export async function joinTopicRoomRemote(..._args: unknown[]): Promise<void> {
  // Membership is created when a Mongo-backed topic is created. Explicit joins can be added later.
}

export async function userJoinedTopicRemote(..._args: unknown[]): Promise<boolean> {
  return true;
}

export async function getCurrentUserId(): Promise<string | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { user?: { id: string } | null };
  return data.user?.id ?? null;
}
