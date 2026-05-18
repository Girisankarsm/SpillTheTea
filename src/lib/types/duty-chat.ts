export type DutyChatMessageType = "text" | "voice" | "image" | "gif" | "file";

export type DutyChatMessage = {
  id: string;
  dutyId: string;
  senderId: string;
  senderName: string;
  messageType: DutyChatMessageType;
  body: string;
  audioUrl?: string;
  mediaUrl?: string;
  fileName?: string;
  createdAt: number;
  isMine: boolean;
};
