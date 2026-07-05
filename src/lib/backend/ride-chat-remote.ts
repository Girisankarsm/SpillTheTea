import type { RideChatMessage, RideChatMessageType } from "@/lib/types/ride-chat";

export type RideChatContext = {
  currentUserId: string;
  riderUserId: string;
  riderName: string;
  driverUserId: string;
  driverName: string;
};

export async function fetchRideMessages(
  _client: unknown,
  _rideId: string,
  _currentUserId: string,
  _riderUserId: string,
  _riderName: string,
  _driverUserId: string,
  _driverName: string,
): Promise<RideChatMessage[]> {
  return [];
}

export async function sendRideChatMessage(
  _client: unknown,
  rideId: string,
  input: {
    messageType?: RideChatMessageType;
    body?: string;
    audioUrl?: string;
    mediaUrl?: string;
    fileName?: string;
  },
  ctx: RideChatContext,
): Promise<RideChatMessage> {
  const senderName =
    ctx.currentUserId === ctx.riderUserId ? ctx.riderName : ctx.driverName;
  return {
    id: `ride-msg-${Date.now().toString(36)}`,
    rideId,
    senderId: ctx.currentUserId,
    senderName,
    messageType: input.messageType ?? "text",
    body: input.body ?? "",
    audioUrl: input.audioUrl,
    mediaUrl: input.mediaUrl,
    fileName: input.fileName,
    createdAt: Date.now(),
    isMine: true,
  };
}

type RideChatRowInput = Partial<RideChatMessage> & {
  ride_id?: string;
  sender_user_id?: string;
  sender_name?: string;
  message_type?: RideChatMessageType;
  audio_url?: string;
  media_url?: string;
  file_name?: string;
  created_at?: string;
};

export function mapRideChatRow(
  row: RideChatRowInput,
  currentUserId?: string,
  _riderUserId?: string,
  _riderName?: string,
  _driverUserId?: string,
  _driverName?: string,
): RideChatMessage {
  const senderId = row.senderId ?? row.sender_user_id ?? "";
  return {
    id: row.id ?? "",
    rideId: row.rideId ?? row.ride_id ?? "",
    senderId,
    senderName: row.senderName ?? row.sender_name ?? "Someone",
    messageType: row.messageType ?? row.message_type ?? "text",
    body: row.body ?? "",
    audioUrl: row.audioUrl ?? row.audio_url,
    mediaUrl: row.mediaUrl ?? row.media_url,
    fileName: row.fileName ?? row.file_name,
    createdAt:
      row.createdAt ?? (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    isMine: currentUserId ? senderId === currentUserId : Boolean(row.isMine),
  };
}
