"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateTopicPanel, type CreateTopicPayload } from "@/components/CreateTopicPanel";
import { PageContainer } from "@/components/PageContainer";
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
import { primaryButtonSmClass, sectionGapClass, sectionLabelClass } from "@/lib/ui";
import {
  buildLocalTopicPreviews,
  sortTopicsForFeed,
  type TopicPreview,
} from "@/lib/tea-feed";
import { topicMessageCount, useMeetGreetStore } from "@/lib/store";

const quickActions = [
  { href: "/topics/tea", icon: "💬", title: "Tea", desc: "Browse & post topics" },
  { href: "/duties", icon: "✅", title: "Duties", desc: "Paid micro-tasks" },
  { href: "/rides", icon: "🚗", title: "Rides", desc: "Pool near you" },
  { href: "/explore", icon: "🗺️", title: "Map", desc: "See what's nearby" },
] as const;

const STAGGER = ["stagger-4", "stagger-5", "stagger-6"] as const;

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatSkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className="skeleton h-7 w-12" />
      <div className="skeleton mt-2.5 h-3 w-16" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[var(--radius)] border border-border bg-surface p-5">
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

  const createFromUrl = searchParams.get("create") === "1";
  const [manualCreateOpen, setManualCreateOpen] = useState(false);
  const createOpen = createFromUrl || manualCreateOpen;
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
      /* optional */
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
    if (!createFromUrl) return;
    requestAnimationFrame(() => {
      document.getElementById("create-tea-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [createFromUrl]);

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
    return buildLocalTopicPreviews(localMessages, localTopics.map((t) => t.id));
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

  const name = defaultDisplayName?.trim() || "friend";
  const avatarInitial = name.slice(0, 1).toUpperCase();
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
        const linkBody = payload.body ? `${payload.body}\n\n${payload.linkUrl}` : payload.linkUrl;
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
        sendMessageLocal({ topicId: id, authorName, body: payload.body, mediaUrl, mediaType });
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

  const statItems = [
    { href: "/topics/tea", value: stats.topics, label: "Topics" },
    { href: "/duties", value: stats.duties, label: "Duties" },
    { href: "/rides", value: stats.rides, label: "Rides" },
  ] as const;

  return (
    <PageContainer width="wide">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-10 xl:gap-12">
        <div className={sectionGapClass}>
          <header className="animate-fade-up flex items-start justify-between gap-5">
            <div>
              <p className={sectionLabelClass}>{timeGreeting()}</p>
              <h1 className="font-display mt-2 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[2rem]">
                Hey, {name}
              </h1>
              <p className="body-text mt-2 max-w-sm text-subtle">
                What&apos;s happening in your neighborhood today?
              </p>
            </div>
            <Link
              href="/profile"
              className="press-scale flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-2 transition hover:border-brand-border hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
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

          {!createOpen ? (
            <button
              type="button"
              onClick={() => setManualCreateOpen(true)}
              className="card-interactive animate-fade-up stagger-1 flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-semibold">
                {avatarInitial}
              </span>
              <span className="body-text flex-1 text-muted">Spill some tea…</span>
              <span className={primaryButtonSmClass}>Post</span>
            </button>
          ) : (
            <div id="create-tea-panel" className="scroll-mt-24 animate-panel-in">
              <CreateTopicPanel
                onSubmit={spillTea}
                onClose={() => {
                  setManualCreateOpen(false);
                  router.replace("/topics");
                }}
                disabled={remoteReady && (!backend || loading)}
                submitting={posting}
              />
            </div>
          )}

          <section className="animate-fade-up stagger-3">
            <div className="mb-4 flex items-center justify-between">
              <p className={sectionLabelClass}>Trending near you</p>
              <Link href="/topics/tea" className="text-[13px] font-medium text-subtle transition hover:text-foreground">
                See all →
              </Link>
            </div>

            {loading && remoteReady ? (
              <FeedSkeleton />
            ) : hotTopics.length > 0 ? (
              <div className="flex flex-col gap-3">
                {hotTopics.map((t, i) => (
                  <div key={t.id} className={["animate-fade-up", STAGGER[i] ?? "stagger-6"].join(" ")}>
                    <TeaFeedCard
                      topic={t}
                      messageCount={activity[t.id] ?? 0}
                      preview={previews[t.id]}
                      onShare={() => {}}
                      compact
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
                <p className="text-3xl" aria-hidden>🍵</p>
                <p className="mt-3 text-[15px] font-medium text-foreground">No topics yet</p>
                <p className="body-text mt-1.5">Be the first to start a conversation nearby.</p>
                <button type="button" onClick={() => setManualCreateOpen(true)} className={`${primaryButtonSmClass} mt-5`}>
                  + Post tea
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className={`${sectionGapClass} lg:sticky lg:top-24`}>
          <div className="card-interactive animate-fade-up stagger-2 flex items-center gap-3 px-4 py-3.5">
            <span className="live-dot shrink-0" />
            <p className="body-text text-subtle">
              <strong className="font-medium text-foreground">{stats.topics}</strong> topics live
              {stats.duties > 0 ? <> · <strong className="font-medium text-foreground">{stats.duties}</strong> duties</> : null}
              {stats.rides > 0 ? <> · <strong className="font-medium text-foreground">{stats.rides}</strong> rides</> : null}
            </p>
          </div>

          <section className="animate-fade-up stagger-3">
            <p className={`${sectionLabelClass} mb-3`}>Overview</p>
            <div className="flex flex-col gap-2.5">
              {loading && remoteReady ? (
                <>
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                </>
              ) : (
                statItems.map((item) => (
                  <Link key={item.href} href={item.href} className="card-interactive flex items-center justify-between px-4 py-3.5">
                    <span className="text-[13px] font-medium text-subtle">{item.label}</span>
                    <span className="font-display text-xl font-semibold tabular-nums text-foreground">{item.value}</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="animate-fade-up stagger-4">
            <p className={`${sectionLabelClass} mb-3`}>Explore</p>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="card-interactive flex items-center gap-3.5 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-base" aria-hidden>
                    {action.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-foreground">{action.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}
