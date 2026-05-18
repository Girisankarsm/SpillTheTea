import type { SupabaseClient } from "@supabase/supabase-js";
import type { DutyChatMessage, DutyChatMessageType } from "@/lib/types/duty-chat";

type MessageRow = {
  id: string;
  duty_id: string;
  sender_id: string;
  body: string;
  message_type: DutyChatMessageType;
  audio_url: string | null;
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
    messageType: row.message_type ?? "text",
    body: row.body,
    audioUrl: row.audio_url ?? undefined,
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
    .select("id, duty_id, sender_id, body, message_type, audio_url, created_at")
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
    message_type: "text",
  });

  if (error) throw error;
}

export async function sendDutyVoiceMessage(
  client: SupabaseClient,
  dutyId: string,
  audioUrl: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to send voice messages.");

  const { error } = await client.from("duty_messages").insert({
    duty_id: dutyId,
    sender_id: user.id,
    body: "",
    message_type: "voice",
    audio_url: audioUrl,
  });

  if (error) throw error;
}

export function mapDutyChatRow(
  row: {
    id: string;
    duty_id: string;
    sender_id: string;
    body: string;
    message_type?: DutyChatMessageType;
    audio_url?: string | null;
    created_at: string;
  },
  currentUserId: string,
  authorUserId: string,
  authorName: string,
  helperUserId: string,
  helperName: string,
): DutyChatMessage {
  return mapMessage(
    {
      id: row.id,
      duty_id: row.duty_id,
      sender_id: row.sender_id,
      body: row.body,
      message_type: row.message_type ?? "text",
      audio_url: row.audio_url ?? null,
      created_at: row.created_at,
    },
    currentUserId,
    authorUserId,
    authorName,
    helperUserId,
    helperName,
  );
}
