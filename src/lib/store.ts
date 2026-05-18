import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canDeleteTopic } from "./admin";
import { roomNameKey } from "./room-name";
import type { ChatMessage, SendMessageInput, Topic } from "./types";
import type { CreatePollInput, RoomPoll } from "./types/poll";
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "./types/poll";
import type {
  CreateDutyInput,
  CreateDutyOfferInput,
  Duty,
  DutyOffer,
  DutyWithOffers,
} from "./types/duty";
import { getVisitorId } from "./visitor";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fixed timestamps so SSR and the browser agree before localStorage hydrate. */
const DEMO_ANCHOR_MS = Date.UTC(2026, 4, 18, 12, 0, 0, 0);

const seedTopics: Topic[] = [
  {
    id: "seed-topic-coffee",
    title: "Office drama — spill it here",
    lat: 19.076,
    lng: 72.8777,
    createdAt: DEMO_ANCHOR_MS - 86_400_000,
  },
  {
    id: "seed-topic-walk",
    title: "Crushes you won't text out loud",
    lat: 19.082,
    lng: 72.865,
    createdAt: DEMO_ANCHOR_MS - 43_200_000,
  },
  {
    id: "seed-topic-dating",
    title: "Hot takes nobody asked for (yet)",
    lat: 19.07,
    lng: 72.89,
    createdAt: DEMO_ANCHOR_MS - 3_600_000,
  },
];

const seedMessages: ChatMessage[] = [
  {
    id: "m1",
    topicId: "seed-topic-coffee",
    authorName: "throwaway_ria",
    body: "Okay but why does Monday stand-up feel like a trial every week?",
    createdAt: DEMO_ANCHOR_MS - 7200_000,
  },
  {
    id: "m2",
    topicId: "seed-topic-coffee",
    authorName: "ghost_pepper",
    body: "Because Karen runs it like a courtroom. That's the tea.",
    createdAt: DEMO_ANCHOR_MS - 7100_000,
  },
  {
    id: "m2b",
    topicId: "seed-topic-coffee",
    authorName: "throwaway_ria",
    replyToId: "m2",
    body: "She asked 'any blockers?' and stared at me for 30 seconds straight.",
    createdAt: DEMO_ANCHOR_MS - 7050_000,
  },
  {
    id: "m3",
    topicId: "seed-topic-walk",
    authorName: "maybe_later",
    body: "Anyone else typing paragraphs in Notes and never hitting send?",
    createdAt: DEMO_ANCHOR_MS - 3600_000,
  },
];

const seedPolls: RoomPoll[] = [
  {
    id: "poll-seed-1",
    topicId: "seed-topic-coffee",
    authorName: "ghost_pepper",
    question: "Who actually runs Monday stand-up?",
    options: [
      { id: "poll-seed-1-a", label: "Karen", voteCount: 4 },
      { id: "poll-seed-1-b", label: "Karen's calendar invite", voteCount: 7 },
      { id: "poll-seed-1-c", label: "Collective dread", voteCount: 12 },
    ],
    createdAt: DEMO_ANCHOR_MS - 7000_000,
  },
];

const seedDuties: Duty[] = [
  {
    id: "duty-seed-1",
    title: "Can u pls print my lab report?",
    description: "Need 2 copies before 4pm at the library printer. PDF is ready — I'll share on DM.",
    authorName: "throwaway_ria",
    authorVisitorId: "seed-author-ria",
    status: "open",
    currency: "INR",
    createdAt: DEMO_ANCHOR_MS - 6800_000,
  },
];

const seedDutyOffers: DutyOffer[] = [
  {
    id: "duty-offer-1",
    dutyId: "duty-seed-1",
    helperName: "campus_runner",
    helperVisitorId: "seed-helper-1",
    pitch: "I'm at the library rn, can do in 20 min.",
    rewardAmount: 50,
    currency: "INR",
    status: "pending",
    createdAt: DEMO_ANCHOR_MS - 6750_000,
  },
];

export type MeetGreetState = {
  topics: Topic[];
  messages: ChatMessage[];
  polls: RoomPoll[];
  duties: Duty[];
  dutyOffers: DutyOffer[];
  /** Local poll votes keyed by pollId::visitorId */
  pollVotes: Record<string, string>;
  topicMemberIds: Record<string, string[]>;
  /** Locked display name per room + browser visitor (local mode). */
  roomDisplayNames: Record<string, string>;
  createTopic: (input: { title: string; lat: number; lng: number }) => string;
  deleteTopic: (topicId: string, userId?: string | null) => boolean;
  joinTopicRoom: (topicId: string) => void;
  getLockedRoomName: (topicId: string, visitorId: string | null) => string | null;
  sendMessage: (input: SendMessageInput) => void;
  createPoll: (input: CreatePollInput) => string;
  votePoll: (pollId: string, optionId: string, voterKey: string) => void;
  createDuty: (input: CreateDutyInput) => string;
  createDutyOffer: (input: CreateDutyOfferInput) => string;
  pickDutyOffer: (dutyId: string, offerId: string) => void;
  completeDuty: (dutyId: string, helperKey: string) => void;
  rewardDuty: (dutyId: string, authorKey: string) => void;
  cancelDuty: (dutyId: string, authorKey: string) => void;
};

export const useMeetGreetStore = create<MeetGreetState>()(
  persist(
    (set, get) => ({
      topics: seedTopics,
      messages: seedMessages,
      polls: seedPolls,
      duties: seedDuties,
      dutyOffers: seedDutyOffers,
      pollVotes: {},
      topicMemberIds: {},
      roomDisplayNames: {},

      getLockedRoomName: (topicId, visitorId) => {
        if (!visitorId) return null;
        return get().roomDisplayNames[roomNameKey(topicId, visitorId)] ?? null;
      },
      createTopic: ({ title, lat, lng }) => {
        const id = uid();
        const vid = getVisitorId();
        const topic: Topic = {
          id,
          title: title.trim(),
          lat,
          lng,
          createdAt: Date.now(),
          createdByVisitorId: vid ?? undefined,
        };
        set((s) => {
          let topicMemberIds = s.topicMemberIds ?? {};
          if (vid) {
            const cur = topicMemberIds[id] ?? [];
            if (!cur.includes(vid)) {
              topicMemberIds = {
                ...topicMemberIds,
                [id]: [...cur, vid],
              };
            }
          }
          return { topics: [topic, ...s.topics], topicMemberIds };
        });
        return id;
      },

      deleteTopic: (topicId, userId = null) => {
        const topic = get().topics.find((t) => t.id === topicId);
        if (!topic) return false;
        const vid = getVisitorId();
        if (!canDeleteTopic(topic, { visitorId: vid, userId })) {
          return false;
        }
        set((s) => {
          const { [topicId]: _removed, ...restMembers } = s.topicMemberIds;
          const restRoomNames = Object.fromEntries(
            Object.entries(s.roomDisplayNames).filter(
              ([key]) => !key.startsWith(`${topicId}::`),
            ),
          );
          return {
            topics: s.topics.filter((t) => t.id !== topicId),
            messages: s.messages.filter((m) => m.topicId !== topicId),
            polls: s.polls.filter((p) => p.topicId !== topicId),
            pollVotes: Object.fromEntries(
              Object.entries(s.pollVotes).filter(([key]) => !key.startsWith(`${topicId}::`)),
            ),
            topicMemberIds: restMembers,
            roomDisplayNames: restRoomNames,
          };
        });
        return true;
      },

      joinTopicRoom: (topicId) => {
        const vid = getVisitorId();
        if (!vid) return;
        set((s) => {
          const cur = s.topicMemberIds[topicId] ?? [];
          if (cur.includes(vid)) return s;
          return {
            topicMemberIds: {
              ...s.topicMemberIds,
              [topicId]: [...cur, vid],
            },
          };
        });
      },

      sendMessage: ({
        topicId,
        authorName,
        body,
        replyToId,
        mediaUrl,
        mediaType,
      }) => {
        const trimmed = body.trim();
        if (!trimmed && !mediaUrl) return;
        const vid = getVisitorId();
        const roomKey = vid ? roomNameKey(topicId, vid) : null;
        const locked = roomKey ? get().roomDisplayNames[roomKey] : undefined;
        const finalName = locked?.trim() || authorName.trim() || "anon";

        const msg: ChatMessage = {
          id: uid(),
          topicId,
          authorName: finalName,
          body: trimmed,
          createdAt: Date.now(),
          replyToId,
          mediaUrl,
          mediaType,
        };
        set((s) => {
          let topicMemberIds = s.topicMemberIds;
          if (vid) {
            const cur = topicMemberIds[topicId] ?? [];
            if (!cur.includes(vid)) {
              topicMemberIds = {
                ...topicMemberIds,
                [topicId]: [...cur, vid],
              };
            }
          }
          let roomDisplayNames = s.roomDisplayNames;
          if (roomKey && !roomDisplayNames[roomKey]) {
            roomDisplayNames = {
              ...roomDisplayNames,
              [roomKey]: finalName,
            };
          }
          return {
            messages: [...s.messages, msg],
            topicMemberIds,
            roomDisplayNames,
          };
        });
      },

      createPoll: ({ topicId, authorName, question, options }) => {
        const trimmedQuestion = question.trim();
        const labels = options.map((o) => o.trim()).filter(Boolean);
        if (!trimmedQuestion || labels.length < MIN_POLL_OPTIONS) return "";
        if (labels.length > MAX_POLL_OPTIONS) return "";

        const vid = getVisitorId();
        const roomKey = vid ? roomNameKey(topicId, vid) : null;
        const locked = roomKey ? get().roomDisplayNames[roomKey] : undefined;
        const finalName = locked?.trim() || authorName.trim() || "anon";
        const pollId = uid();

        const poll: RoomPoll = {
          id: pollId,
          topicId,
          authorName: finalName,
          question: trimmedQuestion,
          options: labels.map((label) => ({
            id: uid(),
            label,
            voteCount: 0,
          })),
          createdAt: Date.now(),
        };

        set((s) => {
          let topicMemberIds = s.topicMemberIds;
          if (vid) {
            const cur = topicMemberIds[topicId] ?? [];
            if (!cur.includes(vid)) {
              topicMemberIds = {
                ...topicMemberIds,
                [topicId]: [...cur, vid],
              };
            }
          }
          let roomDisplayNames = s.roomDisplayNames;
          if (roomKey && !roomDisplayNames[roomKey]) {
            roomDisplayNames = {
              ...roomDisplayNames,
              [roomKey]: finalName,
            };
          }
          return {
            polls: [...s.polls, poll],
            topicMemberIds,
            roomDisplayNames,
          };
        });

        return pollId;
      },

      votePoll: (pollId, optionId, voterKey) => {
        if (!voterKey) return;
        const voteKey = `${pollId}::${voterKey}`;
        set((s) => {
          const poll = s.polls.find((p) => p.id === pollId);
          if (!poll) return s;
          if (!poll.options.some((o) => o.id === optionId)) return s;

          const previousOptionId = s.pollVotes[voteKey];
          const nextPolls = s.polls.map((p) => {
            if (p.id !== pollId) return p;
            const options = p.options.map((option) => {
              let voteCount = option.voteCount;
              if (previousOptionId === option.id) voteCount -= 1;
              if (option.id === optionId) voteCount += 1;
              return { ...option, voteCount: Math.max(0, voteCount) };
            });
            return {
              ...p,
              options,
              myVoteOptionId: optionId,
            };
          });

          return {
            polls: nextPolls,
            pollVotes: {
              ...s.pollVotes,
              [voteKey]: optionId,
            },
          };
        });
      },

      createDuty: ({ title, description, authorName }) => {
        const vid = getVisitorId();
        if (!vid) return "";
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();
        if (!trimmedTitle || !trimmedDescription) return "";

        const duty: Duty = {
          id: uid(),
          title: trimmedTitle,
          description: trimmedDescription,
          authorName: authorName.trim() || "Guest",
          authorVisitorId: vid,
          status: "open",
          currency: "INR",
          createdAt: Date.now(),
        };

        set((s) => ({ duties: [duty, ...s.duties] }));
        return duty.id;
      },

      createDutyOffer: ({ dutyId, helperName, pitch, rewardAmount, currency = "INR" }) => {
        const vid = getVisitorId();
        if (!vid) return "";

        const duty = get().duties.find((entry) => entry.id === dutyId);
        if (!duty || duty.status !== "open") return "";
        if (duty.authorVisitorId === vid) return "";

        const duplicate = get().dutyOffers.some(
          (offer) => offer.dutyId === dutyId && offer.helperVisitorId === vid,
        );
        if (duplicate) return "";

        const offer: DutyOffer = {
          id: uid(),
          dutyId,
          helperName: helperName.trim() || "Guest",
          helperVisitorId: vid,
          pitch: pitch.trim(),
          rewardAmount,
          currency,
          status: "pending",
          createdAt: Date.now(),
        };

        set((s) => ({ dutyOffers: [...s.dutyOffers, offer] }));
        return offer.id;
      },

      pickDutyOffer: (dutyId, offerId) => {
        set((s) => {
          const duty = s.duties.find((entry) => entry.id === dutyId);
          if (!duty || duty.status !== "open") return s;

          const offer = s.dutyOffers.find((entry) => entry.id === offerId);
          if (!offer || offer.status !== "pending") return s;

          return {
            duties: s.duties.map((entry) =>
              entry.id === dutyId
                ? { ...entry, status: "assigned" as const, assignedOfferId: offerId }
                : entry,
            ),
            dutyOffers: s.dutyOffers.map((entry) => {
              if (entry.dutyId !== dutyId || entry.status !== "pending") return entry;
              return {
                ...entry,
                status: entry.id === offerId ? ("accepted" as const) : ("rejected" as const),
              };
            }),
          };
        });
      },

      completeDuty: (dutyId, helperKey) => {
        set((s) => {
          const duty = s.duties.find((entry) => entry.id === dutyId);
          if (!duty || duty.status !== "assigned") return s;

          const offer = s.dutyOffers.find((entry) => entry.id === duty.assignedOfferId);
          if (!offer || offer.helperVisitorId !== helperKey) return s;

          return {
            duties: s.duties.map((entry) =>
              entry.id === dutyId ? { ...entry, status: "completed" as const } : entry,
            ),
          };
        });
      },

      rewardDuty: (dutyId, authorKey) => {
        set((s) => {
          const duty = s.duties.find((entry) => entry.id === dutyId);
          if (!duty || duty.status !== "completed" || duty.authorVisitorId !== authorKey) {
            return s;
          }

          const offer = s.dutyOffers.find((entry) => entry.id === duty.assignedOfferId);
          if (!offer) return s;

          return {
            duties: s.duties.map((entry) =>
              entry.id === dutyId
                ? {
                    ...entry,
                    status: "rewarded" as const,
                    rewardPaidAmount: offer.rewardAmount,
                    currency: offer.currency,
                    rewardedAt: Date.now(),
                  }
                : entry,
            ),
          };
        });
      },

      cancelDuty: (dutyId, authorKey) => {
        set((s) => {
          const duty = s.duties.find((entry) => entry.id === dutyId);
          if (!duty || duty.authorVisitorId !== authorKey) return s;
          if (duty.status !== "open" && duty.status !== "assigned") return s;

          return {
            duties: s.duties.filter((entry) => entry.id !== dutyId),
            dutyOffers: s.dutyOffers.filter((offer) => offer.dutyId !== dutyId),
          };
        });
      },
    }),
    {
      name: "meet-greet-storage-v1",
      merge: (persistedState, currentState) => {
        const P = (persistedState ?? {}) as Partial<MeetGreetState>;
        return {
          ...currentState,
          ...P,
          topicMemberIds: P.topicMemberIds ?? currentState.topicMemberIds ?? {},
          roomDisplayNames: P.roomDisplayNames ?? currentState.roomDisplayNames ?? {},
          polls: P.polls ?? currentState.polls ?? [],
          pollVotes: P.pollVotes ?? currentState.pollVotes ?? {},
          duties: P.duties ?? currentState.duties ?? [],
          dutyOffers: P.dutyOffers ?? currentState.dutyOffers ?? [],
        };
      },
    },
  ),
);

export function topicMessageCount(topicId: string, messages: ChatMessage[]): number {
  return messages.filter((m) => m.topicId === topicId).length;
}

export function trendingTopics(topics: Topic[], messages: ChatMessage[]): Topic[] {
  return [...topics].sort(
    (a, b) =>
      topicMessageCount(b.id, messages) - topicMessageCount(a.id, messages),
  );
}

export function dutiesWithOffers(
  duties: Duty[],
  dutyOffers: DutyOffer[],
): DutyWithOffers[] {
  const byDuty = new Map<string, DutyOffer[]>();
  for (const offer of dutyOffers) {
    const list = byDuty.get(offer.dutyId) ?? [];
    list.push(offer);
    byDuty.set(offer.dutyId, list);
  }

  return [...duties]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((duty) => ({
      ...duty,
      offers: (byDuty.get(duty.id) ?? []).sort((a, b) => a.createdAt - b.createdAt),
    }));
}

export function getDutyWithOffers(
  dutyId: string,
  duties: Duty[],
  dutyOffers: DutyOffer[],
): DutyWithOffers | null {
  const duty = duties.find((entry) => entry.id === dutyId);
  if (!duty) return null;
  return {
    ...duty,
    offers: dutyOffers
      .filter((offer) => offer.dutyId === dutyId)
      .sort((a, b) => a.createdAt - b.createdAt),
  };
}
