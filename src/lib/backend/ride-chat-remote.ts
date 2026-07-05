import type { RideChatMessage, RideChatMessageType } from "@/lib/types/ride-chat";

export async function fetchRideMessages(..._args: unknown[]): Promise<RideChatMessage[]> {
  return [];
}

export async function sendRideChatMessage(
  _client: unknown,
  input: {
    rideId: string;
    senderName: string;
    body: string;
    messageType?: RideChatMessageType;
    audioUrl?: string;
    mediaUrl?: string;
    fileName?: string;
  },
): Promise<string> {
  console.warn("Mongo ride chat persistence is not implemented yet.", input);
  return `ride-msg-${Date.now().toString(36)}`;
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
    createdAt: row.createdAt ?? (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    isMine: currentUserId ? senderId === currentUserId : Boolean(row.isMine),
  };
}
