"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateTopicPanel, type CreateTopicPayload } from "@/components/CreateTopicPanel";
import { TeaFeedCard } from "@/components/TeaFeedCard";
import { useBackend } from "@/components/BackendProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { fetchDuties } from "@/lib/backend/duty-remote";
import {
  fetchExploreFeeds,
  fetchTopicPreviewsRemote,
  spillTeaRemote,
} from "@/lib/backend/meet-greet-remote";
import { fetchRides } from "@/lib/backend/ride-remote";
import { readFileAsDataUrl } from "@/lib/message-thread";
import { normalizeMediaUrlInput } from "@/lib/backend/message-media";
import { unknownErrorMessage } from "@/lib/error-message";
import { getUserLocation, primeUserLocation } from "@/lib/geolocation";
import { primaryButtonSmClass, sectionLabelClass } from "@/lib/ui";
import {
  buildLocalTopicPreviews,
  sortTopicsForFeed,
  type TopicPreview,
} from "@/lib/tea-feed";
import { topicMessageCount, useMeetGreetStore } from "@/lib/store";

const quickActions = [
  {
    href: "/topics/tea",
    icon: "💬",
    title: "Tea",
    desc: "Browse & post topics",
    color: "from-white/10 to-white/5",
  },
  {
    href: "/duties",
    icon: "✅",
    title: "Duties",
    desc: "Paid micro-tasks",
    color: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    href: "/rides",
    icon: "🚗",
    title: "Rides",
    desc: "Pool near you",
    color: "from-sky-500/10 to-sky-500/5",
  },
  {
    href: "/explore",
    icon: "🗺️",
    title: "Map",
    desc: "See what's nearby",
    color: "from-violet-500/10 to-violet-500/5",
  },
] as const;

function StatSkeleton() {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-3">
      <div className="skeleton h-6 w-10" />
      <div className="skeleton mt-2 h-3 w-16" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton mt-3 h-3 w-full" />
          <div className="skeleton mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { backend, remoteReady } = useBackend();
  const { defaultDisplayName, profile } = useUserProfile();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const localDuties = useMeetGreetStore((s) => s.duties);
  const createTopicLocal = useMeetGreetStore((s) => s.createTopic);
  const sendMessageLocal = useMeetGreetStore((s) => s.sendMessage);
  const createPollLocal = useMeetGreetStore((s) => s.createPoll);

  const [createOpen, setCreateOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rxTopics, setRxTopics] = useState<Awaited<ReturnType<typeof fetchExploreFeeds>>["topics"]>([]);
  const [rxActivity, setRxActivity] = useState<Record<string, number>>({});
  const [rxPreviews, setRxPreviews] = useState<Record<string, TopicPreview>>({});
  const [dutyCount, setDutyCount] = useState(0);
  const [rideCount, setRideCount] = useState(0);

  const reload = useCallback(async () => {
    if (!backend || !remoteReady) return;
    setLoading(true);
    try {
      const [feed, duties, rides] = await Promise.all([
        fetchExploreFeeds(backend),
        fetchDuties(backend),
        fetchRides(backend),
      ]);
      setRxTopics(feed.topics);
      setRxActivity(feed.topicActivity);
      setDutyCount(duties.length);
      setRideCount(rides.length);

      const previews = await fetchTopicPreviewsRemote(
        backend,
        feed.topics.map((t) => t.id),
      );
      setRxPreviews(previews);
    } catch {
      /* stats are optional on home */
    } finally {
      setLoading(false);
    }
  }, [backend, remoteReady]);

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

  const hotTopics = useMemo(
    () => sortTopicsForFeed(topics, activity, "hot").slice(0, 3),
    [topics, activity],
  );

  const stats = {
    topics: topics.length,
    duties: remoteReady ? dutyCount : localDuties.length,
    rides: remoteReady ? rideCount : 0,
  };

  const greeting = defaultDisplayName?.trim() || "there";
  const avatarInitial = greeting.slice(0, 1).toUpperCase();
  const avatarUrl = profile.avatarUrl?.trim() || null;

  async function spillTea(payload: CreateTopicPayload) {
    if (posting) return;
    const authorName = defaultDisplayName?.trim() || "anon";
    setPosting(true);
    try {
      const location = await getUserLocation();
      const lat = location?.lat ?? 0;
      const lng = location?.lng ?? 0;

      if (remoteReady && backend) {
        const tid = await spillTeaRemote(backend, payload, authorName, lat, lng);
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
    <div className="mx-auto flex w-full min-w-0 max-w-[720px] flex-col gap-5 px-4 py-4 sm:gap-6 sm:py-6">
      {/* Greeting */}
      <header className="animate-fade-up flex items-start justify-between gap-4">
        <div>
          <p className={sectionLabelClass}>Your neighborhood</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
            Hey, {greeting} 👋
          </h1>
          <p className="mt-1 text-sm text-subtle">
            What&apos;s happening near you today?
          </p>
        </div>
        <Link
          href="/profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-2 transition hover:border-brand-border"
          title="Your profile"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-foreground">{avatarInitial}</span>
          )}
        </Link>
      </header>

      {/* Live badge */}
      <div className="card-interactive animate-fade-up flex items-center gap-3 px-4 py-3" style={{ animationDelay: "0.05s" }}>
        <span className="live-dot shrink-0" />
        <p className="text-sm text-subtle">
          <strong className="font-medium text-foreground">{stats.topics} topics</strong> live near you
          {stats.duties > 0 ? (
            <> · <strong className="font-medium text-foreground">{stats.duties} duties</strong> open</>
          ) : null}
          {stats.rides > 0 ? (
            <> · <strong className="font-medium text-foreground">{stats.rides} rides</strong> available</>
          ) : null}
        </p>
      </div>

      {/* Quick post bar */}
      {!createOpen ? (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="card-interactive animate-fade-up flex w-full items-center gap-3 px-4 py-3.5 text-left"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-semibold">
            {avatarInitial}
          </span>
          <span className="flex-1 text-sm text-muted">Spill some tea…</span>
          <span className={primaryButtonSmClass}>Post</span>
        </button>
      ) : (
        <div id="create-tea-panel" className="scroll-mt-24 animate-fade-up">
          <CreateTopicPanel
            onSubmit={spillTea}
            onClose={() => {
              setCreateOpen(false);
              router.replace("/topics");
            }}
            disabled={remoteReady && (!backend || loading)}
            submitting={posting}
          />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {loading && remoteReady ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Link href="/topics/tea" className="card-interactive px-3 py-3 sm:px-4">
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">{stats.topics}</p>
              <p className="mt-0.5 text-[11px] text-muted">Topics</p>
            </Link>
            <Link href="/duties" className="card-interactive px-3 py-3 sm:px-4">
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">{stats.duties}</p>
              <p className="mt-0.5 text-[11px] text-muted">Duties</p>
            </Link>
            <Link href="/rides" className="card-interactive px-3 py-3 sm:px-4">
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">{stats.rides}</p>
              <p className="mt-0.5 text-[11px] text-muted">Rides</p>
            </Link>
          </>
        )}
      </div>

      {/* Quick actions */}
      <section>
        <p className={`${sectionLabelClass} mb-3`}>Quick actions</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`card-interactive flex flex-col gap-2 bg-gradient-to-br ${action.color} p-3.5 sm:p-4`}
            >
              <span className="text-xl" aria-hidden>{action.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="mt-0.5 text-[11px] text-muted">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className={sectionLabelClass}>Trending near you</p>
          <Link
            href="/topics/tea"
            className="text-xs font-medium text-subtle transition hover:text-foreground"
          >
            See all →
          </Link>
        </div>

        {loading && remoteReady ? (
          <FeedSkeleton />
        ) : hotTopics.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {hotTopics.map((t) => (
              <TeaFeedCard
                key={t.id}
                topic={t}
                messageCount={activity[t.id] ?? 0}
                preview={previews[t.id]}
                onShare={() => {}}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/50 px-4 py-10 text-center">
            <p className="text-2xl" aria-hidden>🍵</p>
            <p className="mt-2 text-sm font-medium text-foreground">No topics yet</p>
            <p className="mt-1 text-xs text-subtle">Be the first to spill some tea in your area.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={`${primaryButtonSmClass} mt-4`}
            >
              + Post tea
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
