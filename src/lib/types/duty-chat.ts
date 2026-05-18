export type DutyChatMessageType = "text" | "voice";

export type DutyChatMessage = {
  id: string;
  dutyId: string;
  senderId: string;
  senderName: string;
  messageType: DutyChatMessageType;
  body: string;
  audioUrl?: string;
  createdAt: number;
  isMine: boolean;
};
