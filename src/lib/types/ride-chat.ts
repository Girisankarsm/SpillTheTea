export type RideChatMessageType = "text" | "voice" | "image" | "gif" | "file";

export type RideChatMessage = {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  messageType: RideChatMessageType;
  body: string;
  audioUrl?: string;
  mediaUrl?: string;
  fileName?: string;
  createdAt: number;
  isMine: boolean;
};
