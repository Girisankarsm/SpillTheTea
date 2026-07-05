import type { DutyChatMessage, DutyChatMessageType } from "@/lib/types/duty-chat";

export async function fetchDutyMessages(..._args: unknown[]): Promise<DutyChatMessage[]> {
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

type DutyChatRowInput = Partial<DutyChatMessage> & {
  duty_id?: string;
  sender_user_id?: string;
  sender_name?: string;
  message_type?: DutyChatMessageType;
  audio_url?: string;
  media_url?: string;
  file_name?: string;
  created_at?: string;
};

export function mapDutyChatRow(
  row: DutyChatRowInput,
  currentUserId?: string,
  _authorUserId?: string,
  _authorName?: string,
  _helperUserId?: string,
  _helperName?: string,
): DutyChatMessage {
  const senderId = row.senderId ?? row.sender_user_id ?? "";
  return {
    id: row.id ?? "",
    dutyId: row.dutyId ?? row.duty_id ?? "",
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
