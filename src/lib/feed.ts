import type { ChatMessage } from "@/lib/types";
import type { RoomPoll } from "@/lib/types/poll";
import { countReplies } from "@/lib/message-thread";
import { hotScore, pollHotScore, type TopicSort } from "@/lib/message-upvotes";

export type FeedItem =
  | { kind: "message"; createdAt: number; message: ChatMessage }
  | { kind: "poll"; createdAt: number; poll: RoomPoll };

export function buildRoomFeed(
  messages: ChatMessage[],
  polls: RoomPoll[],
  sort: TopicSort = "hot",
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

  if (sort === "new") {
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  return items.sort((a, b) => feedHotScore(b, messages) - feedHotScore(a, messages));
}

function feedHotScore(item: FeedItem, messages: ChatMessage[]): number {
  if (item.kind === "poll") {
    const votes = item.poll.options.reduce((sum, option) => sum + option.voteCount, 0);
    return pollHotScore(votes, item.createdAt);
  }

  const replyCount = countReplies(messages, item.message.id);
  return hotScore(item.message.upvoteCount ?? 0, replyCount, item.createdAt);
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
