import type { SupabaseClient } from "@supabase/supabase-js";
import type { RideChatMessage, RideChatMessageType } from "@/lib/types/ride-chat";

type MessageRow = {
  id: string;
  ride_id: string;
  sender_id: string;
  body: string;
  message_type: RideChatMessageType;
  audio_url: string | null;
  media_url: string | null;
  file_name: string | null;
  created_at: string;
};

function mapMessage(
  row: MessageRow,
  currentUserId: string,
  riderUserId: string,
  riderName: string,
  driverUserId: string,
  driverName: string,
): RideChatMessage {
  const senderId = row.sender_id;
  const isRider = senderId === riderUserId;
  return {
    id: row.id,
    rideId: row.ride_id,
    senderId,
    senderName: isRider ? riderName : driverName,
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
  "id, ride_id, sender_id, body, message_type, audio_url, media_url, file_name, created_at";

export async function fetchRideMessages(
  client: SupabaseClient,
  rideId: string,
  currentUserId: string,
  riderUserId: string,
  riderName: string,
  driverUserId: string,
  driverName: string,
): Promise<RideChatMessage[]> {
  const { data, error } = await client
    .from("ride_messages")
    .select(MESSAGE_SELECT)
    .eq("ride_id", rideId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    mapMessage(
      row as MessageRow,
      currentUserId,
      riderUserId,
      riderName,
      driverUserId,
      driverName,
    ),
  );
}

type SendRideMessageInput = {
  messageType: RideChatMessageType;
  body?: string;
  audioUrl?: string;
  mediaUrl?: string;
  fileName?: string;
};

type RideChatContext = {
  currentUserId: string;
  riderUserId: string;
  riderName: string;
  driverUserId: string;
  driverName: string;
};

export async function sendRideChatMessage(
  client: SupabaseClient,
  rideId: string,
  input: SendRideMessageInput,
  ctx: RideChatContext,
): Promise<RideChatMessage> {
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
    .from("ride_messages")
    .insert({
      ride_id: rideId,
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
    ctx.riderUserId,
    ctx.riderName,
    ctx.driverUserId,
    ctx.driverName,
  );
}

export function mapRideChatRow(
  row: {
    id: string;
    ride_id: string;
    sender_id: string;
    body: string;
    message_type?: RideChatMessageType;
    audio_url?: string | null;
    media_url?: string | null;
    file_name?: string | null;
    created_at: string;
  },
  currentUserId: string,
  riderUserId: string,
  riderName: string,
  driverUserId: string,
  driverName: string,
): RideChatMessage {
  return mapMessage(
    {
      id: row.id,
      ride_id: row.ride_id,
      sender_id: row.sender_id,
      body: row.body,
      message_type: row.message_type ?? "text",
      audio_url: row.audio_url ?? null,
      media_url: row.media_url ?? null,
      file_name: row.file_name ?? null,
      created_at: row.created_at,
    },
    currentUserId,
    riderUserId,
    riderName,
    driverUserId,
    driverName,
  );
}
