export type Topic = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  createdAt: number;
  /** Local/demo mode — browser visitor who created the spot. */
  createdByVisitorId?: string;
  /** Supabase auth user who created the spot. */
  createdByUserId?: string;
};

export type MessageMediaType = "image" | "gif";

export type ChatMessage = {
  id: string;
  topicId: string;
  authorName: string;
  body: string;
  createdAt: number;
  authorUserId?: string;
  replyToId?: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
  upvoteCount?: number;
  myUpvote?: boolean;
};

export type SendMessageInput = {
  topicId: string;
  authorName: string;
  body: string;
  replyToId?: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
};
