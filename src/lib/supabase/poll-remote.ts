import type { CreatePollInput, RoomPoll } from "@/lib/types/poll";

export async function fetchTopicPolls(): Promise<RoomPoll[]> {
  return [];
}

export async function createPollRemote(
  _client: unknown,
  input: CreatePollInput,
): Promise<string> {
  const id = `poll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  console.warn("Mongo poll persistence is not implemented yet; created local-only poll.", input);
  return id;
}

export async function votePollRemote(): Promise<void> {
  console.warn("Mongo poll vote persistence is not implemented yet.");
}

export function mapPollFromRealtime(row: unknown): RoomPoll | null {
  if (!row || typeof row !== "object") return null;
  return null;
}
