import type { DutyChatMessage, DutyChatMessageType } from "@/lib/types/duty-chat";

export async function fetchDutyMessages(): Promise<DutyChatMessage[]> {
  return [];
}

export async function sendDutyChatMessage(
  _client: unknown,
  input: {
    dutyId: string;
    senderName: string;
    body: string;
    messageType?: DutyChatMessageType;
    audioUrl?: string;
    mediaUrl?: string;
    fileName?: string;
  },
): Promise<string> {
  console.warn("Mongo duty chat persistence is not implemented yet.", input);
  return `duty-msg-${Date.now().toString(36)}`;
}

export async function sendDutyMessage(
  client: unknown,
  dutyId: string,
  senderName: string,
  body: string,
): Promise<string> {
  return sendDutyChatMessage(client, { dutyId, senderName, body, messageType: "text" });
}

export async function sendDutyVoiceMessage(
  client: unknown,
  dutyId: string,
  senderName: string,
  audioUrl: string,
): Promise<string> {
  return sendDutyChatMessage(client, {
    dutyId,
    senderName,
    body: "Voice message",
    audioUrl,
    messageType: "voice",
  });
}

export function mapDutyChatRow(row: Partial<DutyChatMessage>): DutyChatMessage {
  return {
    id: row.id ?? "",
    dutyId: row.dutyId ?? "",
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
