export type PollOption = {
  id: string;
  label: string;
  voteCount: number;
};

export type RoomPoll = {
  id: string;
  topicId: string;
  authorName: string;
  authorUserId?: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  /** Current viewer's chosen option, if any. */
  myVoteOptionId?: string;
};

export type CreatePollInput = {
  topicId: string;
  authorName: string;
  question: string;
  options: string[];
};

export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;
