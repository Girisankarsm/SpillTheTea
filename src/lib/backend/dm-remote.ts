import type {
  DmMessage,
  DmRequest,
  DmThread,
  TopicParticipant,
} from "@/lib/types/dm";

export async function fetchTopicParticipants(..._args: unknown[]): Promise<TopicParticipant[]> {
  return [];
}

export async function fetchDmRequests(..._args: unknown[]): Promise<DmRequest[]> {
  return [];
}

export async function fetchDmThreads(..._args: unknown[]): Promise<DmThread[]> {
  return [];
}

export async function sendDmRequest(..._args: unknown[]): Promise<string> {
  console.warn("Mongo DM request persistence is not implemented yet.");
  return `dm-req-${Date.now().toString(36)}`;
}

export async function acceptDmRequest(..._args: unknown[]): Promise<string> {
  console.warn("Mongo DM accept flow is not implemented yet.");
  return `dm-thread-${Date.now().toString(36)}`;
}

export async function rejectDmRequest(..._args: unknown[]): Promise<void> {
  console.warn("Mongo DM reject flow is not implemented yet.");
}

export async function fetchDmMessages(..._args: unknown[]): Promise<DmMessage[]> {
  return [];
}

export async function sendDmMessage(
  _client: unknown,
  threadId: string,
  body: string,
  currentUserId: string,
): Promise<DmMessage> {
  return {
    id: `dm-msg-${Date.now().toString(36)}`,
    threadId,
    senderId: currentUserId,
    body: body.trim(),
    createdAt: Date.now(),
    isMine: true,
  };
}

export async function findThreadWithUser(..._args: unknown[]): Promise<string | null> {
  return null;
}
