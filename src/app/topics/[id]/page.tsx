"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBoard } from "@/components/MessageBoard";
import { PrivateChatPanel } from "@/components/PrivateChatPanel";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { ChatMessage, Topic } from "@/lib/types";
import type { RoomPoll } from "@/lib/types/poll";
import { enrichPollVotes } from "@/lib/feed";
import { applyLocalUpvotesToMessages, type TopicSort } from "@/lib/message-upvotes";
import { useSupabase } from "@/components/SupabaseProvider";
import { canDeleteTopic } from "@/lib/admin";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import {
  fetchDmRequests,
  findThreadWithUser,
} from "@/lib/supabase/dm-remote";
import { readFileAsDataUrl } from "@/lib/message-thread";
import {
  deleteTopicRemote,
  fetchLockedRoomDisplayName,
  fetchTopicMessages,
  fetchTopicMeta,
  getCurrentUserId,
  sendMessageRemote,
} from "@/lib/supabase/meet-greet-remote";
import {
  createPollRemote,
  fetchTopicPolls,
  votePollRemote,
} from "@/lib/supabase/poll-remote";
import {
  normalizeMediaUrlInput,
  uploadMessageMedia,
} from "@/lib/supabase/message-media";
import {
  applyUpvotesToMessages,
  fetchMessageUpvotes,
  toggleMessageUpvoteRemote,
} from "@/lib/supabase/message-upvote-remote";
import { appendUniqueMessage } from "@/lib/merge-messages";
import { unknownErrorMessage } from "@/lib/error-message";
import { roomShareUrl } from "@/lib/share-room";
import { useMeetGreetStore } from "@/lib/store";
import { getVisitorId } from "@/lib/visitor";

function mapRealtimeMessageRow(row: {
  id: string;
  topic_id: string;
  author_name: string;
  body: string;
  created_at: string;
  user_id?: string | null;
  reply_to_id?: string | null;
  media_url?: string | null;
  media_type?: string | null;
}): ChatMessage {
  const mediaType =
    row.media_type === "gif" || row.media_type === "image"
      ? row.media_type
      : undefined;

  return {
    id: row.id,
    topicId: row.topic_id,
    authorName: row.author_name || "anon",
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    authorUserId: row.user_id ?? undefined,
    replyToId: row.reply_to_id ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    mediaType,
  };
}

export default function TopicChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const { supabase, remoteReady, session } = useSupabase();
  const { defaultDisplayName } = useUserProfile();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const sendMessageLocal = useMeetGreetStore((s) => s.sendMessage);
  const createPollLocal = useMeetGreetStore((s) => s.createPoll);
  const votePollLocal = useMeetGreetStore((s) => s.votePoll);
  const toggleMessageUpvoteLocal = useMeetGreetStore((s) => s.toggleMessageUpvote);
  const localPolls = useMeetGreetStore((s) => s.polls);
  const localPollVotes = useMeetGreetStore((s) => s.pollVotes);
  const localMessageUpvotes = useMeetGreetStore((s) => s.messageUpvotes);
  const deleteTopicLocal = useMeetGreetStore((s) => s.deleteTopic);
  const getLockedRoomNameLocal = useMeetGreetStore((s) => s.getLockedRoomName);

  const localTopic = useMemo(
    () => localTopics.find((t) => t.id === id),
    [localTopics, id],
  );

  const localThread = useMemo(
    () =>
      [...localMessages]
        .filter((m) => m.topicId === id)
        .sort((a, b) => a.createdAt - b.createdAt),
    [localMessages, id],
  );

  const [remoteTopic, setRemoteTopic] = useState<Topic | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<ChatMessage[]>([]);
  const [remotePolls, setRemotePolls] = useState<RoomPoll[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(!remoteReady);
  const [remoteErr, setRemoteErr] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const localRoomPolls = useMemo(() => {
    const voterKey = getVisitorId();
    return enrichPollVotes(
      localPolls.filter((poll) => poll.topicId === id),
      localPollVotes,
      voterKey,
    );
  }, [localPolls, localPollVotes, id]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const refreshRemoteUpvotes = useCallback(
    async (messages: ChatMessage[], userId: string | null) => {
      if (!supabase || messages.length === 0) return messages;
      const upvotes = await fetchMessageUpvotes(
        supabase,
        messages.map((message) => message.id),
      );
      return applyUpvotesToMessages(messages, upvotes, userId);
    },
    [supabase],
  );

  const refreshRemotePolls = useCallback(async () => {
    if (!supabase || !id) return;
    try {
      const polls = await fetchTopicPolls(supabase, id);
      setRemotePolls(polls);
    } catch (e) {
      setRemoteErr(unknownErrorMessage(e, "Could not refresh polls."));
    }
  }, [supabase, id]);

  const refreshRemoteRoom = useCallback(async () => {
    if (!supabase || !id) return;
    try {
      const meta = await fetchTopicMeta(supabase, id);
      if (!meta) {
        setRemoteTopic(null);
        return;
      }
      setRemoteTopic(meta.topic);
    } catch (e) {
      setRemoteErr(unknownErrorMessage(e, "Could not refresh topic."));
    }
  }, [supabase, id]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!remoteReady || !supabase || !id) {
        if (!cancelled) setRemoteLoaded(true);
        return;
      }

      void (async () => {
        if (!cancelled) setRemoteLoaded(false);
        if (!cancelled) setRemoteErr(null);
        try {
          const meta = await fetchTopicMeta(supabase, id);
          if (cancelled) return;
          if (!meta) {
            setRemoteTopic(null);
            setRemoteMessages([]);
            return;
          }
          setRemoteTopic(meta.topic);

          const msgs = await fetchTopicMessages(supabase, id);
          if (cancelled) return;
          const userId = await getCurrentUserId(supabase);
          if (cancelled) return;
          setRemoteMessages(await refreshRemoteUpvotes(msgs, userId));

          const polls = await fetchTopicPolls(supabase, id);
          if (cancelled) return;
          setRemotePolls(polls);

          if (!cancelled) setCurrentUserId(await getCurrentUserId(supabase));
        } catch (e) {
          if (!cancelled) {
            setRemoteErr(unknownErrorMessage(e, "Could not load topic."));
          }
        } finally {
          if (!cancelled) setRemoteLoaded(true);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [remoteReady, supabase, id, refreshRemoteUpvotes]);

  useEffect(() => {
    if (!remoteReady || !supabase || !id) return;

    const channel = supabase
      .channel(`topic-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `topic_id=eq.${id}`,
        },
        (payload) => {
          const mapped = mapRealtimeMessageRow(
            payload.new as Parameters<typeof mapRealtimeMessageRow>[0],
          );
          setRemoteMessages((prev) => {
            const next = appendUniqueMessage(prev, mapped);
            return next.sort((a, b) => a.createdAt - b.createdAt);
          });
          void refreshRemoteRoom();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_upvotes",
        },
        () => {
          void (async () => {
            if (!supabase || !id) return;
            const msgs = await fetchTopicMessages(supabase, id);
            const userId = await getCurrentUserId(supabase);
            setRemoteMessages(await refreshRemoteUpvotes(msgs, userId));
          })();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "polls",
          filter: `topic_id=eq.${id}`,
        },
        () => void refreshRemotePolls(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_votes",
        },
        () => void refreshRemotePolls(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "topics",
          filter: `id=eq.${id}`,
        },
        () => router.replace("/topics"),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void refreshRemoteRoom();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [remoteReady, supabase, id, refreshRemoteRoom, refreshRemotePolls, refreshRemoteUpvotes, router]);

  const localThreadWithUpvotes = useMemo(() => {
    const voterKey = getVisitorId();
    return applyLocalUpvotesToMessages(localThread, localMessageUpvotes, voterKey);
  }, [localThread, localMessageUpvotes]);

  const topic = remoteReady ? remoteTopic : localTopic;
  const thread = remoteReady ? remoteMessages : localThreadWithUpvotes;
  const roomPolls = remoteReady ? remotePolls : localRoomPolls;

  const [sort, setSort] = useState<TopicSort>("hot");

  const [name, setName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [body, setBody] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [posting, setPosting] = useState(false);
  const [pollBusy, setPollBusy] = useState(false);
  const [upvoteBusy, setUpvoteBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmInitialThreadId, setDmInitialThreadId] = useState<string | null>(null);
  const [dmInitialRequest, setDmInitialRequest] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [pendingDmCount, setPendingDmCount] = useState(0);
  const [chatHydrated, setChatHydrated] = useState(false);
  const namePrefilled = useRef(false);

  useEffect(() => {
    queueMicrotask(() => setChatHydrated(true));
  }, []);

  useEffect(() => {
    if (namePrefilled.current || nameLocked || !defaultDisplayName) return;
    setName(defaultDisplayName);
    namePrefilled.current = true;
  }, [defaultDisplayName, nameLocked]);

  useEffect(() => {
    if (!id || !chatHydrated) return;

    let cancelled = false;

    async function loadLockedName() {
      if (remoteReady && supabase && currentUserId) {
        try {
          const locked = await fetchLockedRoomDisplayName(
            supabase,
            id,
            currentUserId,
          );
          if (cancelled) return;
          if (locked) {
            setName(locked);
            setNameLocked(true);
            namePrefilled.current = true;
          }
        } catch {
          /* ignore — user can still pick a name until first post */
        }
        return;
      }

      if (!remoteReady) {
        const vid = getVisitorId();
        const locked = vid ? getLockedRoomNameLocal(id, vid) : null;
        if (cancelled) return;
        if (locked) {
          setName(locked);
          setNameLocked(true);
          namePrefilled.current = true;
        }
      }
    }

    void loadLockedName();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    chatHydrated,
    remoteReady,
    supabase,
    currentUserId,
    getLockedRoomNameLocal,
  ]);

  function handleNameChange(value: string) {
    if (nameLocked) return;
    setName(value);
  }

  const canPrivateChat =
    remoteReady && supabase && currentUserId && isGoogleSignedIn(session);

  const refreshPendingDms = useCallback(async () => {
    if (!supabase || !id || !currentUserId || !canPrivateChat) {
      setPendingDmCount(0);
      return;
    }
    try {
      const reqs = await fetchDmRequests(supabase, id, currentUserId);
      setPendingDmCount(
        reqs.filter(
          (r) => r.status === "pending" && r.toUserId === currentUserId,
        ).length,
      );
    } catch {
      setPendingDmCount(0);
    }
  }, [supabase, id, currentUserId, canPrivateChat]);

  useEffect(() => {
    void refreshPendingDms();
  }, [refreshPendingDms]);

  useEffect(() => {
    if (!supabase || !id || !canPrivateChat) return;

    const channel = supabase
      .channel(`dm-requests-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dm_requests" },
        () => void refreshPendingDms(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, id, canPrivateChat, refreshPendingDms]);

  async function handlePrivateChat(message: ChatMessage) {
    if (!canPrivateChat || !supabase || !currentUserId || !message.authorUserId) {
      alert("Sign in with Google to use private chats.");
      return;
    }

    setDmInitialRequest(null);
    setDmInitialThreadId(null);

    try {
      const thread = await findThreadWithUser(
        supabase,
        id,
        currentUserId,
        message.authorUserId,
      );
      if (thread) {
        setDmInitialThreadId(thread.id);
      } else {
        setDmInitialRequest({
          userId: message.authorUserId,
          displayName: message.authorName,
        });
      }
      setDmOpen(true);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not open private chat."));
    }
  }

  function openDmInbox() {
    if (!canPrivateChat) {
      alert("Sign in with Google to use private chats.");
      return;
    }
    setDmInitialRequest(null);
    setDmInitialThreadId(null);
    setDmOpen(true);
  }

  function closeDmPanel() {
    setDmOpen(false);
    setDmInitialRequest(null);
    setDmInitialThreadId(null);
    void refreshPendingDms();
  }

  async function submitPost() {
    if (!id || posting) return;

    const trimmedBody = body.trim();
    const author = name.trim() || "anon";

    if (!trimmedBody && !gifUrl.trim() && !pendingFile) return;

    setPosting(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: "image" | "gif" | undefined;

      if (pendingFile) {
        if (remoteReady && supabase) {
          const uploaded = await uploadMessageMedia(supabase, pendingFile, id);
          mediaUrl = uploaded.url;
          mediaType = uploaded.mediaType;
        } else {
          mediaUrl = await readFileAsDataUrl(pendingFile);
          mediaType =
            pendingFile.type === "image/gif" ||
            pendingFile.name.toLowerCase().endsWith(".gif")
              ? "gif"
              : "image";
        }
      } else if (gifUrl.trim()) {
        const normalized = normalizeMediaUrlInput(gifUrl);
        if (!normalized) {
          alert("That link doesn't look valid — paste a direct image or GIF URL.");
          return;
        }
        mediaUrl = normalized.url;
        mediaType = normalized.mediaType;
      }

      const payload = {
        topicId: id,
        authorName: author,
        body: trimmedBody,
        replyToId: replyTo?.id,
        mediaUrl,
        mediaType,
      };

      if (remoteReady && supabase) {
        const posted = await sendMessageRemote(supabase, payload);
        setRemoteMessages((prev) => {
          const next = appendUniqueMessage(prev, posted);
          return next.sort((a, b) => a.createdAt - b.createdAt);
        });
      } else {
        sendMessageLocal(payload);
      }

      setBody("");
      setGifUrl("");
      setPendingFile(null);
      setReplyTo(null);
      if (!nameLocked) {
        setNameLocked(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setPosting(false);
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  async function submitPoll(input: { question: string; options: string[] }) {
    if (!id || pollBusy) return;

    const author = name.trim() || "anon";
    setPollBusy(true);
    try {
      if (remoteReady && supabase) {
        await createPollRemote(supabase, {
          topicId: id,
          authorName: author,
          question: input.question,
          options: input.options,
        });
        await refreshRemotePolls();
      } else {
        createPollLocal({
          topicId: id,
          authorName: author,
          question: input.question,
          options: input.options,
        });
      }

      if (!nameLocked) {
        setNameLocked(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not post poll.");
    } finally {
      setPollBusy(false);
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  async function handleUpvote(message: ChatMessage) {
    if (upvoteBusy) return;

    setUpvoteBusy(true);
    try {
      if (remoteReady && supabase) {
        const upvoted = await toggleMessageUpvoteRemote(supabase, message.id);
        setRemoteMessages((prev) =>
          prev.map((entry) =>
            entry.id === message.id
              ? {
                  ...entry,
                  myUpvote: upvoted,
                  upvoteCount: Math.max(
                    0,
                    (entry.upvoteCount ?? 0) + (upvoted ? 1 : -1),
                  ),
                }
              : entry,
          ),
        );
      } else {
        const voterKey = getVisitorId();
        if (!voterKey) {
          alert("Could not save your upvote in this browser.");
          return;
        }
        toggleMessageUpvoteLocal(message.id, voterKey);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save upvote.");
    } finally {
      setUpvoteBusy(false);
    }
  }

  async function handleVotePoll(pollId: string, optionId: string) {
    if (pollBusy) return;

    setPollBusy(true);
    try {
      if (remoteReady && supabase) {
        await votePollRemote(supabase, pollId, optionId);
        await refreshRemotePolls();
      } else {
        const voterKey = getVisitorId();
        if (!voterKey) {
          alert("Could not save your vote in this browser.");
          return;
        }
        votePollLocal(pollId, optionId, voterKey);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save vote.");
    } finally {
      setPollBusy(false);
    }
  }

  const shareUrl = id ? roomShareUrl(id) : "";

  const canRemove = topic
    ? canDeleteTopic(topic, {
        visitorId: getVisitorId(),
        userId: currentUserId,
      })
    : false;

  async function removeRoom() {
    if (!topic || !id) return;
    if (
      !window.confirm(
        `Close "${topic.title}"? Everyone loses this topic.`,
      )
    ) {
      return;
    }

    if (remoteReady && supabase) {
      try {
        await deleteTopicRemote(supabase, id);
        router.push("/topics");
      } catch (err) {
        alert(unknownErrorMessage(err, "Could not close topic."));
      }
      return;
    }

    if (deleteTopicLocal(id, currentUserId)) {
      router.push("/topics");
    } else {
      alert("Only whoever started this topic (or the app admin) can close it.");
    }
  }

  if (!id) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Missing topic id</h1>
        <Link
          href="/explore"
          className="inline-flex w-fit rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Back to map
        </Link>
      </div>
    );
  }

  if (remoteReady && !remoteLoaded) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  if (remoteErr) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Something broke</h1>
        <p className="text-sm text-danger-text">{remoteErr}</p>
        <Link
          href="/topics"
          className="inline-flex w-fit rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          All topics
        </Link>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Not found</h1>
        <p className="text-sm text-subtle">
          Gone or wrong link — happens.
        </p>
        <Link
          href="/topics"
          className="inline-flex w-fit rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          All topics
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-3xl flex-col px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 space-y-2">
          <Link
            href="/topics"
            className="text-sm font-semibold text-brand hover:underline"
          >
            ← Tea
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {topic.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canPrivateChat ? (
            <button
              type="button"
              onClick={openDmInbox}
              className="relative rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-background"
            >
              Private chats
              {pendingDmCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {pendingDmCount}
                </span>
              ) : null}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-background"
          >
            Share
          </button>
          {canRemove ? (
            <button
              type="button"
              onClick={() => void removeRoom()}
              className="rounded-lg border border-danger-border bg-danger-bg px-3 py-1.5 text-xs font-bold text-danger-text hover:opacity-90"
            >
              Close topic
            </button>
          ) : null}
        </div>
      </header>

      {!chatHydrated ? (
        <p className="py-4 text-sm text-subtle">Loading messages…</p>
      ) : (
        <MessageBoard
          messages={thread}
          polls={roomPolls}
          name={name}
          nameLocked={nameLocked}
          body={body}
          gifUrl={gifUrl}
          replyTo={replyTo}
          pendingFile={pendingFile}
          composerDisabled={
            posting || (remoteReady && (!supabase || !remoteLoaded))
          }
          pollDisabled={
            pollBusy || posting || (remoteReady && (!supabase || !remoteLoaded))
          }
          currentUserId={currentUserId}
          onPrivateChat={canPrivateChat ? handlePrivateChat : undefined}
          onNameChange={handleNameChange}
          onBodyChange={setBody}
          onGifUrlChange={setGifUrl}
          onFilePick={setPendingFile}
          onReply={(message) => {
            setReplyTo(message);
            queueMicrotask(() =>
              bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            );
          }}
          onCancelReply={() => setReplyTo(null)}
          onSubmit={() => void submitPost()}
          onCreatePoll={(input) => void submitPoll(input)}
          onVotePoll={(pollId, optionId) => void handleVotePoll(pollId, optionId)}
          sort={sort}
          onSortChange={setSort}
          onUpvote={(message) => void handleUpvote(message)}
          upvoteDisabled={
            upvoteBusy || posting || (remoteReady && (!supabase || !remoteLoaded))
          }
        />
      )}
      <div ref={bottomRef} />

      <ShareRoomModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={topic.title}
        roomUrl={shareUrl}
      />

      {canPrivateChat && supabase && currentUserId ? (
        <PrivateChatPanel
          open={dmOpen}
          onClose={closeDmPanel}
          supabase={supabase}
          topicId={id}
          currentUserId={currentUserId}
          initialThreadId={dmInitialThreadId}
          initialRequestUserId={dmInitialRequest?.userId ?? null}
          initialRequestDisplayName={dmInitialRequest?.displayName}
          onDataChange={() => void refreshPendingDms()}
        />
      ) : null}
    </div>
  );
}
