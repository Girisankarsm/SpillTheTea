import type { SupabaseClient } from "@supabase/supabase-js";
import { canDeleteTopic } from "@/lib/admin";
import type { ChatMessage, SendMessageInput, Topic } from "@/lib/types";

type TopicFeedRow = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  created_at: string;
  created_by: string | null;
  message_count: number | string;
  join_count: number | string;
};

export async function fetchExploreFeeds(client: SupabaseClient) {
  const { data, error } = await client.rpc("list_topics_feed");
  if (error) throw error;

  const topicRows = (data ?? []) as TopicFeedRow[];
  const topics: Topic[] = topicRows.map((row) => ({
    id: row.id,
    title: row.title,
    lat: row.lat,
    lng: row.lng,
    createdAt: new Date(row.created_at).getTime(),
    createdByUserId: row.created_by ?? undefined,
  }));

  const topicActivity: Record<string, number> = {};
  const topicJoinCounts: Record<string, number> = {};
  for (const row of topicRows) {
    topicActivity[row.id] = Number(row.message_count);
    topicJoinCounts[row.id] = Number(row.join_count);
  }

  return { topics, topicActivity, topicJoinCounts };
}

export function rankTopicsByMessages(
  topics: Topic[],
  topicActivity: Record<string, number>,
): Topic[] {
  return [...topics].sort(
    (a, b) => (topicActivity[b.id] ?? 0) - (topicActivity[a.id] ?? 0),
  );
}

export async function createTopicRemote(
  client: SupabaseClient,
  input: { title: string; lat: number; lng: number },
): Promise<string> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const { data: topicRow, error: tErr } = await client
    .from("topics")
    .insert({
      title: input.title.trim(),
      lat: input.lat,
      lng: input.lng,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (tErr || !topicRow) throw tErr ?? new Error("Topic insert failed");

  const topicId = topicRow.id as string;

  const { error: mErr } = await client.from("topic_members").insert({
    topic_id: topicId,
    user_id: user.id,
  });
  if (mErr && mErr.code !== "23505") throw mErr;

  return topicId;
}

export async function deleteTopicRemote(
  client: SupabaseClient,
  topicId: string,
): Promise<void> {
  const userId = await getCurrentUserId(client);
  if (!userId) throw new Error("Not signed in");

  const meta = await fetchTopicMeta(client, topicId);
  if (!meta) throw new Error("Room not found");

  if (!canDeleteTopic(meta.topic, { visitorId: null, userId })) {
    throw new Error("Only the person who started this room (or the app admin) can close it.");
  }

  const { data, error } = await client
    .from("topics")
    .delete()
    .eq("id", topicId)
    .select("id");

  if (error) throw error;
  if (!data?.length) {
    throw new Error("Only the person who started this room (or the app admin) can close it.");
  }
}

export async function fetchTopicMessages(
  client: SupabaseClient,
  topicId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await client
    .from("messages")
    .select(
      "id, topic_id, author_name, body, created_at, reply_to_id, media_url, media_type, user_id",
    )
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapMessageRow);
}

function mapMessageRow(row: {
  id: string;
  topic_id: string;
  author_name: string;
  body: string;
  created_at: string;
  reply_to_id?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  user_id?: string | null;
}): ChatMessage {
  const mediaType =
    row.media_type === "gif" || row.media_type === "image"
      ? row.media_type
      : undefined;

  return {
    id: row.id as string,
    topicId: row.topic_id as string,
    authorName: (row.author_name as string) || "Guest",
    body: row.body as string,
    createdAt: new Date(row.created_at as string).getTime(),
    authorUserId: (row.user_id as string | null) ?? undefined,
    replyToId: (row.reply_to_id as string | null) ?? undefined,
    mediaUrl: (row.media_url as string | null) ?? undefined,
    mediaType,
  };
}

export async function fetchTopicMeta(
  client: SupabaseClient,
  topicId: string,
): Promise<{
  topic: Topic;
  messageCount: number;
  joinCount: number;
} | null> {
  const { data: t, error: te } = await client
    .from("topics")
    .select("id, title, lat, lng, created_at, created_by")
    .eq("id", topicId)
    .maybeSingle();

  if (te || !t) return null;

  const [{ count: mc }, { count: jc }] = await Promise.all([
    client
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topicId),
    client
      .from("topic_members")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topicId),
  ]);

  const topic: Topic = {
    id: t.id as string,
    title: t.title as string,
    lat: t.lat as number,
    lng: t.lng as number,
    createdAt: new Date(t.created_at as string).getTime(),
    createdByUserId: (t.created_by as string | null) ?? undefined,
  };

  return {
    topic,
    messageCount: mc ?? 0,
    joinCount: jc ?? 0,
  };
}

export async function fetchLockedRoomDisplayName(
  client: SupabaseClient,
  topicId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("messages")
    .select("author_name")
    .eq("topic_id", topicId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  const name = (row.author_name as string)?.trim();
  return name || null;
}

export async function sendMessageRemote(
  client: SupabaseClient,
  input: SendMessageInput,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const trimmedBody = input.body.trim();
  if (!trimmedBody && !input.mediaUrl) {
    throw new Error("Add text or media before posting.");
  }

  const lockedName = await fetchLockedRoomDisplayName(
    client,
    input.topicId,
    user.id,
  );
  const authorName = lockedName ?? (input.authorName.trim() || "anon");

  const { error: msgErr } = await client.from("messages").insert({
    topic_id: input.topicId,
    author_name: authorName,
    body: trimmedBody,
    user_id: user.id,
    reply_to_id: input.replyToId ?? null,
    media_url: input.mediaUrl ?? null,
    media_type: input.mediaType ?? null,
  });
  if (msgErr) throw msgErr;

  const { error: memErr } = await client.from("topic_members").insert({
    topic_id: input.topicId,
    user_id: user.id,
  });
  if (memErr && memErr.code !== "23505") throw memErr;
}

export async function joinTopicRoomRemote(
  client: SupabaseClient,
  topicId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const { error } = await client.from("topic_members").insert({
    topic_id: topicId,
    user_id: user.id,
  });
  if (error && error.code !== "23505") throw error;
}

export async function userJoinedTopicRemote(
  client: SupabaseClient,
  topicId: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  const { data, error } = await client
    .from("topic_members")
    .select("topic_id")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function getCurrentUserId(
  client: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}
