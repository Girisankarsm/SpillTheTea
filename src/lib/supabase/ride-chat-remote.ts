import type { RideChatMessage, RideChatMessageType } from "@/lib/types/ride-chat";

export async function fetchRideMessages(): Promise<RideChatMessage[]> {
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

export function mapRideChatRow(row: Partial<RideChatMessage>): RideChatMessage {
  return {
    id: row.id ?? "",
    rideId: row.rideId ?? "",
    senderId: row.senderId ?? "",
    senderName: row.senderName ?? "Someone",
    messageType: row.messageType ?? "text",
    body: row.body ?? "",
    audioUrl: row.audioUrl,
    mediaUrl: row.mediaUrl,
    fileName: row.fileName,
    createdAt: row.createdAt ?? Date.now(),
    isMine: Boolean(row.isMine),
  };
}
