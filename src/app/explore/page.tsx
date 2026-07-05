"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBackend } from "@/components/BackendProvider";
import { distanceKm, formatDistanceKm } from "@/lib/geo";
import {
  isNearby,
  isPlottable,
  NEARBY_RADIUS_KM,
  sortByDistance,
} from "@/lib/explore-map-utils";
import {
  createTopicRemote,
  fetchExploreFeeds,
  rankTopicsByMessages,
} from "@/lib/backend/meet-greet-remote";
import { fetchRides } from "@/lib/backend/ride-remote";
import { unknownErrorMessage } from "@/lib/error-message";
import { yellowButtonMdClass } from "@/lib/ui";
import type { RideWithOffers } from "@/lib/types/ride";
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
    <div className="flex h-[min(72vh,580px)] min-h-[340px] w-full items-center justify-center rounded-[var(--radius)] border border-border bg-surface text-sm text-subtle">
      <div className="flex flex-col items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <span>Loading map…</span>
      </div>
    </div>
  );
}

const HOT_TOPIC_MESSAGES = 3;

export default function ExplorePage() {
  const router = useRouter();
  const { backend, remoteReady } = useBackend();

  const localTopics = useMeetGreetStore((s) => s.topics);
  const localMessages = useMeetGreetStore((s) => s.messages);
  const createTopicLocal = useMeetGreetStore((s) => s.createTopic);

  const [rxTopics, setRxTopics] = useState<Awaited<
    ReturnType<typeof fetchExploreFeeds>
  >["topics"]>([]);
  const [rxTopicActivity, setRxTopicActivity] = useState<Record<string, number>>(
    {},
  );
  const [rxRides, setRxRides] = useState<RideWithOffers[]>([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxErr, setRxErr] = useState<string | null>(null);

  const reloadExplore = useCallback(async () => {
    if (!backend || !remoteReady) return;
    setRxLoading(true);
    try {
      const [feed, rides] = await Promise.all([
        fetchExploreFeeds(backend),
        fetchRides(backend),
      ]);
      setRxTopics(feed.topics);
      setRxTopicActivity(feed.topicActivity);
      setRxRides(rides);
      setRxErr(null);
    } catch (e) {
      setRxErr(unknownErrorMessage(e, "Could not sync explore feed."));
    } finally {
      setRxLoading(false);
    }
  }, [backend, remoteReady]);

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
    if (!backend || !remoteReady) return;

    const channel = backend
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_requests" },
        () => void reloadExplore(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_offers" },
        () => void reloadExplore(),
      )
      .subscribe();

    return () => {
      void backend.removeChannel(channel);
    };
  }, [backend, remoteReady, reloadExplore]);

  const viewportRef = useRef({ lat: 19.076, lng: 72.8777 });
  const [recenterToken, setRecenterToken] = useState(0);
  const [topicTitle, setTopicTitle] = useState("");
  const [locStatus, setLocStatus] = useState<string | null>("Finding your location…");
  const [userPin, setUserPin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [showTea, setShowTea] = useState(true);
  const [showRides, setShowRides] = useState(true);

  const locateMe = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      setLocStatus("Geolocation not supported in this browser.");
      return;
    }
    if (!silent) setLocStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPin({ lat, lng });
        viewportRef.current = { lat, lng };
        setRecenterToken((token) => token + 1);
        setLocStatus(null);
      },
      () => setLocStatus("Could not read location — tap Find me and allow access."),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, []);

  const handleViewportCenter = useCallback((lat: number, lng: number) => {
    const prev = viewportRef.current;
    if (
      Math.abs(prev.lat - lat) < 0.00005 &&
      Math.abs(prev.lng - lng) < 0.00005
    ) {
      return;
    }
    viewportRef.current = { lat, lng };
  }, []);

  useEffect(() => {
    queueMicrotask(() => locateMe(true));
  }, [locateMe]);

  const topicActivityLocal = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of localMessages) {
      acc[m.topicId] = (acc[m.topicId] ?? 0) + 1;
    }
    return acc;
  }, [localMessages]);

  const topics = remoteReady ? rxTopics : localTopics;
  const topicActivity = remoteReady ? rxTopicActivity : topicActivityLocal;
  const rides = remoteReady ? rxRides : [];

  const ranked = remoteReady
    ? rankTopicsByMessages(topics, topicActivity)
    : trendingTopics(localTopics, localMessages);

  const nearbyTopics = useMemo(() => {
    const plottable = ranked.filter((topic) => isPlottable(topic.lat, topic.lng));
    if (!userPin) return plottable;
    return sortByDistance(
      plottable.filter((topic) =>
        isNearby(topic.lat, topic.lng, userPin.lat, userPin.lng),
      ),
      userPin.lat,
      userPin.lng,
      (topic) => ({ lat: topic.lat, lng: topic.lng }),
    );
  }, [ranked, userPin]);

  const nearbyRides = useMemo(() => {
    const open = rides.filter(
      (ride) =>
        ride.status === "open" &&
        ride.pickupLat != null &&
        ride.pickupLng != null &&
        isPlottable(ride.pickupLat, ride.pickupLng),
    );
    if (!userPin) return open;
    return sortByDistance(
      open.filter((ride) =>
        isNearby(ride.pickupLat!, ride.pickupLng!, userPin.lat, userPin.lng),
      ),
      userPin.lat,
      userPin.lng,
      (ride) => ({ lat: ride.pickupLat!, lng: ride.pickupLng! }),
    );
  }, [rides, userPin]);

  async function submitTopic(e: React.FormEvent) {
    e.preventDefault();
    const title = topicTitle.trim();
    if (!title) return;

    const lat = userPin?.lat ?? viewportRef.current.lat;
    const lng = userPin?.lng ?? viewportRef.current.lng;

    if (remoteReady && backend) {
      try {
        const tid = await createTopicRemote(backend, {
          title,
          lat,
          lng,
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

    const id = createTopicLocal({ title, lat, lng });
    setTopicTitle("");
    router.push(`/topics/${id}`);
  }

  const msgCountForRow = (topicId: string) =>
    remoteReady ? (topicActivity[topicId] ?? 0) : topicMessageCount(topicId, localMessages);

  function layerButtonClass(active: boolean): string {
    return [
      "rounded-full px-3 py-1 text-xs font-bold transition",
      active
        ? "bg-brand text-white"
        : "border border-border bg-background text-subtle hover:text-foreground",
    ].join(" ");
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-8">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Map
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-subtle sm:mx-0">
          Trending tea hotspots and open rides near you. Orange glow = hot topics, blue
          route = ride pickup → drop. Blue circle = {NEARBY_RADIUS_KM} km around you.
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setShowTea((v) => !v)}
                className={layerButtonClass(showTea)}
              >
                🍵 Tea
              </button>
              <button
                type="button"
                onClick={() => setShowRides((v) => !v)}
                className={layerButtonClass(showRides)}
              >
                🚗 Rides
              </button>
            </div>
            <button
              type="button"
              onClick={() => locateMe(false)}
              className={`${yellowButtonMdClass} w-full sm:w-auto`}
            >
              📍 Find me
            </button>
          </div>
          {locStatus ? (
            <p className="text-center text-xs text-subtle sm:text-left">{locStatus}</p>
          ) : userPin ? (
            <p className="text-center text-xs text-subtle sm:text-left">
              Showing pins within {NEARBY_RADIUS_KM} km of you · {nearbyTopics.length}{" "}
              topics · {nearbyRides.length} rides
            </p>
          ) : null}
          <div className="mx-auto h-[min(72vh,580px)] min-h-[340px] w-full max-w-3xl overflow-hidden rounded-[1.5rem] bg-sky-200 p-0 lg:max-w-none">
            <ExploreMap
              topics={topics}
              rides={rides}
              topicActivity={topicActivity}
              hotThreshold={HOT_TOPIC_MESSAGES}
              onViewportCenter={handleViewportCenter}
              userLocate={userPin}
              recenterToken={recenterToken}
              showTea={showTea}
              showRides={showRides}
              nearbyOnly={Boolean(userPin)}
            />
          </div>
        </section>

        <aside className="mx-auto flex w-full max-w-md flex-col gap-6 lg:mx-0 lg:max-w-none">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-center text-sm font-bold text-foreground sm:text-left">
              Trending near you
            </h2>
            <ol className="mt-3 space-y-2">
              {nearbyTopics.slice(0, 6).map((t, i) => {
                const n = msgCountForRow(t.id);
                const dist =
                  userPin != null
                    ? formatDistanceKm(
                        distanceKm(userPin.lat, userPin.lng, t.lat, t.lng),
                      )
                    : null;
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
                          {dist ? ` · ${dist}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {nearbyTopics.length === 0 ? (
                <li className="text-sm text-subtle">
                  {userPin
                    ? "No topics nearby — start one below."
                    : "Allow location to see nearby topics."}
                </li>
              ) : null}
            </ol>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-center text-sm font-bold text-foreground sm:text-left">
              Rides near you
            </h2>
            <ol className="mt-3 space-y-2">
              {nearbyRides.slice(0, 6).map((ride) => {
                const dist =
                  userPin != null
                    ? formatDistanceKm(
                        distanceKm(
                          userPin.lat,
                          userPin.lng,
                          ride.pickupLat!,
                          ride.pickupLng!,
                        ),
                      )
                    : null;
                return (
                  <li key={ride.id}>
                    <Link
                      href={`/rides/${ride.id}`}
                      className="group block rounded-lg px-2 py-2 hover:bg-brand-soft"
                    >
                      <span className="block truncate text-sm font-semibold text-foreground group-hover:underline">
                        {ride.pickupLabel} → {ride.dropLabel}
                      </span>
                      <span className="text-xs text-subtle">
                        {ride.offers.length}{" "}
                        {ride.offers.length === 1 ? "offer" : "offers"}
                        {dist ? ` · ${dist}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {nearbyRides.length === 0 ? (
                <li className="text-sm text-subtle">
                  {userPin
                    ? "No open rides nearby."
                    : "Allow location to see nearby rides."}{" "}
                  <Link href="/rides" className="font-bold text-brand hover:underline">
                    Post a ride
                  </Link>
                </li>
              ) : null}
            </ol>
          </div>

          <form
            id="spill-tea"
            onSubmit={(e) => void submitTopic(e)}
            className="scroll-mt-24 rounded-xl border border-border bg-surface p-4"
          >
            <h2 className="text-center text-sm font-bold text-foreground sm:text-left">
              Start topic here
            </h2>
            <p className="mt-1 text-center text-xs text-subtle sm:text-left">
              Pins at your location{userPin ? "" : " (or map center if location off)"}.
            </p>
            <label className="mt-3 block text-xs font-semibold text-foreground">
              Title
              <input
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="What's the tea?"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <button
              type="submit"
              disabled={remoteReady && (!backend || rxLoading)}
              className={`${yellowButtonMdClass} mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Post topic
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
