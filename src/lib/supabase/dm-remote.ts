import type {
  DmMessage,
  DmRequest,
  DmThread,
  TopicParticipant,
} from "@/lib/types/dm";

export async function fetchTopicParticipants(): Promise<TopicParticipant[]> {
  return [];
}

export async function fetchDmRequests(): Promise<DmRequest[]> {
  return [];
}

export async function fetchDmThreads(): Promise<DmThread[]> {
  return [];
}

export async function sendDmRequest(): Promise<string> {
  console.warn("Mongo DM request persistence is not implemented yet.");
  return `dm-req-${Date.now().toString(36)}`;
}

export async function acceptDmRequest(): Promise<string> {
  console.warn("Mongo DM accept flow is not implemented yet.");
  return `dm-thread-${Date.now().toString(36)}`;
}

export async function rejectDmRequest(): Promise<void> {
  console.warn("Mongo DM reject flow is not implemented yet.");
}

export async function fetchDmMessages(): Promise<DmMessage[]> {
  return [];
}

export async function sendDmMessage(): Promise<string> {
  console.warn("Mongo DM message persistence is not implemented yet.");
  return `dm-msg-${Date.now().toString(36)}`;
}

export async function findThreadWithUser(): Promise<string | null> {
  return null;
}
