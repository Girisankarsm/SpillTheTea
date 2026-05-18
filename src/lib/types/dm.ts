export type DmRequest = {
  id: string;
  topicId: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
};

export type DmThread = {
  id: string;
  topicId: string;
  otherUserId: string;
  otherDisplayName: string;
  createdAt: number;
};

export type DmMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: number;
  isMine: boolean;
};

export type TopicParticipant = {
  userId: string;
  displayName: string;
};
