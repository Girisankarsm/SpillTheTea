"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CreateTopicPanel, type CreateTopicPayload } from "@/components/CreateTopicPanel";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import { TeaFeedCard } from "@/components/TeaFeedCard";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { canDeleteTopic } from "@/lib/admin";
import type { TopicSort } from "@/lib/message-upvotes";
import {
  createTopicRemote,
  deleteTopicRemote,
  fetchExploreFeeds,
  fetchTopicPreviewsRemote,
  getCurrentUserId,
  sendMessageRemote,
} from "@/lib/supabase/meet-greet-remote";
import { readFileAsDataUrl } from "@/lib/message-thread";
import {
  normalizeMediaUrlInput,
  uploadMessageMedia,
} from "@/lib/supabase/message-media";
import { createPollRemote } from "@/lib/supabase/poll-remote";
import { unknownErrorMessage } from "@/lib/error-message";
import { roomShareUrl } from "@/lib/share-room";
import {
  buildLocalTopicPreviews,
  sortTopicsForFeed,
  type TopicPreview,
} from "@/lib/tea-feed";
import { topicMessageCount, useMeetGreetStore } from "@/lib/store";
import { getUserLocation, primeUserLocation } from "@/lib/geolocation";
import { getVisitorId } from "@/lib/visitor";

export default function TopicsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-sm text-subtle">Loading tea…</p>
        </div>
      }
    >
      <TopicsDirectoryContent />
    </Suspense>
  );
}

function TopicsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, remoteReady } = useSupabase();
  const { defaultDisplayName } = useUserProfile();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const createTopicLocal = useMeetGreetStore((s) => s.createTopic);
  const sendMessageLocal = useMeetGreetStore((s) => s.sendMessage);
  const createPollLocal = useMeetGreetStore((s) => s.createPoll);
  const deleteTopicLocal = useMeetGreetStore((s) => s.deleteTopic);

  const [posting, setPosting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sort, setSort] = useState<TopicSort>("hot");

  const [rxTopics, setRxTopics] = useState<Awaited<
    ReturnType<typeof fetchExploreFeeds>
  >["topics"]>([]);
  const [rxActivity, setRxActivity] = useState<Record<string, number>>({});
  const [rxJoinCounts, setRxJoinCounts] = useState<Record<string, number>>({});
  const [rxPreviews, setRxPreviews] = useState<Record<string, TopicPreview>>({});
  const [rxLoading, setRxLoading] = useState(false);
  const [rxErr, setRxErr] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareRoom, setShareRoom] = useState<{ id: string; title: string } | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady) return;
    setRxLoading(true);
    try {
      const feed = await fetchExploreFeeds(supabase);
      setRxTopics(feed.topics);
      setRxActivity(feed.topicActivity);
      setRxJoinCounts(feed.topicJoinCounts);
      setRxErr(null);
      setCurrentUserId(await getCurrentUserId(supabase));

      const previews = await fetchTopicPreviewsRemote(
        supabase,
        feed.topics.map((t) => t.id),
      );
      setRxPreviews(previews);
    } catch (e) {
      setRxErr(unknownErrorMessage(e, "Could not load topics."));
    } finally {
      setRxLoading(false);
    }
  }, [supabase, remoteReady]);

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, [reload]);

  useEffect(() => {
    queueMicrotask(() => primeUserLocation());
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      requestAnimationFrame(() => {
        document.getElementById("create-tea-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!supabase || !remoteReady) return;
    const channel = supabase
      .channel("topics-directory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics" },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topic_members" },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, reload]);

  const topics = remoteReady ? rxTopics : localTopics;
  const activity = useMemo(() => {
    if (remoteReady) return rxActivity;
    const counts: Record<string, number> = {};
    for (const topic of localTopics) {
      counts[topic.id] = topicMessageCount(topic.id, localMessages);
    }
    return counts;
  }, [remoteReady, rxActivity, localTopics, localMessages]);

  const previews = useMemo(() => {
    if (remoteReady) return rxPreviews;
    return buildLocalTopicPreviews(
      localMessages,
      localTopics.map((t) => t.id),
    );
  }, [remoteReady, rxPreviews, localMessages, localTopics]);

  const sorted = useMemo(
    () => sortTopicsForFeed(topics, activity, sort),
    [topics, activity, sort],
  );

  const msgCount = (topicId: string) => activity[topicId] ?? 0;

  function sortButtonClass(active: boolean): string {
    return [
      "rounded-md px-2.5 py-1 text-xs font-bold transition",
      active
        ? "bg-brand text-white"
        : "text-subtle hover:bg-brand-soft hover:text-foreground",
    ].join(" ");
  }

  async function removeRoom(topicId: string, title: string) {
    if (
      !window.confirm(
        `Close "${title}"? This deletes the topic for everyone.`,
      )
    ) {
      return;
    }

    if (remoteReady && supabase) {
      try {
        await deleteTopicRemote(supabase, topicId);
        await reload();
      } catch (e) {
        alert(unknownErrorMessage(e, "Could not close topic."));
      }
      return;
    }

    if (!deleteTopicLocal(topicId, currentUserId)) {
      alert("Only the person who started this topic (or the app admin) can close it.");
    }
  }

  async function spillTea(payload: CreateTopicPayload) {
    if (posting) return;

    const authorName = defaultDisplayName?.trim() || "anon";
    setPosting(true);
    try {
      const location = await getUserLocation();
      const lat = location?.lat ?? 0;
      const lng = location?.lng ?? 0;

      if (remoteReady && supabase) {
        const tid = await createTopicRemote(supabase, {
          title: payload.title,
          lat,
          lng,
        });

        if (payload.kind === "text" && payload.body) {
          await sendMessageRemote(supabase, {
            topicId: tid,
            authorName,
            body: payload.body,
          });
        }

        if (payload.kind === "link") {
          const linkBody = payload.body
            ? `${payload.body}\n\n${payload.linkUrl}`
            : payload.linkUrl;
          await sendMessageRemote(supabase, {
            topicId: tid,
            authorName,
            body: linkBody,
          });
        }

        if (payload.kind === "media") {
          let mediaUrl: string | undefined;
          let mediaType: "image" | "gif" | undefined;

          if (payload.mediaFile) {
            const uploaded = await uploadMessageMedia(
              supabase,
              payload.mediaFile,
              tid,
            );
            mediaUrl = uploaded.url;
            mediaType = uploaded.mediaType;
          } else if (payload.gifUrl) {
            const normalized = normalizeMediaUrlInput(payload.gifUrl);
            if (!normalized) throw new Error("Invalid GIF URL.");
            mediaUrl = normalized.url;
            mediaType = normalized.mediaType;
          }

          await sendMessageRemote(supabase, {
            topicId: tid,
            authorName,
            body: payload.body,
            mediaUrl,
            mediaType,
          });
        }

        if (payload.kind === "poll") {
          await createPollRemote(supabase, {
            topicId: tid,
            authorName,
            question: payload.pollQuestion,
            options: payload.pollOptions,
          });
        }

        router.push(`/topics/${tid}`);
        return;
      }

      const id = createTopicLocal({ title: payload.title, lat, lng });

      if (payload.kind === "text" && payload.body) {
        sendMessageLocal({ topicId: id, authorName, body: payload.body });
      }

      if (payload.kind === "link") {
        const linkBody = payload.body
          ? `${payload.body}\n\n${payload.linkUrl}`
          : payload.linkUrl;
        sendMessageLocal({ topicId: id, authorName, body: linkBody });
      }

      if (payload.kind === "media") {
        let mediaUrl: string | undefined;
        let mediaType: "image" | "gif" | undefined;

        if (payload.mediaFile) {
          mediaUrl = await readFileAsDataUrl(payload.mediaFile);
          mediaType =
            payload.mediaFile.type === "image/gif" ||
            payload.mediaFile.name.toLowerCase().endsWith(".gif")
              ? "gif"
              : "image";
        } else if (payload.gifUrl) {
          const normalized = normalizeMediaUrlInput(payload.gifUrl);
          if (!normalized) throw new Error("Invalid GIF URL.");
          mediaUrl = normalized.url;
          mediaType = normalized.mediaType;
        }

        sendMessageLocal({
          topicId: id,
          authorName,
          body: payload.body,
          mediaUrl,
          mediaType,
        });
      }

      if (payload.kind === "poll") {
        createPollLocal({
          topicId: id,
          authorName,
          question: payload.pollQuestion,
          options: payload.pollOptions,
        });
      }

      router.push(`/topics/${id}`);
    } catch (err) {
      alert(unknownErrorMessage(err, "Could not start topic."));
      throw err;
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[640px] flex-col gap-4 px-4 py-4 sm:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Home</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-subtle hover:border-brand hover:text-foreground"
          >
            Map
          </Link>
        </div>
      </header>

      {createOpen ? (
        <div id="create-tea-panel" className="scroll-mt-24">
          <CreateTopicPanel
            onSubmit={spillTea}
            onClose={() => {
              setCreateOpen(false);
              router.replace("/topics");
            }}
            disabled={remoteReady && (!supabase || rxLoading)}
            submitting={posting}
          />
        </div>
      ) : null}

      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-subtle">
          Welcome home! Explore topics and discussions near you.
        </p>
        <Link
          href="/topics/tea"
          className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          📝 Go to Tea
        </Link>
      </div>
    </div>
  );
}
