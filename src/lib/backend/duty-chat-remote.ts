import type { DutyChatMessage, DutyChatMessageType } from "@/lib/types/duty-chat";

export type DutyChatContext = {
  currentUserId: string;
  authorUserId: string;
  authorName: string;
  helperUserId: string;
  helperName: string;
};

export async function fetchDutyMessages(
  _client: unknown,
  _dutyId: string,
  _currentUserId: string,
  _authorUserId: string,
  _authorName: string,
  _helperUserId: string,
  _helperName: string,
): Promise<DutyChatMessage[]> {
  return [];
}

export async function sendDutyChatMessage(
  _client: unknown,
  dutyId: string,
  input: {
    messageType?: DutyChatMessageType;
    body?: string;
    audioUrl?: string;
    mediaUrl?: string;
    fileName?: string;
  },
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  const senderName =
    ctx.currentUserId === ctx.authorUserId ? ctx.authorName : ctx.helperName;
  return {
    id: `duty-msg-${Date.now().toString(36)}`,
    dutyId,
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

export async function sendDutyMessage(
  client: unknown,
  dutyId: string,
  senderName: string,
  body: string,
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  return sendDutyChatMessage(
    client,
    dutyId,
    { body, messageType: "text" },
    { ...ctx, authorName: senderName, helperName: senderName },
  );
}

export async function sendDutyVoiceMessage(
  client: unknown,
  dutyId: string,
  _senderName: string,
  audioUrl: string,
  ctx: DutyChatContext,
): Promise<DutyChatMessage> {
  return sendDutyChatMessage(
    client,
    dutyId,
    { body: "Voice message", audioUrl, messageType: "voice" },
    ctx,
  );
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
    createdAt:
      row.createdAt ?? (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    isMine: currentUserId ? senderId === currentUserId : Boolean(row.isMine),
  };
}
