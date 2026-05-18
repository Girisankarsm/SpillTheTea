import type { SupabaseClient } from "@supabase/supabase-js";
import type { DutyChatMessage, DutyChatMessageType } from "@/lib/types/duty-chat";

type MessageRow = {
  id: string;
  duty_id: string;
  sender_id: string;
  body: string;
  message_type: DutyChatMessageType;
  audio_url: string | null;
  media_url: string | null;
  file_name: string | null;
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
    mediaUrl: row.media_url ?? undefined,
    fileName: row.file_name ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    isMine: senderId === currentUserId,
  };
}

const MESSAGE_SELECT =
  "id, duty_id, sender_id, body, message_type, audio_url, media_url, file_name, created_at";

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
    .select(MESSAGE_SELECT)
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

type SendDutyMessageInput = {
  messageType: DutyChatMessageType;
  body?: string;
  audioUrl?: string;
  mediaUrl?: string;
  fileName?: string;
};

type DutyChatContext = {
  currentUserId: string;
  authorUserId: string;
  authorName: string;
  helperUserId: string;
  helperName: string;
};

export async function sendDutyChatMessage(
  client: SupabaseClient,
  dutyId: string,
  input: SendDutyMessageInput,
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to send messages.");

  const body = (input.body ?? "").trim();
  const { messageType, audioUrl, mediaUrl, fileName } = input;

  if (messageType === "text" && !body) {
    throw new Error("Message cannot be empty.");
  }
  if (messageType === "voice" && !audioUrl?.trim()) {
    throw new Error("Voice message is missing audio.");
  }
  if (["image", "gif", "file"].includes(messageType) && !mediaUrl?.trim()) {
    throw new Error("Attachment is missing.");
  }

  const { data, error } = await client
    .from("duty_messages")
    .insert({
      duty_id: dutyId,
      sender_id: user.id,
      body: messageType === "voice" ? "" : body,
      message_type: messageType,
      audio_url: messageType === "voice" ? audioUrl : null,
      media_url: ["image", "gif", "file"].includes(messageType) ? mediaUrl : null,
      file_name: messageType === "file" ? fileName ?? null : null,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) throw error ?? new Error("Could not send message.");

  return mapMessage(
    data as MessageRow,
    ctx.currentUserId,
    ctx.authorUserId,
    ctx.authorName,
    ctx.helperUserId,
    ctx.helperName,
  );
}

export async function sendDutyMessage(
  client: SupabaseClient,
  dutyId: string,
  body: string,
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  return sendDutyChatMessage(client, dutyId, { messageType: "text", body }, ctx);
}

export async function sendDutyVoiceMessage(
  client: SupabaseClient,
  dutyId: string,
  audioUrl: string,
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  return sendDutyChatMessage(
    client,
    dutyId,
    {
      messageType: "voice",
      audioUrl,
    },
    ctx,
  );
}

export function mapDutyChatRow(
  row: {
    id: string;
    duty_id: string;
    sender_id: string;
    body: string;
    message_type?: DutyChatMessageType;
    audio_url?: string | null;
    media_url?: string | null;
    file_name?: string | null;
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
      media_url: row.media_url ?? null,
      file_name: row.file_name ?? null,
      created_at: row.created_at,
    },
    currentUserId,
    authorUserId,
    authorName,
    helperUserId,
    helperName,
  );
}
