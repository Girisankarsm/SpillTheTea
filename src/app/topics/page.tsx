"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import { useSupabase } from "@/components/SupabaseProvider";
import { canDeleteTopic } from "@/lib/admin";
import {
  createTopicRemote,
  deleteTopicRemote,
  fetchExploreFeeds,
  getCurrentUserId,
  rankTopicsByMessages,
} from "@/lib/supabase/meet-greet-remote";
import { unknownErrorMessage } from "@/lib/error-message";
import { roomShareUrl } from "@/lib/share-room";
import {
  trendingTopics,
  topicMessageCount,
  useMeetGreetStore,
} from "@/lib/store";
import { getVisitorId } from "@/lib/visitor";

export default function TopicsDirectoryPage() {
  const router = useRouter();
  const { supabase, remoteReady } = useSupabase();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const createTopicLocal = useMeetGreetStore((s) => s.createTopic);
  const deleteTopicLocal = useMeetGreetStore((s) => s.deleteTopic);

  const [newTeaTitle, setNewTeaTitle] = useState("");

  const [rxTopics, setRxTopics] = useState<Awaited<
    ReturnType<typeof fetchExploreFeeds>
  >["topics"]>([]);
  const [rxActivity, setRxActivity] = useState<Record<string, number>>({});
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
      setRxErr(null);
      setCurrentUserId(await getCurrentUserId(supabase));
    } catch (e) {
      setRxErr(unknownErrorMessage(e, "Could not load tea rooms."));
    } finally {
      setRxLoading(false);
    }
  }, [supabase, remoteReady]);

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, [reload]);

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

  const ranked = remoteReady
    ? rankTopicsByMessages(rxTopics, rxActivity)
    : trendingTopics(localTopics, localMessages);

  const msgCount = (topicId: string) =>
    remoteReady ? (rxActivity[topicId] ?? 0) : topicMessageCount(topicId, localMessages);

  async function removeRoom(topicId: string, title: string) {
    if (
      !window.confirm(
        `Close "${title}"? This deletes the convo for everyone.`,
      )
    ) {
      return;
    }

    if (remoteReady && supabase) {
      try {
        await deleteTopicRemote(supabase, topicId);
        await reload();
      } catch (e) {
        alert(unknownErrorMessage(e, "Could not close tea room."));
      }
      return;
    }

    if (!deleteTopicLocal(topicId, currentUserId)) {
      alert("Only the person who started this room (or the app admin) can close it.");
    }
  }

  async function spillTea(e: React.FormEvent) {
    e.preventDefault();
    const title = newTeaTitle.trim();
    if (!title) return;

    if (remoteReady && supabase) {
      try {
        const tid = await createTopicRemote(supabase, {
          title,
          lat: 0,
          lng: 0,
        });
        setNewTeaTitle("");
        router.push(`/topics/${tid}`);
      } catch (err) {
        alert(unknownErrorMessage(err, "Could not start tea room."));
      }
      return;
    }

    const id = createTopicLocal({ title, lat: 0, lng: 0 });
    setNewTeaTitle("");
    router.push(`/topics/${id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tea rooms
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/explore#spill-tea"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              <span className="text-lg leading-none" aria-hidden>
                +
              </span>
              SpillTheTea
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-subtle hover:border-brand hover:text-foreground"
            >
              Map
            </Link>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-subtle">
          Anonymous convo rooms about anything. Open one, pick a nickname, and talk.
          Only the person who started a room (or the app admin) can close it.
        </p>
        {remoteReady && rxLoading ? (
          <p className="text-xs font-semibold text-brand">Refreshing…</p>
        ) : null}
        {rxErr ? (
          <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
            {rxErr}
          </p>
        ) : null}
      </header>

      <form
        onSubmit={(e) => void spillTea(e)}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-bold text-foreground">SpillTheTea</h2>
        <p className="mt-1 text-xs text-subtle">
          Start an anonymous convo room about anything — no map needed.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newTeaTitle}
            onChange={(e) => setNewTeaTitle(e.target.value)}
            placeholder="What's the tea?"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={remoteReady && (!supabase || rxLoading)}
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open room
          </button>
        </div>
      </form>

      <ul className="flex flex-col gap-3">
        {ranked.map((t) => {
          const msgs = msgCount(t.id);
          const visitorId = getVisitorId();
          const deletable = canDeleteTopic(t, {
            visitorId,
            userId: currentUserId,
          });
          return (
            <li key={t.id}>
              <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-bold text-foreground">{t.title}</h2>
                  <p className="text-xs text-subtle">
                    {msgs} messages
                    {remoteReady ? "" : " · this device"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {deletable ? (
                    <button
                      type="button"
                      onClick={() => void removeRoom(t.id, t.title)}
                      className="rounded-lg border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-bold text-danger-text hover:opacity-90"
                    >
                      Close room
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShareRoom({ id: t.id, title: t.title })}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-brand-soft"
                  >
                    Share
                  </button>
                  <Link
                    href={`/topics/${t.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
                  >
                    Open chat
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-subtle">No tea rooms yet.</p>
          <Link
            href="/explore#spill-tea"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <span aria-hidden>+</span> SpillTheTea
          </Link>
        </div>
      ) : null}

      <ShareRoomModal
        open={shareRoom !== null}
        onClose={() => setShareRoom(null)}
        title={shareRoom?.title ?? ""}
        roomUrl={shareRoom ? roomShareUrl(shareRoom.id) : ""}
      />
    </div>
  );
}
