import type { ChatMessage } from "@/lib/types";
import type { RoomPoll } from "@/lib/types/poll";

export type FeedItem =
  | { kind: "message"; createdAt: number; message: ChatMessage }
  | { kind: "poll"; createdAt: number; poll: RoomPoll };

export function buildRoomFeed(
  messages: ChatMessage[],
  polls: RoomPoll[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...messages.map((message) => ({
      kind: "message" as const,
      createdAt: message.createdAt,
      message,
    })),
    ...polls.map((poll) => ({
      kind: "poll" as const,
      createdAt: poll.createdAt,
      poll,
    })),
  ];

  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export function enrichPollVotes(
  polls: RoomPoll[],
  pollVotes: Record<string, string>,
  voterKey: string | null,
): RoomPoll[] {
  if (!voterKey) return polls;
  return polls.map((poll) => ({
    ...poll,
    myVoteOptionId: pollVotes[`${poll.id}::${voterKey}`],
  }));
}
