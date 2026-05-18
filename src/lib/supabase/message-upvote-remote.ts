import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage } from "@/lib/types";

type UpvoteRow = {
  message_id: string;
  user_id: string;
};

export function applyUpvotesToMessages(
  messages: ChatMessage[],
  upvoteRows: UpvoteRow[],
  currentUserId: string | null,
): ChatMessage[] {
  const counts = new Map<string, number>();
  const myUpvotes = new Set<string>();

  for (const row of upvoteRows) {
    counts.set(row.message_id, (counts.get(row.message_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      myUpvotes.add(row.message_id);
    }
  }

  return messages.map((message) => ({
    ...message,
    upvoteCount: counts.get(message.id) ?? 0,
    myUpvote: myUpvotes.has(message.id),
  }));
}

export async function fetchMessageUpvotes(
  client: SupabaseClient,
  messageIds: string[],
): Promise<UpvoteRow[]> {
  if (messageIds.length === 0) return [];

  const { data, error } = await client
    .from("message_upvotes")
    .select("message_id, user_id")
    .in("message_id", messageIds);

  if (error) throw error;
  return (data ?? []) as UpvoteRow[];
}

export async function toggleMessageUpvoteRemote(
  client: SupabaseClient,
  messageId: string,
): Promise<boolean> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const { data: existing, error: readErr } = await client
    .from("message_upvotes")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) throw readErr;

  if (existing) {
    const { error: delErr } = await client
      .from("message_upvotes")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id);
    if (delErr) throw delErr;
    return false;
  }

  const { error: insErr } = await client.from("message_upvotes").insert({
    message_id: messageId,
    user_id: user.id,
  });
  if (insErr) throw insErr;
  return true;
}
