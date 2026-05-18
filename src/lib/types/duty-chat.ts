export type DutyChatMessage = {
  id: string;
  dutyId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: number;
  isMine: boolean;
};
