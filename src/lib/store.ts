import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canDeleteTopic } from "./admin";
import { roomNameKey } from "./room-name";
import type { ChatMessage, SendMessageInput, Topic } from "./types";
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

export type MeetGreetState = {
  topics: Topic[];
  messages: ChatMessage[];
  topicMemberIds: Record<string, string[]>;
  /** Locked display name per room + browser visitor (local mode). */
  roomDisplayNames: Record<string, string>;
  createTopic: (input: { title: string; lat: number; lng: number }) => string;
  deleteTopic: (topicId: string, userId?: string | null) => boolean;
  joinTopicRoom: (topicId: string) => void;
  getLockedRoomName: (topicId: string, visitorId: string | null) => string | null;
  sendMessage: (input: SendMessageInput) => void;
};

export const useMeetGreetStore = create<MeetGreetState>()(
  persist(
    (set, get) => ({
      topics: seedTopics,
      messages: seedMessages,
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
