import type { SupabaseClient } from "@supabase/supabase-js";
import type { DutyChatMessage } from "@/lib/types/duty-chat";

type MessageRow = {
  id: string;
  duty_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function mapMessage(
  row: MessageRow,
  currentUserId: string,
  authorUserId: string,
  authorName: string,
  helperUserId: string,
  helperName: string,
): DutyChatMessage {
  const senderId = row.sender_id;
  const isAuthor = senderId === authorUserId;
  return {
    id: row.id,
    dutyId: row.duty_id,
    senderId,
    senderName: isAuthor ? authorName : helperName,
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    isMine: senderId === currentUserId,
  };
}

export async function fetchDutyMessages(
  client: SupabaseClient,
  dutyId: string,
  currentUserId: string,
  authorUserId: string,
  authorName: string,
  helperUserId: string,
  helperName: string,
): Promise<DutyChatMessage[]> {
  const { data, error } = await client
    .from("duty_messages")
    .select("id, duty_id, sender_id, body, created_at")
    .eq("duty_id", dutyId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    mapMessage(
      row as MessageRow,
      currentUserId,
      authorUserId,
      authorName,
      helperUserId,
      helperName,
    ),
  );
}

export async function sendDutyMessage(
  client: SupabaseClient,
  dutyId: string,
  body: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to send messages.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const { error } = await client.from("duty_messages").insert({
    duty_id: dutyId,
    sender_id: user.id,
    body: trimmed,
  });

  if (error) throw error;
}
