"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import {
  createTopicRemote,
  fetchExploreFeeds,
  rankTopicsByMessages,
} from "@/lib/supabase/meet-greet-remote";
import { unknownErrorMessage } from "@/lib/error-message";
import {
  trendingTopics,
  topicMessageCount,
  useMeetGreetStore,
} from "@/lib/store";

import "leaflet/dist/leaflet.css";

const ExploreMap = dynamic(
  () =>
    import("@/components/ExploreMap").then((m) => ({
      default: m.ExploreMap,
    })),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex h-[min(72vh,580px)] min-h-[340px] w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-200 via-yellow-100 to-lime-100 text-sm font-bold text-stone-600 shadow-[0_0_0_4px_#fff,0_12px_40px_rgb(0_0_0_0.12)]">
      Loading map…
    </div>
  );
}

const HOT_TOPIC_MESSAGES = 3;

export default function ExplorePage() {
  const router = useRouter();
  const { supabase, remoteReady } = useSupabase();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const topicMemberIds = useMeetGreetStore((s) => s.topicMemberIds ?? {});
  const createTopicLocal = useMeetGreetStore((s) => s.createTopic);

  const [rxTopics, setRxTopics] = useState<Awaited<
    ReturnType<typeof fetchExploreFeeds>
  >["topics"]>([]);
  const [rxTopicActivity, setRxTopicActivity] = useState<Record<string, number>>(
    {},
  );
  const [rxTopicJoinCounts, setRxTopicJoinCounts] = useState<
    Record<string, number>
  >({});
  const [rxLoading, setRxLoading] = useState(false);
  const [rxErr, setRxErr] = useState<string | null>(null);

  const reloadExplore = useCallback(async () => {
    if (!supabase || !remoteReady) return;
    setRxLoading(true);
    try {
      const feed = await fetchExploreFeeds(supabase);
      setRxTopics(feed.topics);
      setRxTopicActivity(feed.topicActivity);
      setRxTopicJoinCounts(feed.topicJoinCounts);
      setRxErr(null);
    } catch (e) {
      setRxErr(unknownErrorMessage(e, "Could not sync explore feed."));
    } finally {
      setRxLoading(false);
    }
  }, [supabase, remoteReady]);

  useEffect(() => {
    queueMicrotask(() => void reloadExplore());
  }, [reloadExplore]);

  useEffect(() => {
    function scrollToHashForm() {
      const hash = window.location.hash;
      if (hash !== "#spill-tea") return;
      document.querySelector(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    scrollToHashForm();
    window.addEventListener("hashchange", scrollToHashForm);
    return () => window.removeEventListener("hashchange", scrollToHashForm);
  }, []);

  useEffect(() => {
    if (!supabase || !remoteReady) return;

    const channel = supabase
      .channel("explore-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics" },
        () => void reloadExplore(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void reloadExplore(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topic_members" },
        () => void reloadExplore(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, reloadExplore]);

  const [viewport, setViewport] = useState({ lat: 19.076, lng: 72.8777 });
  const [topicTitle, setTopicTitle] = useState("");
  const [locStatus, setLocStatus] = useState<string | null>(null);
  const [userPin, setUserPin] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const topicActivityLocal = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of localMessages) {
      acc[m.topicId] = (acc[m.topicId] ?? 0) + 1;
    }
    return acc;
  }, [localMessages]);

  const topicJoinCountsLocal = useMemo(() => {
    const o: Record<string, number> = {};
    for (const [tid, ids] of Object.entries(topicMemberIds)) {
      o[tid] = ids.length;
    }
    return o;
  }, [topicMemberIds]);

  const topics = remoteReady ? rxTopics : localTopics;
  const topicActivity = remoteReady ? rxTopicActivity : topicActivityLocal;
  const topicJoinCounts = remoteReady ? rxTopicJoinCounts : topicJoinCountsLocal;

  const ranked = remoteReady
    ? rankTopicsByMessages(topics, topicActivity)
    : trendingTopics(localTopics, localMessages);

  function locateMe() {
    if (!navigator.geolocation) {
      setLocStatus("Geolocation not supported in this browser.");
      return;
    }
    setLocStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPin({ lat, lng });
        setViewport({ lat, lng });
        setLocStatus(null);
      },
      () => setLocStatus("Could not read location — check permissions."),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  async function submitTopic(e: React.FormEvent) {
    e.preventDefault();
    const title = topicTitle.trim();
    if (!title) return;

    if (remoteReady && supabase) {
      try {
        const tid = await createTopicRemote(supabase, {
          title,
          lat: viewport.lat,
          lng: viewport.lng,
        });
        setTopicTitle("");
        router.push(`/topics/${tid}`);
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "Could not create topic remotely.",
        );
      }
      return;
    }

    const id = createTopicLocal({
      title,
      lat: viewport.lat,
      lng: viewport.lng,
    });
    setTopicTitle("");
    router.push(`/topics/${id}`);
  }

  const msgCountForRow = (topicId: string) =>
    remoteReady ? (topicActivity[topicId] ?? 0) : topicMessageCount(topicId, localMessages);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tea on the map
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-subtle">
          Pin a convo near you — yellow tea bubbles are open rooms, fire bubbles
          are the hottest. Tap one to spill. No map? Browse{" "}
          <Link href="/topics" className="font-bold text-brand hover:underline">
            tea rooms
          </Link>
          .
        </p>
        {remoteReady && rxLoading ? (
          <p className="text-xs font-semibold text-brand">Updating…</p>
        ) : null}
        {rxErr ? (
          <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
            {rxErr}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-subtle">
              🍵 tea rooms · 🔥 trending
            </p>
            <button
              type="button"
              onClick={locateMe}
              className="rounded-full bg-[#fffc00] px-4 py-2 text-xs font-extrabold text-stone-900 shadow-[0_2px_0_rgb(0_0_0_0.12)] hover:brightness-95"
            >
              📍 Find me
            </button>
          </div>
          {locStatus ? (
            <p className="text-xs text-subtle">{locStatus}</p>
          ) : null}
          <div className="h-[min(72vh,580px)] min-h-[340px] overflow-hidden rounded-[1.5rem] bg-sky-200 p-0">
            <ExploreMap
              topics={topics}
              topicActivity={topicActivity}
              topicJoinCounts={topicJoinCounts}
              hotThreshold={HOT_TOPIC_MESSAGES}
              onViewportCenter={(lat, lng) => setViewport({ lat, lng })}
              userLocate={userPin}
            />
          </div>
          <p className="text-xs text-subtle">
            Pan the map — new tea rooms drop where you’re looking. Blue dot is you.
          </p>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-bold text-foreground">
              Busiest tea rooms
            </h2>
            <ol className="mt-3 space-y-2">
              {ranked.slice(0, 8).map((t, i) => {
                const n = msgCountForRow(t.id);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/topics/${t.id}`}
                      className="group flex gap-2 rounded-lg px-2 py-2 hover:bg-brand-soft"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground group-hover:underline">
                          {t.title}
                        </span>
                        <span className="text-xs text-subtle">
                          {n} messages
                          {n >= HOT_TOPIC_MESSAGES ? " · hot" : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {ranked.length === 0 ? (
                <li className="text-sm text-subtle">
                  Nothing yet — start one below.
                </li>
              ) : null}
            </ol>
          </div>

          <form
            id="spill-tea"
            onSubmit={(e) => void submitTopic(e)}
            className="scroll-mt-24 rounded-xl border border-border bg-surface p-4"
          >
            <h2 className="text-sm font-bold text-foreground">
              SpillTheTea
            </h2>
            <p className="mt-1 text-xs text-subtle">
              Name the convo — anonymous chat, any topic. Optional map pin at center.
            </p>
            <label className="mt-3 block text-xs font-semibold text-foreground">
              What&apos;s the tea?
              <input
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Why is everyone ghosting after one date?"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <button
              type="submit"
              disabled={remoteReady && (!supabase || rxLoading)}
              className="mt-3 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open tea room
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
