import type { SupabaseClient } from "@supabase/supabase-js";
import type { DmMessage, DmRequest, DmThread, TopicParticipant } from "@/lib/types/dm";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function displayNameForUserInTopic(
  client: SupabaseClient,
  topicId: string,
  userId: string,
): Promise<string> {
  const { data } = await client
    .from("messages")
    .select("author_name")
    .eq("topic_id", topicId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const name = (data?.author_name as string | undefined)?.trim();
  if (name) return name;

  const { data: profile } = await client
    .from("profiles_public")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  return (profile?.display_name as string | undefined)?.trim() || "Someone";
}

export async function fetchTopicParticipants(
  client: SupabaseClient,
  topicId: string,
  excludeUserId?: string | null,
): Promise<TopicParticipant[]> {
  const { data, error } = await client
    .from("messages")
    .select("user_id, author_name, created_at")
    .eq("topic_id", topicId)
    .not("user_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const byUser = new Map<string, string>();
  for (const row of data ?? []) {
    const uid = row.user_id as string;
    if (!uid || uid === excludeUserId) continue;
    if (!byUser.has(uid)) {
      byUser.set(uid, ((row.author_name as string) || "Someone").trim());
    }
  }

  return [...byUser.entries()].map(([userId, displayName]) => ({
    userId,
    displayName,
  }));
}

export async function fetchDmRequests(
  client: SupabaseClient,
  topicId: string,
  userId: string,
): Promise<DmRequest[]> {
  const { data, error } = await client
    .from("dm_requests")
    .select("id, topic_id, from_user_id, to_user_id, status, created_at")
    .eq("topic_id", topicId)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id as string,
      topicId: row.topic_id as string,
      fromUserId: row.from_user_id as string,
      toUserId: row.to_user_id as string,
      fromDisplayName: await displayNameForUserInTopic(
        client,
        topicId,
        row.from_user_id as string,
      ),
      toDisplayName: await displayNameForUserInTopic(
        client,
        topicId,
        row.to_user_id as string,
      ),
      status: row.status as DmRequest["status"],
      createdAt: new Date(row.created_at as string).getTime(),
    })),
  );
}

export async function fetchDmThreads(
  client: SupabaseClient,
  topicId: string,
  userId: string,
): Promise<DmThread[]> {
  const { data, error } = await client
    .from("dm_threads")
    .select("id, topic_id, user_a_id, user_b_id, created_at")
    .eq("topic_id", topicId)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (row) => {
      const otherUserId =
        (row.user_a_id as string) === userId
          ? (row.user_b_id as string)
          : (row.user_a_id as string);
      return {
        id: row.id as string,
        topicId: row.topic_id as string,
        otherUserId,
        otherDisplayName: await displayNameForUserInTopic(
          client,
          topicId,
          otherUserId,
        ),
        createdAt: new Date(row.created_at as string).getTime(),
      };
    }),
  );
}

export async function sendDmRequest(
  client: SupabaseClient,
  topicId: string,
  toUserId: string,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to request a private chat.");

  if (user.id === toUserId) throw new Error("You cannot message yourself.");

  const [ua, ub] = orderedPair(user.id, toUserId);
  const { data: existingThread } = await client
    .from("dm_threads")
    .select("id")
    .eq("topic_id", topicId)
    .eq("user_a_id", ua)
    .eq("user_b_id", ub)
    .maybeSingle();

  if (existingThread) {
    throw new Error("You already have a private chat with this person.");
  }

  const { data: existingPending } = await client
    .from("dm_requests")
    .select("id, from_user_id, status")
    .eq("topic_id", topicId)
    .eq("status", "pending")
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existingPending) {
    if (existingPending.from_user_id === user.id) {
      throw new Error("Request already sent — waiting for them to accept.");
    }
    throw new Error("They already requested you — check Private chats.");
  }

  const { error } = await client.from("dm_requests").insert({
    topic_id: topicId,
    from_user_id: user.id,
    to_user_id: toUserId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Request already sent.");
    }
    throw error;
  }
}

export async function acceptDmRequest(
  client: SupabaseClient,
  requestId: string,
): Promise<string> {
  const { data, error } = await client.rpc("accept_dm_request", {
    req_id: requestId,
  });
  if (error) throw error;
  return data as string;
}

export async function rejectDmRequest(
  client: SupabaseClient,
  requestId: string,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await client
    .from("dm_requests")
    .update({ status: "rejected" })
    .eq("id", requestId)
    .eq("to_user_id", user.id)
    .eq("status", "pending");

  if (error) throw error;
}

export async function fetchDmMessages(
  client: SupabaseClient,
  threadId: string,
  userId: string,
): Promise<DmMessage[]> {
  const { data, error } = await client
    .from("dm_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    threadId: row.thread_id as string,
    senderId: row.sender_id as string,
    body: row.body as string,
    createdAt: new Date(row.created_at as string).getTime(),
    isMine: (row.sender_id as string) === userId,
  }));
}

export async function sendDmMessage(
  client: SupabaseClient,
  threadId: string,
  body: string,
  currentUserId: string,
): Promise<DmMessage> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const { data, error } = await client
    .from("dm_messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: trimmed,
    })
    .select("id, thread_id, sender_id, body, created_at")
    .single();

  if (error || !data) throw error ?? new Error("Could not send message.");

  return {
    id: data.id as string,
    threadId: data.thread_id as string,
    senderId: data.sender_id as string,
    body: data.body as string,
    createdAt: new Date(data.created_at as string).getTime(),
    isMine: (data.sender_id as string) === currentUserId,
  };
}

export async function findThreadWithUser(
  client: SupabaseClient,
  topicId: string,
  userId: string,
  otherUserId: string,
): Promise<DmThread | null> {
  const [ua, ub] = orderedPair(userId, otherUserId);
  const { data, error } = await client
    .from("dm_threads")
    .select("id, topic_id, user_a_id, user_b_id, created_at")
    .eq("topic_id", topicId)
    .eq("user_a_id", ua)
    .eq("user_b_id", ub)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id as string,
    topicId: data.topic_id as string,
    otherUserId,
    otherDisplayName: await displayNameForUserInTopic(
      client,
      topicId,
      otherUserId,
    ),
    createdAt: new Date(data.created_at as string).getTime(),
  };
}
